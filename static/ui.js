import { icon } from './icons.js';
export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const esc = (value = '') => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const formatDate = (d, opts = {}) => new Date(d).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', ...opts });
export const clockTime = s => `${Math.floor((s||0)/60).toString().padStart(2,'0')}:${Math.floor((s||0)%60).toString().padStart(2,'0')}`;
export function toast(message, error = false) {
  const el = document.createElement('div'); el.className = `toast ${error ? 'error' : ''}`;
  el.innerHTML = `${icon(error ? 'info' : 'check', 'sm')}<span>${esc(message)}</span>`;
  $('#toast-region').append(el); setTimeout(() => el.remove(), 5000);
}
let charts = [];
export function trackChart(chart) { charts.push(chart); }
export function closeModal() { $('#modal').close(); charts.forEach(c => c.destroy()); charts = []; }
export function modal(title, body, wide = false) {
  closeModal(); const d = $('#modal'); d.className = wide ? 'modal-wide' : '';
  d.innerHTML = `<div class="modal-head"><h2 id="modal-title">${esc(title)}</h2><button class="icon-btn" data-close-modal aria-label="关闭弹窗">${icon('close')}</button></div><div class="modal-body">${body}</div>`;
  $('[data-close-modal]', d).onclick = closeModal; d.showModal();
}
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) { const r = e.target.getBoundingClientRect(); if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) closeModal(); } });
$('#modal').addEventListener('cancel', closeModal);
export function messageBox(form, text, success = false) {
  let box = $('.form-message', form);
  if (!box) { box = document.createElement('div'); form.append(box); }
  box.className = `form-message ${success ? 'success' : ''}`; box.setAttribute('role', success ? 'status' : 'alert'); box.textContent = text;
}
export async function busy(button, fn) {
  if (button.disabled) return; button.disabled = true; button.setAttribute('aria-busy','true');
  try { return await fn(); } finally { button.disabled = false; button.removeAttribute('aria-busy'); }
}
export function brand() { return `<span class="brand"><span class="brand-symbol">${icon('leaf')}</span><span class="brand-name">心屿</span><span class="brand-en">MINDFUL</span></span>`; }
