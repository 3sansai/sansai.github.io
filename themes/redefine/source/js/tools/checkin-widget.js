(function () {
  'use strict';

  const W_KEY = 'ci_weight';
  const S_KEY = 'ci_smoke';
  let calMonth = new Date().getMonth();
  let calYear = new Date().getFullYear();
  let currentTab = 'weight';

  function getW() { try { return JSON.parse(localStorage.getItem(W_KEY)) || []; } catch (e) { return []; } }
  function saveW(d) { localStorage.setItem(W_KEY, JSON.stringify(d)); }
  function getS() { try { return JSON.parse(localStorage.getItem(S_KEY)) || null; } catch (e) { return null; } }
  function saveS(d) { localStorage.setItem(S_KEY, JSON.stringify(d)); }

  function today() { return new Date().toISOString().slice(0, 10); }

  function daysBetween(d1, d2) {
    return Math.floor((new Date(d2) - new Date(d1)) / 86400000);
  }

  function streak(dates) {
    if (!dates || !dates.length) return 0;
    const sorted = [...dates].sort().reverse();
    let s = 0, d = new Date();
    for (let i = 0; i < 400; i++) {
      const ds = d.toISOString().slice(0, 10);
      if (sorted.includes(ds)) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }

  function updateBadge() {
    const badge = document.getElementById('ci-badge');
    if (!badge) return;
    const wd = getW();
    const sr = getSmokeRecords();
    const wDays = wd.length;
    const sDays = sr.length;
    const wStreak = streak(wd.map(r => r.date));
    const sStreak = zeroStreak(sr);
    badge.innerHTML =
      '<span class="badge-icon">&#128293;</span>' +
      '<span class="badge-days">' + Math.max(wDays, sDays) + '</span>' +
      '<span class="badge-label">打卡天</span>';
    badge.title = '减肥' + wDays + '天 | 戒烟连续0支' + sStreak + '天';
  }

  function openModal(tab) {
    currentTab = tab || 'weight';
    document.getElementById('ci-mask').classList.add('active');
    renderTab();
  }

  function closeModal() {
    document.getElementById('ci-mask').classList.remove('active');
  }

  function switchTab(tab) {
    currentTab = tab;
    renderTab();
  }

  function renderTab() {
    document.querySelectorAll('.checkin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === currentTab));
    const body = document.getElementById('ci-body');
    if (currentTab === 'weight') renderWeight(body);
    else renderSmoke(body);
  }

  // ==================== WEIGHT ====================
  function getTodayRecord(data) {
    return data.find(r => r.date === today()) || {};
  }

  function renderWeight(el) {
    const data = getW();
    const todayStr = today();
    const streakNum = streak(data.map(r => r.date));
    let heroDays = data.length;
    let curWeight = '-', lost = '0', maxW = '-', minW = '-';
    if (data.length) {
      const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
      curWeight = sorted[sorted.length - 1].weight.toFixed(1);
      lost = (sorted[0].weight - sorted[sorted.length - 1].weight).toFixed(1);
      maxW = Math.max(...data.map(r => r.weight)).toFixed(1);
      minW = Math.min(...data.map(r => r.weight)).toFixed(1);
    }
    const hasToday = data.some(r => r.date === todayStr);
    const tr = getTodayRecord(data);

    let html = '';
    html += '<div class="checkin-hero weight-hero">';
    html += '<div class="hero-days">' + heroDays + '</div><div class="hero-label">累计打卡天</div>';
    html += '<div class="hero-sub">连续 ' + streakNum + ' 天 | 目标 80kg → 70kg</div></div>';

    // ---- 今日打卡表单 ----
    html += '<div class="checkin-section"><h4>今日打卡</h4>';
    // 第一行：体重 + 日期
    html += '<div class="checkin-form-row">';
    html += '<input type="number" class="checkin-input sm" id="ci-w-input" placeholder="体重kg" step="0.1" min="30" max="200" value="' + (tr.weight || '') + '">';
    html += '<input type="date" class="checkin-input md" id="ci-w-date" value="' + todayStr + '">';
    html += '</div>';
    // 第二行：起床 + 睡觉
    html += '<div class="checkin-form-row">';
    html += '<label style="font-size:13px;color:#888">起床</label><input type="time" class="checkin-input sm" id="ci-w-wake" value="' + (tr.wake || '06:50') + '">';
    html += '<label style="font-size:13px;color:#888">睡觉</label><input type="time" class="checkin-input sm" id="ci-w-sleep" value="' + (tr.sleep || '23:00') + '">';
    html += '</div>';
    // 第三行：蛋白质 + 运动
    html += '<div class="checkin-form-row">';
    html += '<label style="font-size:13px;color:#888">蛋白质g</label><input type="number" class="checkin-input sm" id="ci-w-prot" placeholder="目标>=160" min="0" max="500" value="' + (tr.protein || '') + '">';
    html += '<label style="font-size:13px;color:#888">运动</label>';
    html += '<select class="checkin-input sm" id="ci-w-exer" style="width:110px">';
    ['无', '快走30分', '快走40分', '游泳', '椭圆机', '划船机'].forEach(opt => {
      const sel = (tr.exercise || '无') === opt ? ' selected' : '';
      html += '<option value="' + opt + '"' + sel + '>' + opt + '</option>';
    });
    html += '</select>';
    html += '</div>';
    // 第四行：核心训练 + 吸烟
    html += '<div class="checkin-form-row">';
    html += '<label style="font-size:13px;color:#888">核心训练</label>';
    html += '<select class="checkin-input sm" id="ci-w-core" style="width:110px">';
    ['未做', 'A组(平板)', 'B组(举腿)', 'C组(卷腹)', '休息日'].forEach(opt => {
      const sel = (tr.core || '未做') === opt ? ' selected' : '';
      html += '<option value="' + opt + '"' + sel + '>' + opt + '</option>';
    });
    html += '</select>';
    html += '<label style="font-size:13px;color:#888">吸烟</label><input type="number" class="checkin-input" style="width:60px" id="ci-w-cig" placeholder="0" min="0" max="100" value="' + (tr.cigarettes != null ? tr.cigarettes : '') + '">';
    html += '</div>';
    // 第五行：饮食热量 + 备注
    html += '<div class="checkin-form-row">';
    html += '<label style="font-size:13px;color:#888">热量kcal</label><input type="number" class="checkin-input sm" id="ci-w-cal" placeholder="约1500" min="0" max="5000" value="' + (tr.calories || '') + '">';
    html += '<input type="text" class="checkin-input" style="width:140px" id="ci-w-note" placeholder="备注(可选)" value="' + (tr.note || '') + '">';
    html += '</div>';
    // 打卡按钮
    html += '<button class="checkin-btn primary" onclick="CI.addWeight()" style="width:100%;margin-top:4px">' + (hasToday ? '更新今日打卡' : '打卡') + '</button>';
    html += '</div>';

    // ---- 数据统计 ----
    html += '<div class="checkin-section"><h4>数据统计</h4><div class="checkin-stats">';
    html += sItem(heroDays, '打卡天数') + sItem(streakNum, '连续打卡') + sItem(curWeight, '当前kg');
    html += sItem(lost, '已减kg') + sItem(maxW, '最高kg') + sItem(minW, '最低kg');
    html += '</div></div>';

    // ---- 体重趋势 ----
    html += '<div class="checkin-section"><h4>体重趋势</h4><div class="checkin-chart"><canvas id="ci-w-chart"></canvas></div></div>';

    // ---- 打卡日历 ----
    html += '<div class="checkin-section"><h4>打卡日历</h4>';
    html += '<div class="checkin-cal-nav"><button class="cal-btn" onclick="CI.calNav(-1)">&lt;</button>';
    html += '<span class="cal-title" id="ci-cal-title"></span>';
    html += '<button class="cal-btn" onclick="CI.calNav(1)">&gt;</button></div>';
    html += '<div class="checkin-calendar" id="ci-calendar"></div></div>';

    // ---- 记录列表 ----
    html += '<div class="checkin-section"><h4>记录</h4><div id="ci-w-records"></div>';
    html += '<div class="checkin-actions">';
    html += '<button class="checkin-btn ghost" onclick="CI.exportWeight()">导出CSV</button>';
    html += '<button class="checkin-btn danger" onclick="CI.clearWeight()">清除数据</button>';
    html += '</div></div>';

    el.innerHTML = html;
    drawWeightChart(data);
    renderCalendar(data.map(r => r.date));
    renderWeightRecords(data);
  }

  function sItem(num, label) {
    return '<div class="stat-item"><div class="stat-num">' + num + '</div><div class="stat-label">' + label + '</div></div>';
  }

  function drawWeightChart(data) {
    const canvas = document.getElementById('ci-w-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 160;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) { ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'; ctx.fillText('至少2条数据', canvas.width / 2, 80); return; }
    const recent = sorted.slice(-30);
    const ws = recent.map(r => r.weight);
    const minW = Math.min(...ws) - 0.5, maxW = Math.max(...ws) + 0.5;
    const pad = { t: 16, r: 16, b: 24, l: 42 };
    const w = canvas.width - pad.l - pad.r, h = canvas.height - pad.t - pad.b;
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = pad.t + h * i / 3;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + w, y); ctx.stroke();
      ctx.fillStyle = '#999'; ctx.textAlign = 'right'; ctx.font = '10px sans-serif';
      ctx.fillText((maxW - (maxW - minW) * i / 3).toFixed(1), pad.l - 4, y + 3);
    }
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5; ctx.beginPath();
    recent.forEach((r, i) => {
      const x = pad.l + w * i / (recent.length - 1);
      const y = pad.t + h * (1 - (r.weight - minW) / (maxW - minW));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    recent.forEach((r, i) => {
      const x = pad.l + w * i / (recent.length - 1);
      const y = pad.t + h * (1 - (r.weight - minW) / (maxW - minW));
      ctx.fillStyle = '#6366f1'; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      if (i % Math.max(1, Math.floor(recent.length / 6)) === 0 || i === recent.length - 1) {
        ctx.fillStyle = '#999'; ctx.textAlign = 'center'; ctx.font = '9px sans-serif';
        ctx.fillText(r.date.slice(5), x, canvas.height - 4);
      }
    });
  }

  function renderCalendar(checkedDates) {
    const set = new Set(checkedDates);
    const todayStr = today();
    document.getElementById('ci-cal-title').textContent = calYear + '年' + (calMonth + 1) + '月';
    const c = document.getElementById('ci-calendar');
    c.innerHTML = '';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(d => {
      c.innerHTML += '<div class="cal-head">' + d + '</div>';
    });
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    for (let i = 0; i < first.getDay(); i++) c.innerHTML += '<div class="cal-day other"></div>';
    for (let d = 1; d <= last.getDate(); d++) {
      const ds = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const cls = 'cal-day' + (set.has(ds) ? ' checked' : '') + (ds === todayStr ? ' today' : '');
      c.innerHTML += '<div class="' + cls + '">' + d + '</div>';
    }
  }

  function renderWeightRecords(data) {
    const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
    const c = document.getElementById('ci-w-records');
    if (!sorted.length) { c.innerHTML = '<div style="text-align:center;color:#aaa;padding:12px">暂无记录</div>'; return; }
    c.innerHTML = sorted.slice(0, 20).map((r, i) => {
      const next = sorted[i + 1];
      let diff = '';
      if (next) {
        const d = (r.weight - next.weight).toFixed(1);
        diff = d > 0 ? '<span style="color:#e74c3c;font-size:11px">+' + d + '</span>' : '<span style="color:#27ae60;font-size:11px">' + d + '</span>';
      }
      let detail = [];
      if (r.wake) detail.push(r.wake + '起');
      if (r.sleep) detail.push(r.sleep + '睡');
      if (r.protein) detail.push('蛋白' + r.protein + 'g');
      if (r.exercise && r.exercise !== '无') detail.push(r.exercise);
      if (r.core && r.core !== '未做') detail.push(r.core);
      if (r.cigarettes != null && r.cigarettes > 0) detail.push('烟' + r.cigarettes + '支');
      if (r.calories) detail.push(r.calories + 'kcal');
      const detailStr = detail.length ? '<div style="font-size:11px;color:#999;margin-top:2px">' + detail.join(' | ') + '</div>' : '';
      return '<div class="checkin-record" style="flex-wrap:wrap"><div style="display:flex;align-items:center;gap:8px;flex:1;min-width:200px"><span class="rec-date">' + r.date + '</span><span class="rec-val">' + r.weight.toFixed(1) + 'kg ' + diff + '</span></div><span class="rec-del" onclick="CI.delWeight(\'' + r.date + '\')">删除</span>' + detailStr + '</div>';
    }).join('');
  }

  // ==================== SMOKE ====================
  function getSmokeRecords() { try { return JSON.parse(localStorage.getItem(S_KEY)) || []; } catch (e) { return []; } }
  function saveSmokeRecords(d) { localStorage.setItem(S_KEY, JSON.stringify(d)); }

  function zeroStreak(records) {
    if (!records.length) return 0;
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    let s = 0;
    for (const r of sorted) { if (r.count === 0) s++; else break; }
    return s;
  }

  function firstZeroDate(records) {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const r = sorted.find(r => r.count === 0);
    return r ? r.date : null;
  }

  function renderSmoke(el) {
    const records = getSmokeRecords();
    const todayStr = today();
    const todayRec = records.find(r => r.date === todayStr);
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const lastRec = sorted.length ? sorted[sorted.length - 1] : null;
    const yesterdayRec = records.find(r => r.date === new Date(Date.now() - 86400000).toISOString().slice(0, 10));

    const totalDays = records.length;
    const zStreak = zeroStreak(records);
    const totalCigs = records.reduce((s, r) => s + r.count, 0);
    const avgCigs = totalDays ? (totalCigs / totalDays).toFixed(1) : '-';
    const zeroDays = records.filter(r => r.count === 0).length;
    const firstZero = firstZeroDate(records);
    const smokeFreeDays = firstZero ? daysBetween(firstZero, todayStr) + 1 : 0;

    // Today comparison
    let compareHtml = '';
    if (todayRec && yesterdayRec) {
      const diff = todayRec.count - yesterdayRec.count;
      if (diff < 0) compareHtml = '<span style="color:#27ae60">比昨天少 ' + Math.abs(diff) + ' 支</span>';
      else if (diff > 0) compareHtml = '<span style="color:#e74c3c">比昨天多 ' + diff + ' 支</span>';
      else compareHtml = '<span style="color:#888">和昨天一样</span>';
    }

    let html = '';

    // Hero
    html += '<div class="checkin-hero smoke-hero">';
    if (todayRec) {
      if (todayRec.count === 0) {
        html += '<div class="hero-days">0</div><div class="hero-label">今日吸烟：0 支</div>';
        html += '<div class="hero-sub">连续 ' + zStreak + ' 天未吸烟</div>';
      } else {
        html += '<div class="hero-days">' + todayRec.count + '</div><div class="hero-label">今日吸烟（支）</div>';
        html += '<div class="hero-sub">目标：0 支 | ' + (compareHtml || '记录第一天') + '</div>';
      }
    } else {
      html += '<div class="hero-label" style="font-size:20px">记录今天的吸烟量</div>';
      html += '<div class="hero-sub">目标：每天 0 支</div>';
    }
    html += '</div>';

    // Today input
    html += '<div class="checkin-section"><h4>今日记录</h4>';
    html += '<div class="checkin-form-row">';
    html += '<input type="number" class="checkin-input sm" id="ci-s-count" placeholder="支数" min="0" max="200" value="' + (todayRec ? todayRec.count : '') + '">';
    html += '<input type="date" class="checkin-input md" id="ci-s-date" value="' + todayStr + '">';
    html += '<button class="checkin-btn primary" onclick="CI.addSmoke()">' + (todayRec ? '更新' : '打卡') + '</button>';
    html += '</div>';
    if (todayRec && yesterdayRec) html += '<div style="font-size:13px;margin-top:6px">' + compareHtml + '</div>';
    html += '</div>';

    // Stats
    html += '<div class="checkin-section"><h4>数据统计</h4><div class="checkin-stats">';
    html += sItem(totalDays, '记录天数') + sItem(zStreak, '连续0支') + sItem(zeroDays + '/' + totalDays, '0支天数');
    html += sItem(avgCigs, '日均(支)') + sItem(totalCigs, '总吸烟(支)') + sItem(smokeFreeDays, '已戒烟(天)');
    html += '</div></div>';

    // Trend chart
    html += '<div class="checkin-section"><h4>吸烟趋势</h4><div class="checkin-chart"><canvas id="ci-s-chart"></canvas></div></div>';

    // Health timeline
    const days = firstZero ? daysBetween(firstZero, todayStr) : 0;
    html += renderSmokeTimeline(days);

    // Calendar
    html += '<div class="checkin-section"><h4>打卡日历</h4>';
    html += '<div class="checkin-cal-nav"><button class="cal-btn" onclick="CI.calNav(-1)">&lt;</button>';
    html += '<span class="cal-title" id="ci-cal-title"></span>';
    html += '<button class="cal-btn" onclick="CI.calNav(1)">&gt;</button></div>';
    html += '<div class="checkin-calendar" id="ci-calendar"></div></div>';

    // Records
    html += '<div class="checkin-section"><h4>记录</h4><div id="ci-s-records"></div>';
    html += '<div class="checkin-actions">';
    html += '<button class="checkin-btn ghost" onclick="CI.exportSmoke()">导出CSV</button>';
    html += '<button class="checkin-btn danger" onclick="CI.clearSmoke()">清除数据</button>';
    html += '</div></div>';

    el.innerHTML = html;
    drawSmokeChart(records);
    renderSmokeCalendar(records);
    renderSmokeRecords(records);
  }

  function drawSmokeChart(records) {
    const canvas = document.getElementById('ci-s-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 160;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) { ctx.fillStyle = '#aaa'; ctx.textAlign = 'center'; ctx.fillText('至少2条数据', canvas.width / 2, 80); return; }
    const recent = sorted.slice(-30);
    const vals = recent.map(r => r.count);
    const maxV = Math.max(...vals, 5) + 1;
    const pad = { t: 16, r: 16, b: 24, l: 36 };
    const w = canvas.width - pad.l - pad.r, h = canvas.height - pad.t - pad.b;
    ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + h * i / 4;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + w, y); ctx.stroke();
      ctx.fillStyle = '#999'; ctx.textAlign = 'right'; ctx.font = '10px sans-serif';
      ctx.fillText(Math.round(maxV - maxV * i / 4), pad.l - 4, y + 3);
    }
    // Zero line
    const zeroY = pad.t + h;
    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad.l, zeroY); ctx.lineTo(pad.l + w, zeroY); ctx.stroke();
    ctx.setLineDash([]);
    // Line
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.5; ctx.beginPath();
    recent.forEach((r, i) => {
      const x = pad.l + w * i / (recent.length - 1);
      const y = pad.t + h * (1 - r.count / maxV);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    // Points
    recent.forEach((r, i) => {
      const x = pad.l + w * i / (recent.length - 1);
      const y = pad.t + h * (1 - r.count / maxV);
      ctx.fillStyle = r.count === 0 ? '#10b981' : '#f43f5e';
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      if (i % Math.max(1, Math.floor(recent.length / 6)) === 0 || i === recent.length - 1) {
        ctx.fillStyle = '#999'; ctx.textAlign = 'center'; ctx.font = '9px sans-serif';
        ctx.fillText(r.date.slice(5), x, canvas.height - 4);
      }
    });
  }

  function renderSmokeCalendar(records) {
    const dateMap = {};
    records.forEach(r => { dateMap[r.date] = r.count; });
    const todayStr = today();
    document.getElementById('ci-cal-title').textContent = calYear + '年' + (calMonth + 1) + '月';
    const c = document.getElementById('ci-calendar');
    c.innerHTML = '';
    ['日', '一', '二', '三', '四', '五', '六'].forEach(d => {
      c.innerHTML += '<div class="cal-head">' + d + '</div>';
    });
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth + 1, 0);
    for (let i = 0; i < first.getDay(); i++) c.innerHTML += '<div class="cal-day other"></div>';
    for (let d = 1; d <= last.getDate(); d++) {
      const ds = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      let cls = 'cal-day';
      if (ds in dateMap) cls += dateMap[ds] === 0 ? ' checked' : '';
      if (ds === todayStr) cls += ' today';
      const title = ds in dateMap ? dateMap[ds] + '支' : '';
      c.innerHTML += '<div class="' + cls + '" title="' + title + '">' + d + '</div>';
    }
  }

  function renderSmokeRecords(records) {
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
    const c = document.getElementById('ci-s-records');
    if (!sorted.length) { c.innerHTML = '<div style="text-align:center;color:#aaa;padding:12px">暂无记录</div>'; return; }
    c.innerHTML = sorted.slice(0, 20).map((r, i) => {
      const prev = sorted[i + 1];
      let diff = '';
      if (prev) {
        const d = r.count - prev.count;
        if (d < 0) diff = '<span style="color:#27ae60;font-size:11px">' + d + '</span>';
        else if (d > 0) diff = '<span style="color:#e74c3c;font-size:11px">+' + d + '</span>';
        else diff = '<span style="color:#888;font-size:11px">=</span>';
      }
      const color = r.count === 0 ? '#27ae60' : '#e74c3c';
      return '<div class="checkin-record"><span class="rec-date">' + r.date + '</span><span class="rec-val" style="color:' + color + '">' + r.count + ' 支 ' + diff + '</span><span class="rec-del" onclick="CI.delSmoke(\'' + r.date + '\')">删除</span></div>';
    }).join('');
  }

  function renderSmokeTimeline(days) {
    const items = [
      { t: '20分钟', d: '心率恢复正常，血压开始下降' },
      { t: '8小时', d: '血液含氧量恢复正常' },
      { t: '24小时', d: '心脏病风险开始下降' },
      { t: '48小时', d: '味觉嗅觉改善' },
      { t: '72小时', d: '呼吸更轻松，支气管放松' },
      { t: '2周', d: '循环系统改善，走路更容易' },
      { t: '1个月', d: '肺功能提升30%' },
      { t: '3个月', d: '肺纤毛再生，感染风险降低' },
      { t: '9个月', d: '咳嗽呼吸困难显著减少' },
      { t: '1年', d: '心脏病风险减半' },
      { t: '5年', d: '中风风险降至非吸烟者水平' },
      { t: '10年', d: '肺癌死亡率减半' },
      { t: '15年', d: '心脏病风险与从未吸烟者相同' }
    ];
    function done(t) {
      if (t.includes('分钟')) return days >= 1;
      if (t.includes('小时')) return days >= 1;
      if (t.includes('天')) return days >= parseInt(t);
      if (t.includes('周')) return days >= parseInt(t) * 7;
      if (t.includes('月') && !t.includes('个')) return days >= parseInt(t) * 30;
      if (t.includes('个月')) return days >= parseInt(t) * 30;
      if (t.includes('年')) return days >= parseInt(t) * 365;
      return false;
    }
    let html = '<div class="checkin-section"><h4>健康恢复时间线（戒烟第 ' + days + ' 天）</h4><div class="checkin-timeline">';
    items.forEach(item => {
      html += '<div class="tl-item' + (done(item.t) ? ' done' : '') + '">';
      html += '<div class="tl-title">(' + item.t + ')</div>';
      html += '<div class="tl-desc">' + item.d + '</div></div>';
    });
    html += '</div></div>';
    return html;
  }

  // ==================== API ====================
  window.CI = {
    open: openModal,
    close: closeModal,
    tab: switchTab,

    addWeight: function () {
      const w = parseFloat(document.getElementById('ci-w-input').value);
      const d = document.getElementById('ci-w-date').value;
      if (!w || w < 30 || w > 200) { alert('请输入有效体重'); return; }
      if (!d) { alert('请选择日期'); return; }
      const rec = {
        date: d,
        weight: w,
        wake: document.getElementById('ci-w-wake').value || '',
        sleep: document.getElementById('ci-w-sleep').value || '',
        protein: parseInt(document.getElementById('ci-w-prot').value) || 0,
        exercise: document.getElementById('ci-w-exer').value || '无',
        core: document.getElementById('ci-w-core').value || '未做',
        cigarettes: parseInt(document.getElementById('ci-w-cig').value) || 0,
        calories: parseInt(document.getElementById('ci-w-cal').value) || 0,
        note: document.getElementById('ci-w-note').value || ''
      };
      const data = getW();
      const idx = data.findIndex(r => r.date === d);
      if (idx >= 0) Object.assign(data[idx], rec); else data.push(rec);
      data.sort((a, b) => a.date.localeCompare(b.date));
      saveW(data);
      renderTab();
      updateBadge();
    },

    delWeight: function (d) {
      if (!confirm('删除 ' + d + ' 的记录？')) return;
      saveW(getW().filter(r => r.date !== d));
      renderTab();
      updateBadge();
    },

    clearWeight: function () {
      if (!confirm('清除所有减肥数据？')) return;
      localStorage.removeItem(W_KEY);
      renderTab();
      updateBadge();
    },

    exportWeight: function () {
      const data = getW();
      if (!data.length) { alert('暂无数据'); return; }
      const header = '日期,体重(kg),起床,睡觉,蛋白质(g),运动,核心训练,吸烟(支),热量(kcal),备注';
      const rows = data.map(r => [r.date, r.weight, r.wake||'', r.sleep||'', r.protein||'', r.exercise||'', r.core||'', r.cigarettes||0, r.calories||'', '"'+(r.note||'')+'"'].join(','));
      const csv = header + '\n' + rows.join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'weight-records.csv';
      a.click();
    },

    calNav: function (d) {
      calMonth += d;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      if (calMonth < 0) { calMonth = 11; calYear--; }
      if (currentTab === 'weight') renderCalendar(getW().map(r => r.date));
      else renderSmokeCalendar(getSmokeRecords());
    },

    addSmoke: function () {
      const count = parseInt(document.getElementById('ci-s-count').value);
      const d = document.getElementById('ci-s-date').value;
      if (isNaN(count) || count < 0) { alert('请输入吸烟支数（0 或正数）'); return; }
      if (!d) { alert('请选择日期'); return; }
      const records = getSmokeRecords();
      const idx = records.findIndex(r => r.date === d);
      if (idx >= 0) records[idx].count = count; else records.push({ date: d, count: count });
      records.sort((a, b) => a.date.localeCompare(b.date));
      saveSmokeRecords(records);
      renderTab();
      updateBadge();
    },

    delSmoke: function (d) {
      if (!confirm('删除 ' + d + ' 的记录？')) return;
      saveSmokeRecords(getSmokeRecords().filter(r => r.date !== d));
      renderTab();
      updateBadge();
    },

    exportSmoke: function () {
      const records = getSmokeRecords();
      if (!records.length) { alert('暂无数据'); return; }
      const csv = '日期,吸烟(支)\n' + records.map(r => r.date + ',' + r.count).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'smoke-records.csv';
      a.click();
    },

    clearSmoke: function () {
      if (!confirm('清除所有戒烟数据？')) return;
      localStorage.removeItem(S_KEY);
      renderTab();
      updateBadge();
    }
  };

  // Init
  document.addEventListener('DOMContentLoaded', function () {
    updateBadge();
    document.getElementById('ci-mask').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
  });
})();
