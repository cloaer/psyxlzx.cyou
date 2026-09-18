import { api } from './api.js';
import { metrics, activities } from './catalog.js';
import { icon } from './icons.js';
import { $, $$, esc, modal, trackChart, busy, dateKey } from './ui.js';
export function openAnalytics(records, loggedIn) {
  const dates = Object.keys(records).sort().filter(d => Object.keys(records[d].scores||{}).length > 0);
  const overview = ['sleep','happiness','anxiety','depression'];
  const labels = { sleep:'平均睡眠质量', happiness:'平均幸福感', anxiety:'平均焦虑指数', depression:'平均抑郁指数' };
  const values = key => dates.map(d => records[d].scores?.[key]).filter(v => Number.isFinite(v));
  const averages = Object.fromEntries(metrics.map(m => { const v = values(m.key); return [m.key, v.length ? (v.reduce((a,b)=>a+b,0)/v.length).toFixed(1) : null]; }));
  const emptyChart = text => `<div class="chart-empty">${icon('chart')}<span>${text}</span></div>`;
  const allDays = Object.keys(records).filter(d => Object.values(records[d].activities||{}).some(Boolean) || Object.keys(records[d].scores||{}).length);
  modal('看见你的变化', `<p class="analysis-intro">${dates.length ? `基于 ${dates.length} 天真实自评记录 · ${esc(dates[0])} 至 ${esc(dates.at(-1))}` : '还没有自评记录。完成第一次记录后，在这里回顾自己的变化。'}</p><div class="analysis-stats">${overview.map(key=>{const m=metrics.find(m=>m.key===key);return `<div class="analysis-stat">${icon(m.icon)}<div><span>${labels[key]}</span><strong>${averages[key]??'—'}${averages[key]!==null?'<small>/ 10</small>':''}</strong></div></div>`;}).join('')}</div><section class="chart-card"><h3>情绪与睡眠趋势</h3><p>记录每一天，慢慢看见自己的节奏</p>${dates.length?'<div class="chart-area"><canvas id="trend-chart" role="img" aria-label="睡眠、幸福感、焦虑与低落程度随日期的变化"></canvas></div>':emptyChart('记录后显示趋势，不补齐缺失日期')}</section><div class="analysis-chart-pair"><section class="chart-card"><h3>最近一次综合状态</h3>${dates.length?'<div class="chart-area"><canvas id="radar-chart" role="img" aria-label="最近一次自评的五项状态"></canvas></div><p>焦虑、低落以 10 − 自评分反向展示；越外侧表示状态越好。</p>':emptyChart('暂无综合状态')}</section><section class="chart-card"><h3>健康活动统计</h3>${allDays.length?'<div class="chart-area"><canvas id="activity-chart" role="img" aria-label="四类健康活动的记录天数"></canvas></div>':emptyChart('暂无活动记录')}</section></div><section class="insight-box"><h3>给自己的一个参考</h3><p>${dates.length?'根据你主动填写的记录，生成一份个性化回顾。':'记录积累后，再来看看哪些变化值得留意。'}</p><div id="insights-result"></div><button class="btn soft small" id="generate-insights" ${dates.length && loggedIn?'':'disabled'}>${icon('leaf','sm')}生成个性化洞察</button><div id="insight-error" role="alert"></div></section><p class="analysis-note">以上为 0–10 分主观日记自评，不是诊断量表。缺失记录不计入平均值；洞察由 AI 基于实际记录生成。</p>`, true);
  const hasCharts = dates.length || allDays.length;
  if (hasCharts && !window.Chart) { $$('.chart-area').forEach(el => el.innerHTML=emptyChart('图表组件加载失败，请刷新后重试')); }
  else if (hasCharts) {
    Chart.defaults.font.family='"PingFang SC", "Microsoft YaHei", sans-serif'; Chart.defaults.color='#829078';
    const base={responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{usePointStyle:true,boxWidth:7,padding:14,font:{size:11}}}},scales:{x:{grid:{display:false},ticks:{font:{size:10}}},y:{min:0,max:10,ticks:{stepSize:2,font:{size:10}},grid:{color:'#edf1e7'}}}};
    if(dates.length){
      // Insert nulls for missing calendar dates instead of inventing or interpolating observations.
      const days=[];for(let day=new Date(dates[0]+'T12:00:00'),end=new Date(dates.at(-1)+'T12:00:00');day<=end;day.setDate(day.getDate()+1)) days.push(dateKey(day));
      trackChart(new Chart($('#trend-chart'),{type:'line',data:{labels:days.map(d=>d.slice(5)),datasets:overview.map(key=>({label:metrics.find(m=>m.key===key).title,data:days.map(d=>records[d]?.scores?.[key]??null),borderColor:metrics.find(m=>m.key===key).color,backgroundColor:metrics.find(m=>m.key===key).color,borderWidth:2,tension:.3,pointRadius:3,spanGaps:false}))},options:base}));
      const last=records[dates.at(-1)].scores;
      trackChart(new Chart($('#radar-chart'),{type:'radar',data:{labels:['睡眠','幸福感','平静程度','情绪舒适','总体健康'],datasets:[{label:dates.at(-1),data:[last.sleep,last.happiness,last.anxiety==null?null:10-last.anxiety,last.depression==null?null:10-last.depression,last.health],borderColor:'#63835a',backgroundColor:'#63835a22',borderWidth:2,pointRadius:3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{r:{min:0,max:10,ticks:{display:false},grid:{color:'#e4eadc'},angleLines:{color:'#e4eadc'},pointLabels:{font:{size:11}}}}}}));
    }
    if(allDays.length)trackChart(new Chart($('#activity-chart'),{type:'bar',data:{labels:activities.map(a=>a.title),datasets:[{label:'记录天数',data:activities.map(a=>allDays.filter(d=>records[d].activities?.[a.key]===true).length),backgroundColor:['#86a376','#9bb3c0','#c5b491','#b4a3b3'],borderRadius:6,barPercentage:.5}]},options:{...base,plugins:{legend:{display:false}},scales:{...base.scales,y:{beginAtZero:true,ticks:{precision:0},grid:{color:'#edf1e7'}}}}}));
  }
  $('#generate-insights').onclick=e=>busy(e.currentTarget,async()=>{
    $('#insight-error').textContent='';$('#insights-result').textContent='正在根据记录生成…';
    try{const result=await api('/insights',{method:'POST',body:{}});$('#insights-result').innerHTML=result.insights.map(i=>`<div class="insight-item"><span class="tag ${['success','warning','info'].includes(i.level)?i.level:'info'}">${({success:'积极变化',warning:'值得留意',info:'日常参考'})[i.level]||'日常参考'}</span><span>${esc(i.text)}</span></div>`).join('');}
    catch(error){$('#insights-result').textContent='';$('#insight-error').innerHTML=`<p class="form-message">${esc(error.message)}</p>`;}
  });
}
