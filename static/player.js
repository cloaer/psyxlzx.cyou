import { api } from './api.js';
import { $, esc, clockTime, toast } from './ui.js';
import { icon } from './icons.js';
const audio = $('#audio');
let current = null, sessionId = null, played = 0, completed = false, lastTick = null, lastSent = 0, sequence = 0, saveQueue = Promise.resolve();
let canSave = () => false;
export function configurePlayer(isLoggedIn) { canSave = isLoggedIn; }
function payload() { return { exercise_id: current.id, session_id: sessionId, played_seconds: Math.round(played*10)/10, completed, position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0, sequence: ++sequence }; }
function updatePlayed() {
  const now = performance.now();
  if (lastTick !== null && !audio.paused && !audio.seeking && audio.readyState >= 3) played += Math.min((now-lastTick)/1000, 2);
  lastTick = now;
}
export async function persistPlayback(final = false) {
  if (!current?.audio_url || !sessionId || !canSave() || played <= 0) return;
  const data = payload(); lastSent = played;
  if (final) {
    // Keepalive allows the final progress checkpoint to finish on page exit.
    fetch('/api/playback', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'Mindful' }, body: JSON.stringify(data) }).catch(() => {});
    return;
  }
  saveQueue = saveQueue.catch(() => {}).then(() => api('/playback', { method:'POST', body: data }));
  try { await saveQueue; } catch { if ($('#player-status')) $('#player-status').textContent = '收听进度暂未保存，将在下一次同步时重试。'; }
}
export async function closePlayer() {
  updatePlayed(); audio.pause(); await persistPlayback(); audio.removeAttribute('src'); audio.load();
  current = null; sessionId = null; $('#player-root').innerHTML = '';
}
export async function openPlayer(exercise) {
  await closePlayer(); current = exercise; played = 0; completed = false; lastSent = 0; sequence = 0; lastTick = null; sessionId = crypto.randomUUID();
  const ready = !!exercise.audio_url;
  $('#player-root').innerHTML = `<section class="player" aria-label="音频播放器"><div class="player-top"><div class="player-title"><span class="player-art">${icon(exercise.icon)}</span><div><h2>${esc(exercise.title)}</h2><p>正念练习 · 跟随自己的节奏</p></div></div><button id="player-close" class="icon-btn" aria-label="关闭播放器">${icon('close')}</button></div><input id="player-progress" type="range" min="0" max="100" step="0.1" value="0" aria-label="播放进度" disabled><div class="player-time"><span id="player-current">00:00</span><span id="player-duration">--:--</span></div><div class="player-controls"><button class="player-skip" id="player-rewind" aria-label="快退 15 秒" ${ready?'':'disabled'}>${icon('rewind')}<span>15</span></button><button class="player-play" id="player-toggle" aria-label="播放" ${ready?'':'disabled'}>${icon('play')}</button><button class="player-skip" id="player-forward" aria-label="快进 15 秒" ${ready?'':'disabled'}>${icon('forward')}<span>15</span></button></div><div class="player-status" id="player-status" role="status">${ready ? '正在载入音频…' : '此练习的音频尚未上线，请稍后再来。'}</div></section>`;
  $('#player-close').onclick = closePlayer;
  $('#player-toggle').onclick = async () => {
    if (audio.paused) { try { await audio.play(); } catch { $('#player-status').textContent = '播放未能开始，请再次点击播放。'; } }
    else { updatePlayed(); audio.pause(); await persistPlayback(); }
  };
  $('#player-rewind').onclick = () => { audio.currentTime = Math.max(0, audio.currentTime-15); };
  $('#player-forward').onclick = () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime+15); };
  $('#player-progress').oninput = e => { audio.currentTime = Number(e.target.value); };
  if (ready) { audio.src = exercise.audio_url; audio.load(); }
}
function syncTime() {
  if (!current || !$('#player-current')) return;
  $('#player-current').textContent = clockTime(audio.currentTime);
  if (Number.isFinite(audio.duration)) { $('#player-duration').textContent = clockTime(audio.duration); $('#player-progress').max = audio.duration; $('#player-progress').value = audio.currentTime; $('#player-progress').disabled = false; }
}
audio.addEventListener('loadedmetadata', () => { syncTime(); if ($('#player-status')) $('#player-status').textContent = '准备好了，点击播放开始练习。'; });
audio.addEventListener('play', () => { lastTick = performance.now(); $('#player-toggle').innerHTML = icon('pause'); $('#player-toggle').setAttribute('aria-label','暂停'); $('#player-status').textContent = canSave() ? '正在播放，收听进度会自动保存。' : '正在播放；登录后可以保存收听进度。'; });
audio.addEventListener('pause', () => { lastTick = null; if ($('#player-toggle')) { $('#player-toggle').innerHTML = icon('play'); $('#player-toggle').setAttribute('aria-label','播放'); } });
audio.addEventListener('timeupdate', syncTime);
audio.addEventListener('ended', async () => { completed = Number.isFinite(audio.duration) && played >= audio.duration * .9; await persistPlayback(); if ($('#player-status')) $('#player-status').textContent = completed ? '练习已完成，给自己留一点安静的时间。' : '播放已结束。'; });
audio.addEventListener('error', () => { if ($('#player-status')) $('#player-status').textContent = '音频加载失败，请关闭后重试。'; });
setInterval(() => { updatePlayed(); if (played - lastSent >= 10) persistPlayback(); }, 1000);
document.addEventListener('visibilitychange', () => { if (document.hidden) persistPlayback(true); });
window.addEventListener('pagehide', () => persistPlayback(true));
