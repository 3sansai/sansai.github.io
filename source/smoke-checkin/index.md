---
title: 戒烟打卡
date: 2026-05-28 18:01:00
---

<style>
.sc-wrap{max-width:800px;margin:0 auto;padding:20px}
.sc-card{background:#fff;border-radius:12px;padding:24px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.sc-card h3{margin:0 0 16px;font-size:18px;color:#333}
.sc-hero{text-align:center;padding:30px 20px;background:linear-gradient(135deg,#27ae60,#2ecc71);border-radius:12px;color:#fff;margin-bottom:20px}
.sc-hero .days{font-size:72px;font-weight:800;line-height:1}
.sc-hero .label{font-size:18px;margin-top:8px;opacity:.9}
.sc-hero .sub{font-size:14px;margin-top:4px;opacity:.7}
.sc-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.sc-stat{background:#f8f9fa;border-radius:8px;padding:16px;text-align:center}
.sc-stat .num{font-size:24px;font-weight:700;color:#27ae60}
.sc-stat .label{font-size:13px;color:#888;margin-top:4px}
.sc-form{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.sc-form input{border:2px solid #e0e0e0;border-radius:8px;padding:10px 14px;font-size:15px;outline:none;transition:border .2s}
.sc-form input:focus{border-color:#27ae60}
.sc-form input[type=number]{width:100px}
.sc-form input[type=date]{width:160px}
.sc-btn{background:#27ae60;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:15px;cursor:pointer;transition:background .2s}
.sc-btn:hover{background:#219a52}
.sc-btn.danger{background:#e74c3c}
.sc-btn.danger:hover{background:#c0392b}
.sc-btn.secondary{background:#95a5a6}
.sc-btn.secondary:hover{background:#7f8c8d}
.sc-btn.big{font-size:18px;padding:14px 40px;border-radius:12px}
.sc-timeline{position:relative;padding-left:30px}
.sc-timeline::before{content:'';position:absolute;left:10px;top:0;bottom:0;width:3px;background:#e0e0e0}
.sc-timeline-item{position:relative;margin-bottom:20px;padding-left:20px}
.sc-timeline-item::before{content:'';position:absolute;left:-24px;top:4px;width:14px;height:14px;border-radius:50%;border:3px solid #e0e0e0;background:#fff}
.sc-timeline-item.done::before{background:#27ae60;border-color:#27ae60}
.sc-timeline-item .title{font-weight:600;color:#333}
.sc-timeline-item .desc{font-size:13px;color:#888;margin-top:2px}
.sc-calendar{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.sc-calendar .head{font-weight:600;font-size:13px;color:#888;padding:4px}
.sc-calendar .day{padding:8px 4px;border-radius:6px;font-size:13px;color:#666}
.sc-calendar .day.checked{background:#27ae60;color:#fff;font-weight:600}
.sc-calendar .day.today{border:2px solid #27ae60}
.sc-calendar .day.other{color:#ccc}
.sc-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.sc-checkin-btn{display:block;margin:0 auto}
.sc-countdown{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.sc-countdown .item{text-align:center}
.sc-countdown .num{font-size:36px;font-weight:700;color:#27ae60}
.sc-countdown .label{font-size:12px;color:#888}
</style>

<div class="sc-wrap">
  <div id="heroSection" class="sc-hero" style="display:none">
    <div class="label">已成功戒烟</div>
    <div class="days" id="heroDays">0</div>
    <div class="label">天</div>
    <div class="sub" id="heroSub"></div>
  </div>

  <div class="sc-card" id="setupCard">
    <h3>🚭 开始戒烟</h3>
    <div class="sc-form">
      <label>戒烟日期：</label>
      <input type="date" id="startDate">
      <label>每天抽：</label>
      <input type="number" id="perDay" placeholder="支/天" value="20" min="1" max="100">
      <label>每包：</label>
      <input type="number" id="pricePerPack" placeholder="元/包" value="25" min="1" max="200">
      <label>每包支数：</label>
      <input type="number" id="perPack" placeholder="支/包" value="20" min="1" max="50">
    </div>
    <div style="margin-top:16px">
      <button class="sc-btn big sc-checkin-btn" onclick="startQuit()">开始戒烟</button>
    </div>
  </div>

  <div class="sc-card" id="checkinCard" style="display:none">
    <h3>✅ 今日打卡</h3>
    <div style="text-align:center">
      <button class="sc-btn big sc-checkin-btn" id="todayBtn" onclick="todayCheckin()">今日打卡</button>
      <div id="todayStatus" style="margin-top:8px;color:#888;font-size:14px"></div>
    </div>
  </div>

  <div class="sc-card" id="countdownCard" style="display:none">
    <h3>⏱️ 戒烟时长</h3>
    <div class="sc-countdown">
      <div class="item"><div class="num" id="cdDays">0</div><div class="label">天</div></div>
      <div class="item"><div class="num" id="cdHours">0</div><div class="label">小时</div></div>
      <div class="item"><div class="num" id="cdMins">0</div><div class="label">分钟</div></div>
    </div>
  </div>

  <div class="sc-card" id="statsCard" style="display:none">
    <h3>📊 数据统计</h3>
    <div class="sc-stats">
      <div class="sc-stat"><div class="num" id="statDays">0</div><div class="label">戒烟天数</div></div>
      <div class="sc-stat"><div class="num" id="statCigs">0</div><div class="label">少抽(支)</div></div>
      <div class="sc-stat"><div class="num" id="statSaved">¥0</div><div class="label">已省(元)</div></div>
      <div class="sc-stat"><div class="num" id="statLife">0</div><div class="label">延长寿命(天)</div></div>
      <div class="sc-stat"><div class="num" id="statCheckins">0</div><div class="label">打卡次数</div></div>
      <div class="sc-stat"><div class="num" id="statStreak">0</div><div class="label">连续打卡</div></div>
    </div>
  </div>

  <div class="sc-card" id="healthCard" style="display:none">
    <h3>💪 健康恢复时间线</h3>
    <div class="sc-timeline" id="timeline"></div>
  </div>

  <div class="sc-card" id="calCard" style="display:none">
    <h3>📅 打卡日历</h3>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <button class="sc-btn secondary" onclick="changeMonth(-1)" style="padding:6px 12px">&lt; 上月</button>
      <span id="calTitle" style="font-weight:600"></span>
      <button class="sc-btn secondary" onclick="changeMonth(1)" style="padding:6px 12px">下月 &gt;</button>
    </div>
    <div class="sc-calendar" id="calendar"></div>
  </div>

  <div class="sc-card" id="actionCard" style="display:none">
    <div class="sc-actions">
      <button class="sc-btn secondary" onclick="resetData()">重新开始</button>
      <button class="sc-btn danger" onclick="clearData()">清除所有数据</button>
    </div>
  </div>
</div>

<script>
(function(){
  const KEY='sc_data';
  let calMonth=new Date().getMonth();
  let calYear=new Date().getFullYear();

  document.getElementById('startDate').valueAsDate=new Date();

  function getData(){try{return JSON.parse(localStorage.getItem(KEY))||null}catch(e){return null}}
  function saveData(d){localStorage.setItem(KEY,JSON.stringify(d))}

  function getHealthTimeline(){
    return[
      {time:'20分钟',title:'心率恢复正常',desc:'血压和脉搏开始下降'},
      {time:'8小时',title:'血液含氧量恢复',desc:'血液中一氧化碳水平降至正常'},
      {time:'24小时',title:'心脏病风险开始下降',desc:'血液中氧气含量恢复正常'},
      {time:'48小时',title:'味觉和嗅觉改善',desc:'神经末梢开始再生'},
      {time:'72小时',title:'呼吸更轻松',desc:'支气管开始放松，肺功能提升'},
      {time:'2周',title:'循环系统改善',desc:'走路变得更容易'},
      {time:'1个月',title:'肺功能提升30%',desc:'咳嗽和气短减少'},
      {time:'3个月',title:'肺功能进一步改善',desc:'肺部纤毛再生，感染风险降低'},
      {time:'9个月',title:'肺部自我修复',desc:'咳嗽和呼吸困难显著减少'},
      {time:'1年',title:'心脏病风险减半',desc:'冠心病风险降至吸烟者的一半'},
      {time:'5年',title:'中风风险降低',desc:'中风风险降至非吸烟者水平'},
      {time:'10年',title:'肺癌风险减半',desc:'肺癌死亡率降至吸烟者的一半'},
      {time:'15年',title:'心脏病风险等同非吸烟者',desc:'冠心病风险与从未吸烟者相同'}
    ];
  }

  window.startQuit=function(){
    const sd=document.getElementById('startDate').value;
    if(!sd){alert('请选择戒烟开始日期');return}
    const data={
      startDate:sd,
      perDay:parseInt(document.getElementById('perDay').value)||20,
      pricePerPack:parseFloat(document.getElementById('pricePerPack').value)||25,
      perPack:parseInt(document.getElementById('perPack').value)||20,
      checkins:[sd]
    };
    saveData(data);
    refresh();
  };

  window.todayCheckin=function(){
    const data=getData();
    if(!data)return;
    const today=new Date().toISOString().slice(0,10);
    if(!data.checkins.includes(today)){
      data.checkins.push(today);
      data.checkins.sort();
      saveData(data);
    }
    refresh();
  };

  window.changeMonth=function(d){
    calMonth+=d;
    if(calMonth>11){calMonth=0;calYear++}
    if(calMonth<0){calMonth=11;calYear--}
    renderCalendar();
  };

  window.resetData=function(){
    if(confirm('确定要重新开始吗？所有数据将被清除！')){
      localStorage.removeItem(KEY);refresh();
    }
  };

  window.clearData=function(){
    if(confirm('确定要清除所有数据吗？此操作不可恢复！')){
      localStorage.removeItem(KEY);refresh();
    }
  };

  function getDaysBetween(d1,d2){
    return Math.floor((new Date(d2)-new Date(d1))/(1000*60*60*24));
  }

  function getStreak(checkins){
    if(!checkins.length)return 0;
    const today=new Date().toISOString().slice(0,10);
    const sorted=[...checkins].sort().reverse();
    let streak=0;
    let check=new Date(today);
    for(let i=0;i<365;i++){
      const ds=check.toISOString().slice(0,10);
      if(sorted.includes(ds)){streak++;check.setDate(check.getDate()-1)}
      else break;
    }
    return streak;
  }

  function renderUI(){
    const data=getData();
    const hasData=!!data;

    document.getElementById('setupCard').style.display=hasData?'none':'block';
    document.getElementById('heroSection').style.display=hasData?'block':'none';
    document.getElementById('checkinCard').style.display=hasData?'block':'none';
    document.getElementById('countdownCard').style.display=hasData?'block':'none';
    document.getElementById('statsCard').style.display=hasData?'block':'none';
    document.getElementById('healthCard').style.display=hasData?'block':'none';
    document.getElementById('calCard').style.display=hasData?'block':'none';
    document.getElementById('actionCard').style.display=hasData?'block':'none';

    if(!data)return;

    const today=new Date().toISOString().slice(0,10);
    const days=getDaysBetween(data.startDate,today);
    const isCheckedToday=data.checkins.includes(today);

    document.getElementById('heroDays').textContent=days;
    document.getElementById('heroSub').textContent='始于 '+data.startDate;

    const btn=document.getElementById('todayBtn');
    const status=document.getElementById('todayStatus');
    if(isCheckedToday){
      btn.textContent='✅ 今日已打卡';
      btn.style.background='#95a5a6';btn.disabled=true;
      status.textContent='继续保持，你很棒！';
    }else{
      btn.textContent='今日打卡';btn.style.background='#27ae60';btn.disabled=false;
      status.textContent='';
    }

    const startMs=new Date(data.startDate).getTime();
    const diffMs=Date.now()-startMs;
    document.getElementById('cdDays').textContent=Math.floor(diffMs/(1000*60*60*24));
    document.getElementById('cdHours').textContent=Math.floor(diffMs/(1000*60*60)%24);
    document.getElementById('cdMins').textContent=Math.floor(diffMs/(1000*60)%60);

    const cigsSaved=days*data.perDay;
    const moneySaved=(cigsSaved/data.perPack)*data.pricePerPack;
    const lifeDays=Math.floor(cigsSaved*11/(60*24));

    document.getElementById('statDays').textContent=days;
    document.getElementById('statCigs').textContent=cigsSaved;
    document.getElementById('statSaved').textContent='¥'+moneySaved.toFixed(0);
    document.getElementById('statLife').textContent=lifeDays;
    document.getElementById('statCheckins').textContent=data.checkins.length;
    document.getElementById('statStreak').textContent=getStreak(data.checkins);
  }

  function renderTimeline(){
    const data=getData();
    if(!data)return;
    const days=getDaysBetween(data.startDate,new Date().toISOString().slice(0,10));
    const timeline=getHealthTimeline();
    const container=document.getElementById('timeline');
    container.innerHTML=timeline.map(item=>{
      const match=days+'天';
      let done=false;
      const t=item.time;
      if(t.includes('分钟')&&days>=0)done=true;
      else if(t.includes('小时')){const h=parseInt(t);if(days>=1||h<=24)done=true}
      else if(t.includes('天')){const d=parseInt(t);if(days>=d)done=true}
      else if(t.includes('周')){const w=parseInt(t);if(days>=w*7)done=true}
      else if(t.includes('月')){const m=parseInt(t);if(days>=m*30)done=true}
      else if(t.includes('年')){const y=parseInt(t);if(days>=y*365)done=true}
      return '<div class="sc-timeline-item'+(done?' done':'')+'"><div class="title">('+t+') '+item.title+'</div><div class="desc">'+item.desc+'</div></div>';
    }).join('');
  }

  function renderCalendar(){
    const data=getData();
    const checked=data?new Set(data.checkins):new Set();
    const today=new Date().toISOString().slice(0,10);
    document.getElementById('calTitle').textContent=calYear+'年'+(calMonth+1)+'月';

    const container=document.getElementById('calendar');
    container.innerHTML='';
    ['日','一','二','三','四','五','六'].forEach(d=>{
      const el=document.createElement('div');el.className='head';el.textContent=d;container.appendChild(el);
    });

    const first=new Date(calYear,calMonth,1);
    const last=new Date(calYear,calMonth+1,0);
    for(let i=0;i<first.getDay();i++){
      const el=document.createElement('div');el.className='day other';container.appendChild(el);
    }
    for(let d=1;d<=last.getDate();d++){
      const ds=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      const el=document.createElement('div');
      el.className='day'+(checked.has(ds)?' checked':'')+(ds===today?' today':'');
      el.textContent=d;container.appendChild(el);
    }
  }

  function refresh(){renderUI();renderTimeline();renderCalendar()}
  refresh();
  setInterval(function(){
    const data=getData();
    if(data){
      const startMs=new Date(data.startDate).getTime();
      const diffMs=Date.now()-startMs;
      document.getElementById('cdDays').textContent=Math.floor(diffMs/(1000*60*60*24));
      document.getElementById('cdHours').textContent=Math.floor(diffMs/(1000*60*60)%24);
      document.getElementById('cdMins').textContent=Math.floor(diffMs/(1000*60)%60);
    }
  },60000);
})();
</script>
