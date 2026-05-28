---
title: 减肥打卡
date: 2026-05-28 18:00:00
---

<style>
.wc-wrap{max-width:800px;margin:0 auto;padding:20px}
.wc-card{background:#fff;border-radius:12px;padding:24px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.wc-card h3{margin:0 0 16px;font-size:18px;color:#333}
.wc-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.wc-stat{background:#f8f9fa;border-radius:8px;padding:16px;text-align:center}
.wc-stat .num{font-size:28px;font-weight:700;color:#005080}
.wc-stat .label{font-size:13px;color:#888;margin-top:4px}
.wc-form{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.wc-form input{border:2px solid #e0e0e0;border-radius:8px;padding:10px 14px;font-size:16px;width:140px;outline:none;transition:border .2s}
.wc-form input:focus{border-color:#005080}
.wc-btn{background:#005080;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:15px;cursor:pointer;transition:background .2s}
.wc-btn:hover{background:#003d5f}
.wc-btn.danger{background:#e74c3c}
.wc-btn.danger:hover{background:#c0392b}
.wc-btn.secondary{background:#95a5a6}
.wc-btn.secondary:hover{background:#7f8c8d}
.wc-calendar{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.wc-calendar .head{font-weight:600;font-size:13px;color:#888;padding:4px}
.wc-calendar .day{padding:8px 4px;border-radius:6px;font-size:13px;color:#666}
.wc-calendar .day.checked{background:#005080;color:#fff;font-weight:600}
.wc-calendar .day.today{border:2px solid #005080}
.wc-calendar .day.other{color:#ccc}
.wc-chart{width:100%;height:200px;position:relative;margin-top:12px}
.wc-chart canvas{width:100%!important;height:100%!important}
.wc-record-list{max-height:300px;overflow-y:auto}
.wc-record{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px}
.wc-record .date{color:#888}
.wc-record .weight{font-weight:600;color:#005080}
.wc-record .diff{font-size:12px}
.wc-record .diff.down{color:#27ae60}
.wc-record .diff.up{color:#e74c3c}
.wc-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
#weightChart{width:100%;height:200px}
</style>

<div class="wc-wrap">
  <div class="wc-card">
    <h3>📊 今日打卡</h3>
    <div class="wc-form">
      <input type="number" id="weightInput" placeholder="体重 (kg)" step="0.1" min="20" max="300">
      <input type="date" id="dateInput">
      <button class="wc-btn" onclick="addRecord()">打卡</button>
    </div>
  </div>

  <div class="wc-card">
    <h3>📈 数据统计</h3>
    <div class="wc-stats">
      <div class="wc-stat"><div class="num" id="statDays">0</div><div class="label">打卡天数</div></div>
      <div class="wc-stat"><div class="num" id="statStreak">0</div><div class="label">连续打卡</div></div>
      <div class="wc-stat"><div class="num" id="statCurrent">-</div><div class="label">当前体重(kg)</div></div>
      <div class="wc-stat"><div class="num" id="statLost">0</div><div class="label">已减(kg)</div></div>
      <div class="wc-stat"><div class="num" id="statMax">-</div><div class="label">最高(kg)</div></div>
      <div class="wc-stat"><div class="num" id="statMin">-</div><div class="label">最低(kg)</div></div>
    </div>
  </div>

  <div class="wc-card">
    <h3>📉 体重趋势</h3>
    <canvas id="weightChart"></canvas>
  </div>

  <div class="wc-card">
    <h3>📅 打卡日历</h3>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <button class="wc-btn secondary" onclick="changeMonth(-1)" style="padding:6px 12px">&lt; 上月</button>
      <span id="calTitle" style="font-weight:600"></span>
      <button class="wc-btn secondary" onclick="changeMonth(1)" style="padding:6px 12px">下月 &gt;</button>
    </div>
    <div class="wc-calendar" id="calendar"></div>
  </div>

  <div class="wc-card">
    <h3>📋 打卡记录</h3>
    <div class="wc-record-list" id="recordList"></div>
    <div class="wc-actions">
      <button class="wc-btn secondary" onclick="exportData()">导出数据</button>
      <button class="wc-btn danger" onclick="clearData()">清除所有数据</button>
    </div>
  </div>
</div>

<script>
(function(){
  const KEY = 'wc_data';
  let calMonth = new Date().getMonth();
  let calYear = new Date().getFullYear();

  document.getElementById('dateInput').valueAsDate = new Date();

  function getData(){
    try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}
  }
  function saveData(d){localStorage.setItem(KEY,JSON.stringify(d))}

  window.addRecord=function(){
    const w=parseFloat(document.getElementById('weightInput').value);
    const d=document.getElementById('dateInput').value;
    if(!w||w<20||w>300){alert('请输入有效体重(20-300kg)');return}
    if(!d){alert('请选择日期');return}
    const data=getData();
    const idx=data.findIndex(r=>r.date===d);
    if(idx>=0){data[idx].weight=w}
    else{data.push({date:d,weight:w})}
    data.sort((a,b)=>a.date.localeCompare(b.date));
    saveData(data);
    document.getElementById('weightInput').value='';
    refresh();
  };

  window.changeMonth=function(d){
    calMonth+=d;
    if(calMonth>11){calMonth=0;calYear++}
    if(calMonth<0){calMonth=11;calYear--}
    renderCalendar();
  };

  window.exportData=function(){
    const data=getData();
    if(!data.length){alert('暂无数据');return}
    const csv='日期,体重(kg)\n'+data.map(r=>r.date+','+r.weight).join('\n');
    const blob=new Blob([csv],{type:'text/csv'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='weight-records.csv';
    a.click();
  };

  window.clearData=function(){
    if(confirm('确定要清除所有打卡数据吗？此操作不可恢复！')){
      localStorage.removeItem(KEY);refresh();
    }
  };

  window.deleteRecord=function(date){
    if(confirm('确定删除 '+date+' 的记录？')){
      const data=getData().filter(r=>r.date!==date);
      saveData(data);refresh();
    }
  };

  function getStreak(data){
    if(!data.length)return 0;
    const today=new Date().toISOString().slice(0,10);
    const dates=data.map(r=>r.date).sort().reverse();
    let streak=0;
    let check=new Date(today);
    for(let i=0;i<365;i++){
      const ds=check.toISOString().slice(0,10);
      if(dates.includes(ds)){streak++;check.setDate(check.getDate()-1)}
      else break;
    }
    return streak;
  }

  function renderStats(data){
    document.getElementById('statDays').textContent=data.length;
    document.getElementById('statStreak').textContent=getStreak(data);
    if(data.length){
      const sorted=[...data].sort((a,b)=>a.date.localeCompare(b.date));
      const cur=sorted[sorted.length-1].weight;
      const first=sorted[0].weight;
      const weights=data.map(r=>r.weight);
      document.getElementById('statCurrent').textContent=cur.toFixed(1);
      document.getElementById('statLost').textContent=(first-cur).toFixed(1);
      document.getElementById('statMax').textContent=Math.max(...weights).toFixed(1);
      document.getElementById('statMin').textContent=Math.min(...weights).toFixed(1);
    }else{
      document.getElementById('statCurrent').textContent='-';
      document.getElementById('statLost').textContent='0';
      document.getElementById('statMax').textContent='-';
      document.getElementById('statMin').textContent='-';
    }
  }

  function renderChart(data){
    const canvas=document.getElementById('weightChart');
    const ctx=canvas.getContext('2d');
    canvas.width=canvas.parentElement.clientWidth;
    canvas.height=200;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const sorted=[...data].sort((a,b)=>a.date.localeCompare(b.date));
    if(sorted.length<2){ctx.fillStyle='#aaa';ctx.textAlign='center';ctx.fillText('至少需要2条数据才能显示趋势图',canvas.width/2,100);return}

    const recent=sorted.slice(-30);
    const weights=recent.map(r=>r.weight);
    const minW=Math.min(...weights)-1;
    const maxW=Math.max(...weights)+1;
    const pad={top:20,right:20,bottom:30,left:50};
    const w=canvas.width-pad.left-pad.right;
    const h=canvas.height-pad.top-pad.bottom;

    ctx.strokeStyle='#e0e0e0';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const y=pad.top+h*i/4;
      ctx.beginPath();ctx.moveTo(pad.left,y);ctx.lineTo(pad.left+w,y);ctx.stroke();
      ctx.fillStyle='#999';ctx.textAlign='right';ctx.font='11px sans-serif';
      ctx.fillText((maxW-(maxW-minW)*i/4).toFixed(1),pad.left-6,y+4);
    }

    ctx.strokeStyle='#005080';ctx.lineWidth=2;ctx.beginPath();
    recent.forEach((r,i)=>{
      const x=pad.left+w*i/(recent.length-1);
      const y=pad.top+h*(1-(r.weight-minW)/(maxW-minW));
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();

    recent.forEach((r,i)=>{
      const x=pad.left+w*i/(recent.length-1);
      const y=pad.top+h*(1-(r.weight-minW)/(maxW-minW));
      ctx.fillStyle='#005080';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();
      if(i%Math.max(1,Math.floor(recent.length/5))===0||i===recent.length-1){
        ctx.fillStyle='#888';ctx.textAlign='center';ctx.font='10px sans-serif';
        ctx.fillText(r.date.slice(5),x,canvas.height-6);
      }
    });
  }

  function renderCalendar(){
    const data=getData();
    const checkedDates=new Set(data.map(r=>r.date));
    const today=new Date().toISOString().slice(0,10);
    const title=document.getElementById('calTitle');
    title.textContent=calYear+'年'+(calMonth+1)+'月';

    const container=document.getElementById('calendar');
    container.innerHTML='';
    ['日','一','二','三','四','五','六'].forEach(d=>{
      const el=document.createElement('div');el.className='head';el.textContent=d;container.appendChild(el);
    });

    const first=new Date(calYear,calMonth,1);
    const last=new Date(calYear,calMonth+1,0);
    const startDay=first.getDay();

    for(let i=0;i<startDay;i++){
      const el=document.createElement('div');el.className='day other';container.appendChild(el);
    }

    for(let d=1;d<=last.getDate();d++){
      const ds=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const el=document.createElement('div');
      el.className='day'+(checkedDates.has(ds)?' checked':'')+(ds===today?' today':'');
      el.textContent=d;
      el.title=checkedDates.has(ds)?data.find(r=>r.date===ds).weight+'kg':'';
      container.appendChild(el);
    }
  }

  function renderRecords(){
    const data=getData().sort((a,b)=>b.date.localeCompare(a.date));
    const container=document.getElementById('recordList');
    if(!data.length){container.innerHTML='<div style="text-align:center;color:#aaa;padding:20px">暂无打卡记录</div>';return}
    container.innerHTML=data.map((r,i)=>{
      const next=data[i+1];
      let diffHtml='';
      if(next){
        const d=(r.weight-next.weight).toFixed(1);
        diffHtml=d>0?'<span class="diff up">+'+d+'</span>':'<span class="diff down">'+d+'</span>';
      }
      return '<div class="record"><span class="date">'+r.date+'</span><span class="weight">'+r.weight.toFixed(1)+' kg '+diffHtml+'</span><span style="cursor:pointer;color:#e74c3c;font-size:12px" onclick="deleteRecord(\''+r.date+'\')">删除</span></div>';
    }).join('');
  }

  function refresh(){renderStats(getData());renderChart(getData());renderCalendar();renderRecords()}
  refresh();
})();
</script>
