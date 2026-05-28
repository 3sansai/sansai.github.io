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
    const sd = getS();
    const wDays = wd.length;
    const sDays = sd ? daysBetween(sd.startDate, today()) : 0;
    const wStreak = streak(wd.map(r => r.date));
    const sStreak = sd ? streak(sd.checkins) : 0;
    badge.innerHTML =
      '<span class="badge-icon">&#128293;</span>' +
      '<span class="badge-days">' + Math.max(wDays, sDays) + '</span>' +
      '<span class="badge-label">打卡天</span>';
    badge.title = '减肥打卡' + wStreak + '天 | 戒烟' + sDays + '天';
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

    let html = '';
    html += '<div class="checkin-hero weight-hero">';
    html += '<div class="hero-days">' + heroDays + '</div><div class="hero-label">累计打卡天</div>';
    html += '<div class="hero-sub">连续 ' + streakNum + ' 天 | 目标 80kg → 70kg</div></div>';

    html += '<div class="checkin-section"><h4>今日打卡</h4>';
    html += '<div class="checkin-form-row">';
    html += '<input type="number" class="checkin-input sm" id="ci-w-input" placeholder="体重kg" step="0.1" min="30" max="200">';
    html += '<input type="date" class="checkin-input md" id="ci-w-date" value="' + todayStr + '">';
    html += '<button class="checkin-btn primary" onclick="CI.addWeight()">' + (hasToday ? '更新' : '打卡') + '</button>';
    html += '</div></div>';

    html += '<div class="checkin-section"><h4>数据统计</h4><div class="checkin-stats">';
    html += sItem(heroDays, '打卡天数') + sItem(streakNum, '连续打卡') + sItem(curWeight, '当前kg');
    html += sItem(lost, '已减kg') + sItem(maxW, '最高kg') + sItem(minW, '最低kg');
    html += '</div></div>';

    html += '<div class="checkin-section"><h4>体重趋势</h4><div class="checkin-chart"><canvas id="ci-w-chart"></canvas></div></div>';

    html += '<div class="checkin-section"><h4>打卡日历</h4>';
    html += '<div class="checkin-cal-nav"><button class="cal-btn" onclick="CI.calNav(-1)">&lt;</button>';
    html += '<span class="cal-title" id="ci-cal-title"></span>';
    html += '<button class="cal-btn" onclick="CI.calNav(1)">&gt;</button></div>';
    html += '<div class="checkin-calendar" id="ci-calendar"></div></div>';

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
    ctx.strokeStyle = '#005080'; ctx.lineWidth = 2; ctx.beginPath();
    recent.forEach((r, i) => {
      const x = pad.l + w * i / (recent.length - 1);
      const y = pad.t + h * (1 - (r.weight - minW) / (maxW - minW));
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
    recent.forEach((r, i) => {
      const x = pad.l + w * i / (recent.length - 1);
      const y = pad.t + h * (1 - (r.weight - minW) / (maxW - minW));
      ctx.fillStyle = '#005080'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
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
      return '<div class="checkin-record"><span class="rec-date">' + r.date + '</span><span class="rec-val">' + r.weight.toFixed(1) + 'kg ' + diff + '</span><span class="rec-del" onclick="CI.delWeight(\'' + r.date + '\')">删除</span></div>';
    }).join('');
  }

  // ==================== SMOKE ====================
  function renderSmoke(el) {
    const data = getS();
    const todayStr = today();

    if (!data) {
      let html = '<div class="checkin-hero smoke-hero"><div class="hero-label">开始你的戒烟计划</div></div>';
      html += '<div class="checkin-section"><h4>设置戒烟参数</h4>';
      html += '<div class="checkin-form-row"><label>戒烟日期</label><input type="date" class="checkin-input md" id="ci-s-date" value="' + todayStr + '"></div>';
      html += '<div class="checkin-form-row"><label>每天几支</label><input type="number" class="checkin-input sm" id="ci-s-perday" value="20" min="1"></div>';
      html += '<div class="checkin-form-row"><label>每包价格</label><input type="number" class="checkin-input sm" id="ci-s-price" value="25" min="1"><span>元</span></div>';
      html += '<div class="checkin-form-row"><label>每包支数</label><input type="number" class="checkin-input sm" id="ci-s-perpack" value="20" min="1"></div>';
      html += '<button class="checkin-btn success" onclick="CI.startSmoke()" style="width:100%;margin-top:8px">开始戒烟</button></div>';
      html += renderSmokeTimeline(0);
      el.innerHTML = html;
      return;
    }

    const days = daysBetween(data.startDate, todayStr);
    const isChecked = data.checkins.includes(todayStr);
    const cigs = days * data.perDay;
    const money = (cigs / data.perPack) * data.pricePerPack;

    let html = '<div class="checkin-hero smoke-hero">';
    html += '<div class="hero-days">' + days + '</div><div class="hero-label">已戒烟天数</div>';
    html += '<div class="hero-sub">始于 ' + data.startDate + '</div></div>';

    html += '<div class="checkin-section"><h4>今日打卡</h4>';
    html += '<button class="checkin-btn ' + (isChecked ? 'disabled' : 'success') + '" onclick="CI.smokeCheckin()" style="width:100%">';
    html += isChecked ? '今日已打卡' : '打卡';
    html += '</button></div>';

    html += '<div class="checkin-section"><h4>数据统计</h4><div class="checkin-stats">';
    html += sItem(days, '戒烟天数') + sItem(cigs, '少抽(支)') + sItem('¥' + money.toFixed(0), '已省');
    html += sItem(data.checkins.length, '打卡次数') + sItem(streak(data.checkins), '连续打卡');
    html += sItem(Math.floor(cigs * 11 / 1440), '延长寿命(天)');
    html += '</div></div>';

    html += renderSmokeTimeline(days);

    html += '<div class="checkin-section"><h4>打卡日历</h4>';
    html += '<div class="checkin-cal-nav"><button class="cal-btn" onclick="CI.calNav(-1)">&lt;</button>';
    html += '<span class="cal-title" id="ci-cal-title"></span>';
    html += '<button class="cal-btn" onclick="CI.calNav(1)">&gt;</button></div>';
    html += '<div class="checkin-calendar" id="ci-calendar"></div></div>';

    html += '<div class="checkin-actions">';
    html += '<button class="checkin-btn danger" onclick="CI.clearSmoke()">清除数据</button></div>';

    el.innerHTML = html;
    renderCalendar(data.checkins);
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
      if (t.includes('分钟')) return true;
      if (t.includes('小时')) return days >= 1;
      if (t.includes('天')) return days >= parseInt(t);
      if (t.includes('周')) return days >= parseInt(t) * 7;
      if (t.includes('月') && !t.includes('个')) return days >= parseInt(t) * 30;
      if (t.includes('个月')) return days >= parseInt(t) * 30;
      if (t.includes('年')) return days >= parseInt(t) * 365;
      return false;
    }
    let html = '<div class="checkin-section"><h4>健康恢复时间线</h4><div class="checkin-timeline">';
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
      const data = getW();
      const idx = data.findIndex(r => r.date === d);
      if (idx >= 0) data[idx].weight = w; else data.push({ date: d, weight: w });
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
      const csv = '日期,体重(kg)\n' + data.map(r => r.date + ',' + r.weight).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'weight-records.csv';
      a.click();
    },

    calNav: function (d) {
      calMonth += d;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      if (calMonth < 0) { calMonth = 11; calYear--; }
      const dates = currentTab === 'weight' ? getW().map(r => r.date) : (getS() ? getS().checkins : []);
      renderCalendar(dates);
    },

    startSmoke: function () {
      const sd = document.getElementById('ci-s-date').value;
      if (!sd) { alert('请选择日期'); return; }
      saveS({
        startDate: sd,
        perDay: parseInt(document.getElementById('ci-s-perday').value) || 20,
        pricePerPack: parseFloat(document.getElementById('ci-s-price').value) || 25,
        perPack: parseInt(document.getElementById('ci-s-perpack').value) || 20,
        checkins: [sd]
      });
      renderTab();
      updateBadge();
    },

    smokeCheckin: function () {
      const data = getS();
      if (!data) return;
      const t = today();
      if (!data.checkins.includes(t)) {
        data.checkins.push(t);
        data.checkins.sort();
        saveS(data);
      }
      renderTab();
      updateBadge();
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
