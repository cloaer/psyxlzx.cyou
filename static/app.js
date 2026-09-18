import { api } from './api.js';
import { icon } from './icons.js';
import { exercises, metrics, activities } from './catalog.js';
import { $, $$, esc, dateKey, formatDate, toast, modal, closeModal, messageBox, busy, brand } from './ui.js';
import { openPlayer, closePlayer, configurePlayer } from './player.js';
import { openAnalytics } from './analytics.js';

const state = { user: null, conversations: [], records: {}, catalog: exercises, filter: 'all', selectedDate: dateKey(), month: new Date().getMonth(), year: new Date().getFullYear(), activeConversation: null, sending: false, failedText: null, historyLimit: 30, loadError: '' };
const nav = [['chat','chat','聊天'],['practice','headphones','练习'],['calendar','calendar','日历'],['profile','user','个人中心']];
let renderVersion = 0;
$('.skip-link').onclick=e=>{e.preventDefault();$('#main')?.focus();};
configurePlayer(()=>!!state.user);
const route = () => location.hash.replace(/^#\/?/,'') || 'login';
function navigate(path) { if(route()===path) render(); else location.hash='/'+path; }
function requireLogin() {
  if(state.user) return true;
  modal('登录后，保存你的记录', '<p class="muted text-sm">为每一次记录留一处属于自己的空间。登录后可以保存对话、健康日记与练习进度。</p><div class="modal-footer"><button class="btn secondary" id="stay-here">继续浏览</button><button class="btn primary" id="go-signin">前往登录</button></div>');
  $('#stay-here').onclick=closeModal;$('#go-signin').onclick=()=>{closeModal();navigate('login');};return false;
}
async function refreshData() {
  if(!state.user) { state.conversations=[];state.records={};return; }
  const data=await api('/data');state.conversations=data.conversations;state.records=data.records;state.user=data.user;
}
function pageTop(kicker,title,description,action='') { return `<div class="page-top"><div><div class="overline">${kicker}</div><h1>${title}</h1>${description?`<p class="description">${description}</p>`:''}</div>${action}</div>`; }
function shell(content, active='chat', cls='') {
  const user=state.user;
  $('#app').innerHTML=`<header class="site-header"><a href="#/chat" aria-label="心屿首页">${brand()}</a><div class="header-right"><span class="header-note">${icon('leaf','sm')}给自己一点时间</span><button class="account-btn" id="account-link"><span class="avatar-small">${user?.avatar?`<img src="${esc(user.avatar)}" alt="个人头像">`:icon('user','sm')}</span><span>${user ? esc(user.nickname || '个人中心') : '登录 / 注册'}</span>${icon('chevron','sm')}</button></div></header><main class="page ${cls}" id="main" tabindex="-1">${content}</main><nav class="bottom-nav" aria-label="主导航">${nav.map(([key,ic,title])=>`<a href="#/${key}" class="nav-item ${active===key?'active':''}" ${active===key?'aria-current="page"':''}>${icon(ic)}<span>${title}</span></a>`).join('')}</nav>`;
  $('#account-link').onclick=()=>navigate(user?'profile':'login');
}
function privacy() {
  modal('关于记录与隐私',`<div class="stack text-sm"><p>心屿用于自我觉察与心理健康研究体验，不提供医疗诊断或急救服务。</p><p>你主动提交的账号信息、对话、健康记录与音频收听进度会保存到平台服务。向 AI 发送消息或生成洞察时，相关内容会提交给大模型服务商处理。请避免输入身份证、住址等无关的个人信息。</p><p>本地联调版本仅用于页面与接口验证。正式参与研究前，研究方应提供项目名称、负责人联系方式、数据用途、保存期限及退出方式，并单独取得研究知情同意。</p><p>日历记录使用 0–10 分主观自评，不等同于标准化心理评估量表。</p></div>`);
}
function renderAuth(mode) {
  const register=mode==='register',forgot=mode==='forgot';
  $('#app').innerHTML=`<main id="main" class="auth-page"><section class="auth-visual" aria-label="静谧的湖面与晨雾山峦"><a href="#/chat">${brand()}</a><div class="auth-copy"><h1>给心绪，<br>一座安静的小岛。</h1><p>在对话里梳理思绪，在日常里看见自己。<br>从此刻开始，慢慢靠近内心。</p></div><div class="auth-visual-footer">${icon('leaf','sm')}对话 · 觉察 · 练习</div></section><section class="auth-content"><div class="auth-form-wrap"><div class="auth-mobile-brand">${brand()}</div><div class="overline">A LITTLE SPACE FOR YOURSELF</div><h2>${forgot?'找回密码':register?'开启你的心屿':'欢迎来到心屿'}</h2><p class="subtitle">${forgot?'输入注册邮箱，获取密码重置说明。':register?'为感受留一个位置，从第一次记录开始。':'给自己片刻停留，让感受被认真对待。'}</p>${!forgot?`<div class="auth-tabs" role="tablist" aria-label="登录或注册"><button role="tab" aria-selected="${!register}" class="${!register?'active':''}" id="login-tab">登录</button><button role="tab" aria-selected="${register}" class="${register?'active':''}" id="register-tab">注册</button></div>`:'<div style="height:28px"></div>'}<form id="auth-form"><label class="form-field"><span>邮箱</span><div class="input-wrap">${icon('mail')}<input name="email" type="email" autocomplete="email" placeholder="请输入你的邮箱" required maxlength="254"></div></label>${!forgot?`<label class="form-field"><span>密码</span><div class="input-wrap">${icon('lock')}<input name="password" type="password" autocomplete="${register?'new-password':'current-password'}" placeholder="${register?'设置密码，至少 6 位':'请输入密码'}" minlength="6" maxlength="128" required><button class="icon-btn password-toggle" type="button" aria-label="显示密码">${icon('eye')}</button></div></label>${register?`<label class="form-field"><span>确认密码</span><div class="input-wrap">${icon('lock')}<input name="confirm" type="password" autocomplete="new-password" placeholder="再次输入密码" minlength="6" maxlength="128" required><button class="icon-btn password-toggle" type="button" aria-label="显示密码">${icon('eye')}</button></div></label><label class="consent"><input name="consent" type="checkbox" required><span>我已阅读并了解<button type="button" id="privacy-link">记录与隐私说明</button>，同意保存主动提交的数据。</span></label>`:`<div class="auth-options"><button type="button" id="forgot-link">忘记密码？</button></div>`}`:''}<button type="submit" class="btn primary full">${forgot?'发送重置说明':register?'创建账号':'登录'}${icon('arrow','sm')}</button></form>${forgot?'<div class="auth-preview"><button id="back-login">返回登录</button></div>':''}<div class="auth-separator"></div><div class="auth-preview"><button id="browse-platform">先浏览平台${icon('arrow','sm')}</button></div><p class="auth-caption">${icon('shield','sm')} 你的感受，值得被温柔以待</p></div></section></main>`;
  $('#browse-platform').onclick=()=>navigate('chat');
  if(!forgot){$('#login-tab').onclick=()=>navigate('login');$('#register-tab').onclick=()=>navigate('register');}
  $('#forgot-link')?.addEventListener('click',()=>navigate('forgot'));
  $('#back-login')?.addEventListener('click',()=>navigate('login'));
  $('#privacy-link')?.addEventListener('click',privacy);
  $$('.password-toggle').forEach(b=>b.onclick=()=>{const input=$('input',b.parentElement),show=input.type==='password';input.type=show?'text':'password';b.innerHTML=icon(show?'eyeOff':'eye');b.setAttribute('aria-label',show?'隐藏密码':'显示密码');});
  $('#auth-form').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,fd=new FormData(form),data=Object.fromEntries(fd);if(register&&data.password!==data.confirm){messageBox(form,'两次输入的密码不一致，请重新确认。');return;}busy($('[type=submit]',form),async()=>{try{const result=await api(forgot?'/auth/forgot':register?'/auth/register':'/auth/login',{method:'POST',body:{email:data.email.trim(),password:data.password,consent:!!data.consent}});if(forgot){messageBox(form,result.message,true);return;}state.user=result.user;await refreshData();toast(register?'账号已创建，现在可以开始第一次记录。':'登录成功');navigate('chat');}catch(error){messageBox(form,error.message);}});};
}
function renderHome() {
  const total=state.conversations.length, today=state.records[dateKey()], hasToday=!!(today&&Object.keys(today.scores||{}).length);
  const sorted=[...state.conversations].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updated_at.localeCompare(a.updated_at));
  shell(`${pageTop('YOUR PERSONAL SPACE','给心绪，一点空间。','无需整理好思绪，从想说的那一句开始。',`<button class="btn primary" id="new-conversation">${icon('plus','sm')}开始新对话</button>`)}<div class="home-grid"><section class="card conversation-panel"><div class="section-heading"><h2>我的对话<span class="count">${total}</span></h2><span class="section-meta">每一次表达，都有意义</span></div>${state.loadError?`<div class="inline-error">${esc(state.loadError)}<button class="btn link" id="retry-load">重试加载</button></div>`:total?`<div class="conversation-list">${sorted.map(c=>`<div class="conversation-row"><button class="conversation-open" data-open-conversation="${esc(c.id)}"><span class="convo-icon">${icon('chat')}</span><span><strong>${esc(c.title)}</strong><small>${formatDate(c.updated_at,{hour:'2-digit',minute:'2-digit'})} · ${c.message_count} 条消息</small></span></button><button class="icon-btn ${c.pinned?'pinned':''}" data-pin="${esc(c.id)}" aria-label="${c.pinned?'取消置顶':'置顶'}${esc(c.title)}">${icon('pin','sm')}</button></div>`).join('')}</div>`:`<div class="conversation-empty"><div class="empty-orbit"><div class="inner">${icon('chat')}</div></div><h2>从第一次对话开始</h2><p>无论是一个困扰、一点情绪，<br>还是暂时说不清的感受，都可以从这里开始。</p><button class="btn primary" id="first-conversation">${icon('plus','sm')}开始聊聊</button></div>`}<div class="cbt-strip"><div class="cbt-strip-title">在对话中，尝试一个新的视角</div><div class="cbt-steps"><div><div class="step-number">01</div><div class="step-title">留意发生了什么</div><div class="step-description">从具体的经历说起</div></div><div><div class="step-number">02</div><div class="step-title">看见想法与感受</div><div class="step-description">听一听内心的声音</div></div><div><div class="step-number">03</div><div class="step-title">找到新的视角</div><div class="step-description">为自己多留一种可能</div></div></div></div></section><aside class="home-aside"><a href="#/practice" class="card lake-card"><span class="overline">A MOMENT OF CALM</span><h2>让注意力<br>回到此刻。</h2><span class="lake-action">去做一个正念练习<span class="round-arrow">${icon('arrow','sm')}</span></span></a><section class="card today-card"><div class="row between"><h3>今天，感觉如何？</h3>${icon('sun','sm')}</div><div class="today-date">${formatDate(new Date(),{weekday:'long'})}</div><div class="today-status">${icon(hasToday?'check':'calendar')}<div><p>${hasToday?'已留下今天的记录':'今天还没有记录'}</p><small>${hasToday?'回顾此刻，也看见变化':'留一点时间，照顾自己'}</small></div></div><button class="btn link full" id="record-today">${hasToday?'查看今天的记录':'记录今天的状态'}${icon('arrow','sm')}</button></section></aside></div><div class="footnote">${icon('info','sm')}AI 对话用于自我探索，不能替代专业诊疗。</div>`,'chat');
  const start=()=>{state.activeConversation=null;state.failedText=null;state.historyLimit=30;navigate('conversation/new');};
  $('#new-conversation').onclick=start;$('#first-conversation')?.addEventListener('click',start);
  $('#record-today').onclick=()=>{state.selectedDate=dateKey();state.month=new Date().getMonth();state.year=new Date().getFullYear();navigate('calendar');};
  $$('[data-open-conversation]').forEach(b=>b.onclick=()=>{state.historyLimit=30;state.failedText=null;navigate('conversation/'+b.dataset.openConversation);});
  $$('[data-pin]').forEach(b=>b.onclick=()=>busy(b,async()=>{try{const c=state.conversations.find(c=>c.id===b.dataset.pin);await api('/conversations/'+c.id,{method:'PATCH',body:{pinned:!c.pinned}});await refreshData();renderHome();}catch(e){toast(e.message,true);}}));
  $('#retry-load')?.addEventListener('click',()=>render());
}
function renderPractice() {
  const cats=[['all','全部练习'],['meditation','冥想'],['breathing','呼吸'],['relaxation','放松']];
  const filtered=state.catalog.filter(x=>state.filter==='all'||x.category===state.filter);
  shell(`${pageTop('BREATHE & BE PRESENT','把这一刻，留给自己。','跟随自己的节奏，选择适合此刻的练习。')}<section class="practice-hero"><div class="overline">SLOW DOWN. COME BACK TO YOU.</div><h2>不必去远方，也能安静下来。</h2><p>从一次呼吸、一点觉察开始，重新感受当下。</p></section><div class="filter-bar"><div class="filters" role="group" aria-label="练习分类">${cats.map(([id,t])=>`<button class="filter ${state.filter===id?'active':''}" aria-pressed="${state.filter===id}" data-filter="${id}">${t}</button>`).join('')}</div><span class="muted text-sm">${filtered.length} 项练习</span></div><div class="exercise-grid">${filtered.map(x=>`<button class="card exercise-card" data-exercise="${x.id}" data-category="${x.category}" aria-label="打开${x.title}播放器"><div class="exercise-icon">${icon(x.icon,'lg')}</div><h3>${x.title}</h3><p>${x.description}</p><div class="exercise-card-footer"><span class="tag ${x.audio_url?'':'neutral'}">${x.audio_url?'音频练习':'音频待上线'}</span><span class="mini-play">${icon('play')}</span></div></button>`).join('')}</div><div class="audio-notice">${icon('info','sm')}练习时保持舒适。如果感到不适，可以随时暂停，恢复自然呼吸。</div>`,'practice');
  $$('[data-filter]').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter;renderPractice();});
  $$('[data-exercise]').forEach(b=>b.onclick=()=>openPlayer(state.catalog.find(x=>x.id===b.dataset.exercise)));
}
function renderCalendar() {
  const first=new Date(state.year,state.month,1),days=new Date(state.year,state.month+1,0).getDate(),offset=(first.getDay()+6)%7;
  const today=dateKey(),selected=state.selectedDate,r=state.records[selected],hasScore=!!Object.keys(r?.scores||{}).length;
  const cells=Array.from({length:offset},()=>'<span></span>').join('')+Array.from({length:days},(_,i)=>{const key=dateKey(new Date(state.year,state.month,i+1)),rec=state.records[key],filled=rec&&(Object.keys(rec.scores||{}).length||Object.values(rec.activities||{}).some(Boolean));return `<button class="day ${key===today?'today':''} ${key===selected?'selected':''}" ${key>today?'disabled':''} data-date="${key}" aria-label="${key}${filled?'，有记录':''}${key===today?'，今天':''}" aria-pressed="${key===selected}">${i+1}${filled?'<span class="record-dot"></span>':''}</button>`;}).join('');
  shell(`${pageTop('A LITTLE CHECK-IN','每一天，都值得被看见。','记录是了解自己的起点，无需追求每一天都完美。',`<button class="btn secondary" id="open-analysis">${icon('chart','sm')}数据分析</button>`)}<div class="calendar-grid"><section class="card calendar-card"><div class="month-heading"><h2>${state.year} 年 ${state.month+1} 月</h2><div class="month-controls"><button class="icon-btn" id="previous-month" aria-label="上个月">${icon('back','sm')}</button><button class="btn soft small" id="back-today">今天</button><button class="icon-btn" id="next-month" aria-label="下个月">${icon('chevron','sm')}</button></div></div><div class="weekday-row">${['一','二','三','四','五','六','日'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-days">${cells}</div><div class="calendar-legend"><span><i class="legend-today"></i>今天</span><span><i class="legend-dot"></i>有记录</span><span class="muted">点击日期查看当天</span></div></section><section class="card date-panel"><div class="row between"><h2>${formatDate(selected+'T12:00:00')}${selected===today?' · 今天':''}</h2><span class="tag ${hasScore?'':'neutral'}">${hasScore?'已记录':'待记录'}</span></div><p>${hasScore?'这是你为这一天留下的感受。':'此刻的感受是什么样的？'}</p><div class="record-summary">${metrics.map(m=>`<div class="record-metric">${icon(m.icon)}<div><label>${m.title}</label><strong>${r?.scores?.[m.key]??'—'}${r?.scores?.[m.key]!=null?'<small> / 10</small>':''}</strong></div></div>`).join('')}</div>${r?.note?`<div class="record-note">${esc(r.note)}</div>`:''}<button class="btn primary full" id="fill-questionnaire">${icon(hasScore?'edit':'plus','sm')}${hasScore?'编辑当天记录':'填写当天问卷'}</button><div class="activity-box"><h3>今天的生活小记</h3><p class="helper">点亮发生过的活动，自动保存</p><div class="activity-grid">${activities.map(a=>`<button class="activity-button ${r?.activities?.[a.key]?'active':''}" data-activity="${a.key}" aria-pressed="${!!r?.activities?.[a.key]}">${icon(a.icon)}<span>${a.title}</span></button>`).join('')}</div><p class="activity-count">每项活动每天计 1 次，可再次点击取消。</p></div></section></div><div class="footnote">${icon('lock','sm')}只记录真实的感受，没有正确或错误的答案。</div>`,'calendar');
  const move=delta=>{const d=new Date(state.year,state.month+delta,1);state.year=d.getFullYear();state.month=d.getMonth();renderCalendar();};
  $('#previous-month').onclick=()=>move(-1);$('#next-month').onclick=()=>move(1);
  $('#back-today').onclick=()=>{const d=new Date();state.month=d.getMonth();state.year=d.getFullYear();state.selectedDate=dateKey();renderCalendar();};
  $$('[data-date]').forEach(b=>b.onclick=()=>{state.selectedDate=b.dataset.date;renderCalendar();});
  $('#fill-questionnaire').onclick=()=>questionnaire(selected);
  $('#open-analysis').onclick=()=>openAnalytics(state.records,!!state.user);
  $$('[data-activity]').forEach(b=>b.onclick=()=>{if(!requireLogin())return;busy(b,async()=>{try{const key=b.dataset.activity;const result=await api('/records/'+selected,{method:'PATCH',body:{activities:{[key]:!state.records[selected]?.activities?.[key]}}});state.records[selected]=result.record;renderCalendar();toast(result.record.activities[key]?'已记录':'已取消该项记录');}catch(error){toast(error.message,true);}});});
}
function questionnaire(day) {
  const r=state.records[day]||{};
  modal(`${formatDate(day+'T12:00:00')} · 状态记录`,`<p class="questionnaire-intro">按照这一天的真实感受选择 0–10 分。所有项目均由你主动填写。</p><form id="questionnaire-form">${metrics.map(m=>`<fieldset class="score-field" style="border-left:0;border-right:0;border-bottom:0;margin:0;padding-left:0;padding-right:0"><legend class="score-title">${icon(m.icon)}${m.title}</legend><div class="score-options">${Array.from({length:11},(_,v)=>`<label class="score-option"><input type="radio" name="${m.key}" value="${v}" required ${r.scores?.[m.key]===v?'checked':''}><span>${v}</span></label>`).join('')}</div><div class="score-extremes"><span>0 · ${m.low}</span><span>10 · ${m.high}</span></div></fieldset>`).join('')}<label class="form-field questionnaire-note"><span>想补充的一句话 <small class="muted">（选填）</small></span><textarea name="note" rows="3" maxlength="1000" placeholder="发生了什么，或有什么想留给自己…">${esc(r.note||'')}</textarea></label><div class="modal-footer"><button type="button" class="btn secondary" id="cancel-questionnaire">取消</button><button type="submit" class="btn primary">${icon('check','sm')}保存记录</button></div></form>`);
  $('#cancel-questionnaire').onclick=closeModal;
  $('#questionnaire-form').onsubmit=e=>{e.preventDefault();if(!state.user){messageBox(e.currentTarget,'请先登录，再保存你的健康记录。');return;}const form=e.currentTarget,fd=new FormData(form),scores=Object.fromEntries(metrics.map(m=>[m.key,Number(fd.get(m.key))]));busy($('[type=submit]',form),async()=>{try{const result=await api('/records/'+day,{method:'PATCH',body:{scores,note:fd.get('note')}});state.records[day]=result.record;closeModal();renderCalendar();toast('已保存这一天的感受');}catch(error){messageBox(form,error.message);}});};
}
function renderProfile() {
  const u=state.user||{},messageCount=state.conversations.reduce((n,c)=>n+c.message_count,0),dayCount=Object.values(state.records).filter(r=>Object.keys(r.scores||{}).length||Object.values(r.activities||{}).some(Boolean)).length;
  const select=(name,label,options)=>`<label class="form-field"><span>${label}</span><select name="${name}"><option value="">请选择（选填）</option>${options.map(o=>`<option ${u[name]===o?'selected':''}>${o}</option>`).join('')}</select></label>`;
  shell(`${pageTop('ABOUT YOU','与你自己，慢慢熟悉。','在这里管理个人信息，回顾你留下的每一步。')}<div class="profile-grid"><div class="stack"><section class="card profile-summary"><button class="avatar-large" id="change-avatar" aria-label="更换头像">${u.avatar?`<img src="${esc(u.avatar)}" alt="个人头像">`:icon('user')}<span class="avatar-edit">${icon('edit')}</span></button><input id="avatar-input" type="file" accept="image/jpeg,image/png,image/webp" hidden><h2>${esc(u.nickname||(state.user?'尚未设置昵称':'尚未登录'))}</h2><p>${esc(u.email||'登录后，开始积累自己的记录')}</p><div class="profile-stats"><div><strong>${state.conversations.length}</strong><span>总对话数</span></div><div><strong>${messageCount}</strong><span>总消息数</span></div><div><strong>${dayCount}</strong><span>记录天数</span></div></div>${!state.user?'<button class="btn soft full" id="profile-login" style="margin-top:24px">登录 / 注册</button>':''}</section><section class="card privacy-card">${icon('shield')}<div><h3>为感受留一处安心的空间</h3><p>个人信息可按需填写。<br>了解信息如何保存和使用。</p><button class="btn link small" id="profile-privacy">查看隐私说明${icon('arrow','sm')}</button></div></section></div><section class="card profile-form"><div class="row between"><h2>个人信息</h2><span class="muted text-sm">均为选填</span></div><form id="profile-form"><div class="form-grid"><label class="form-field span-2"><span>昵称</span><input name="nickname" placeholder="希望怎么称呼你？" maxlength="30" value="${esc(u.nickname||'')}" autocomplete="nickname"></label><label class="form-field"><span>年龄</span><input name="age" type="number" min="1" max="120" step="1" placeholder="请输入年龄" value="${u.age??''}"></label>${select('gender','性别',['女','男','其他','不愿透露'])}<label class="form-field"><span>职业</span><input name="occupation" placeholder="请输入职业" maxlength="60" value="${esc(u.occupation||'')}"></label>${select('education','教育背景',['初中及以下','高中 / 中专','专科','本科','硕士','博士','其他','不愿透露'])}</div><div class="profile-actions"><button class="btn secondary" type="button" id="logout">${icon('logout','sm')}${state.user?'退出登录':'返回首页'}</button><button class="btn primary" type="submit">${icon('check','sm')}保存修改</button></div></form></section></div>`,'profile');
  $('#profile-login')?.addEventListener('click',()=>navigate('login'));$('#profile-privacy').onclick=privacy;
  $('#change-avatar').onclick=()=>{if(requireLogin())$('#avatar-input').click();};
  $('#avatar-input').onchange=async e=>{const file=e.target.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){toast('请选择 5 MB 以内的 JPG、PNG 或 WebP 图片。',true);return;}try{const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const side=Math.min(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,256,256);bitmap.close();const result=await api('/profile',{method:'PATCH',body:{avatar:canvas.toDataURL('image/jpeg',.85)}});state.user=result.user;renderProfile();toast('头像已更新');}catch(error){toast(error.message||'图片读取失败，请换一张图片。',true);}};
  $('#profile-form').onsubmit=e=>{e.preventDefault();if(!requireLogin())return;const form=e.currentTarget,fd=new FormData(form),data=Object.fromEntries(fd);data.age=data.age===''?null:Number(data.age);busy($('[type=submit]',form),async()=>{try{state.user=(await api('/profile',{method:'PATCH',body:data})).user;renderProfile();toast('个人信息已保存');}catch(error){messageBox(form,error.message);}});};
  $('#logout').onclick=async()=>{if(!state.user){navigate('chat');return;}try{await closePlayer();await api('/auth/logout',{method:'POST',body:{}});state.user=null;state.conversations=[];state.records={};state.activeConversation=null;state.failedText=null;navigate('login');toast('已退出登录');}catch(error){toast(error.message,true);}};
}
function chatMarkup() {
  const c=state.activeConversation,title=c?.title||'新的对话';
  shell(`<section class="card chat-shell"><header class="chat-header"><div class="chat-title"><button class="icon-btn" id="back-conversations" aria-label="返回对话列表">${icon('back')}</button><div><h2>${esc(title)}</h2><p>CBT 自我探索 · AI 对话</p></div></div><button class="icon-btn" id="chat-menu-toggle" aria-label="对话菜单" aria-expanded="false">${icon('more')}</button><div class="chat-menu" id="chat-menu" hidden><button id="pin-current" ${c?'':'disabled'}>${icon('pin','sm')}${c?.pinned?'取消置顶':'置顶对话'}</button><button id="clear-current" ${c?'':'disabled'}>${icon('trash','sm')}清空记录</button></div></header><div class="message-area" id="message-area" role="log" aria-live="polite" aria-label="对话消息"></div><div class="chat-input-area"><div id="chat-error-container"></div><form class="composer" id="composer"><textarea id="message-input" rows="1" maxlength="5000" placeholder="写下此刻的想法与感受…" aria-label="消息内容" ${state.sending?'disabled':''}></textarea><button class="send-button" type="submit" aria-label="发送消息" disabled>${icon('send')}</button></form><div class="composer-help"><span>AI 可能出错，请根据自身情况判断。</span><span class="keyboard-help">Enter 发送 · Shift + Enter 换行</span></div></div></section>`,'chat','chat-page');
  $('#back-conversations').onclick=()=>navigate('chat');
  $('#chat-menu-toggle').onclick=e=>{const hidden=!$('#chat-menu').hidden;$('#chat-menu').hidden=hidden;e.currentTarget.setAttribute('aria-expanded',String(!hidden));};
  $('#pin-current').onclick=async()=>{if(!c)return;try{await api('/conversations/'+c.id,{method:'PATCH',body:{pinned:!c.pinned}});c.pinned=!c.pinned;$('#pin-current').innerHTML=`${icon('pin','sm')}${c.pinned?'取消置顶':'置顶对话'}`;$('#chat-menu').hidden=true;toast(c.pinned?'对话已置顶':'已取消置顶');}catch(error){toast(error.message,true);}};
  $('#clear-current').onclick=()=>{if(!c)return;modal('清空这段对话？','<p class="muted text-sm">此操作会删除这段对话中的消息，无法恢复。</p><div class="modal-footer"><button class="btn secondary" id="cancel-clear">取消</button><button class="btn danger" id="confirm-clear">清空记录</button></div>');$('#cancel-clear').onclick=closeModal;$('#confirm-clear').onclick=e=>busy(e.currentTarget,async()=>{try{await api('/conversations/'+c.id+'/messages',{method:'DELETE'});c.messages=[];c.title='新的对话';state.failedText=null;closeModal();chatMarkup();toast('对话记录已清空');}catch(error){toast(error.message,true);}});};
  const input=$('#message-input');input.oninput=()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,120)+'px';$('.send-button').disabled=!input.value.trim()||state.sending;};
  input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(input.value.trim()&&!state.sending)sendMessage(input.value.trim());}};
  $('#composer').onsubmit=e=>{e.preventDefault();if(input.value.trim()&&!state.sending)sendMessage(input.value.trim());};
  renderMessages();if(state.failedText)showChatError(state.failedText.error);
}
function renderMessages() {
  const area=$('#message-area');if(!area)return;const messages=state.activeConversation?.messages||[];
  area.innerHTML=messages.length?`${messages.length>state.historyLimit?'<button class="history-button" id="load-history">加载更早的消息</button>':''}${messages.slice(-state.historyLimit).map(m=>`<article class="message ${m.role}"><span class="message-avatar">${icon(m.role==='user'?'user':'leaf')}</span><div class="message-content"><div class="message-bubble">${esc(m.content)}</div><div class="message-time">${m.role==='assistant'?'AI · ':''}${new Date(m.created_at).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}${m.status==='failed'?' · 回复未完成':''}</div></div></article>`).join('')}`:`<div class="chat-empty">${icon('leaf')}<h2>从此刻的感受开始。</h2><p>可以说说最近发生的一件事，<br>或写下一个一直停留在心里的想法。</p></div>`;
  if(state.sending)area.insertAdjacentHTML('beforeend',`<div class="thinking" role="status"><i></i><i></i><i></i><span>思考中…</span></div>`);
  $('#load-history')?.addEventListener('click',()=>{const old=area.scrollHeight;state.historyLimit+=30;renderMessages();area.scrollTop=area.scrollHeight-old;});
  area.scrollTop=area.scrollHeight;
}
function showChatError(message) {
  if(!$('#chat-error-container'))return;
  $('#chat-error-container').innerHTML=`<div class="chat-error" role="alert"><span>${esc(message)}</span><button class="btn link small" id="retry-message">重试</button></div>`;
  $('#retry-message').onclick=()=>{if(state.failedText&&!state.sending)sendMessage(state.failedText.text,state.failedText.requestId);};
}
async function sendMessage(text,retryId) {
  if(!requireLogin()||state.sending)return;
  state.sending=true;const requestId=retryId||crypto.randomUUID();
  const pending={id:requestId,role:'user',content:text,created_at:new Date().toISOString(),status:'pending'};
  let c=state.activeConversation;
  $('#message-input').value='';$('#message-input').disabled=true;$('.send-button').disabled=true;$('#chat-error-container').innerHTML='';
  try{
    if(!c){c=(await api('/conversations',{method:'POST',body:{}})).conversation;state.activeConversation=c;history.replaceState(null,'','#/conversation/'+c.id);}
    if(!c.messages.some(m=>m.id===requestId))c.messages.push(pending);
    renderMessages();
    const result=await api('/conversations/'+c.id+'/messages',{method:'POST',body:{text,request_id:requestId}});
    c.title=result.conversation.title;c.messages=result.conversation.messages;if(state.activeConversation===c)state.failedText=null;
  }catch(error){if(c){const m=c.messages.find(m=>m.id===requestId);if(m)m.status='failed';}if(state.activeConversation===c)state.failedText={text,requestId,error:error.message};else toast('这次回复未能完成，可以回到原对话重试。',true);}
  finally{
    state.sending=false;
    if(route().startsWith('conversation/') && state.activeConversation===c){chatMarkup();$('#message-input').focus();}
    else if(state.failedText)toast('对话回复未完成，可返回对话重试。',true);
  }
}
async function render() {
  const version=++renderVersion,path=route();closeModal();
  if(['login','register','forgot'].includes(path)){renderAuth(path);return;}
  if(state.user&&!path.startsWith('conversation/')){try{await refreshData();state.loadError='';}catch(error){state.loadError=error.message;toast(error.message,true);}}
  if(version!==renderVersion)return;
  if(path==='chat')renderHome();
  else if(path==='practice')renderPractice();
  else if(path==='calendar')renderCalendar();
  else if(path==='profile')renderProfile();
  else if(path.startsWith('conversation/')){
    const id=path.split('/')[1];
    if(id==='new'){if(state.sending&&state.activeConversation){toast('上一段对话仍在生成，请等待回复结束。');navigate('conversation/'+state.activeConversation.id);return;}if(!state.sending){state.activeConversation=null;state.failedText=null;}chatMarkup();}
    else{
      if(state.sending&&state.activeConversation?.id===id){chatMarkup();return;}
      shell('<div class="loading-line">正在载入对话…</div>','chat','chat-page');
      try{const result=await api('/conversations/'+encodeURIComponent(id));if(version!==renderVersion)return;state.activeConversation=result.conversation;const last=result.conversation.messages.at(-1);state.failedText=last?.role==='user'&&last.status==='failed'?{text:last.content,requestId:last.id,error:'上次回复未能完成，可以重试。'}:null;chatMarkup();}
      catch(error){if(version===renderVersion){toast(error.message,true);navigate('chat');}}
    }
  }else navigate('chat');
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',render);
async function init(){
  const results=await Promise.allSettled([api('/auth/me'),api('/exercises')]);
  if(results[0].status==='fulfilled')state.user=results[0].value.user;
  if(results[1].status==='fulfilled')state.catalog=exercises.map(x=>({...x,...(results[1].value.exercises.find(a=>a.id===x.id)||{})}));
  if(state.user&&['login','register'].includes(route()))navigate('chat');else render();
}
init();
