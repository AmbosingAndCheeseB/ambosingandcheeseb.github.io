(function () {
  'use strict';

  var C = window.WEDDING || {};
  var photos = C.photos || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // 기능 하나가 실패해도 나머지는 동작하게
  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[' + name + ']', e); }
  }

  var store = {
    mem: {},
    get: function (k) { try { var v = localStorage.getItem(k); return v === null ? (this.mem[k] || null) : v; } catch (e) { return this.mem[k] || null; } },
    set: function (k, v) { this.mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* 사생활 보호 모드 등 */ } },
  };

  var DAY = 86400000;
  var KST = 9 * 3600000;
  var wdate = String(C.date || '').split('-').map(Number); // [y, m, d]
  var weddingAt = Date.parse(C.date + 'T' + C.time + ':00+09:00');

  function kstToday() {
    var n = new Date(Date.now() + KST);
    return { y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate() };
  }
  function ymd(o) { return o.y + '-' + String(o.m).padStart(2, '0') + '-' + String(o.d).padStart(2, '0'); }
  function daysLeft() {
    var t = kstToday();
    return Math.round((Date.UTC(wdate[0], wdate[1] - 1, wdate[2]) - Date.UTC(t.y, t.m - 1, t.d)) / DAY);
  }
  var weddingStarted = daysLeft() <= 0; // 예식 당일부터

  /* ───────── 스크롤 등장 효과 (가장 먼저) ───────── */
  safe('fade', function () {
    var els = $$('.fade');
    var show = function (el) { el.classList.add('in'); };
    if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  });
  window.__wedReady = true;

  /* ───────── 알림 ───────── */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* ───────── 복사 ───────── */
  function copyText(text, msg) {
    var done = function () { toast(msg || '복사되었어요'); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else window.prompt('아래 내용을 길게 눌러 복사해 주세요', text);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]');
    if (b) copyText(b.getAttribute('data-copy'), b.getAttribute('data-copy-msg'));
    if (e.target.closest('[data-copy-url]')) copyText(C.siteUrl || location.href, '청첩장 주소가 복사되었어요');
  });

  /* ───────── 사진 ───────── */
  function mountPhoto(el, src, alt, onload) {
    if (!src) return;
    var img = new Image();
    img.alt = alt || '';
    img.decoding = 'async';
    img.onload = function () { el.appendChild(img); el.classList.add('has-img'); if (onload) onload(); };
    img.src = src;
  }
  safe('photos', function () {
    $$('[data-photo]').forEach(function (el) {
      mountPhoto(el, photos[el.getAttribute('data-photo')], el.getAttribute('data-label'));
    });
  });

  /* ───────── 달력 · D-day ───────── */
  safe('calendar', function () {
    var y = wdate[0], m = wdate[1], d = wdate[2];
    var first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    var last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var holidays = C.holidays || [];
    var html = ['일', '월', '화', '수', '목', '금', '토'].map(function (w, i) {
      return '<span class="wd' + (i === 0 ? ' red' : '') + '">' + w + '</span>';
    }).join('');
    for (var i = 0; i < first; i++) html += '<span></span>';
    for (var day = 1; day <= last; day++) {
      var wd = (first + day - 1) % 7;
      var key = y + '-' + String(m).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var cls = [];
      if (wd === 0 || holidays.indexOf(key) > -1) cls.push('red');
      if (day === d) cls.push('day-on');
      html += '<span class="' + cls.join(' ') + '"' + (day === d ? ' aria-current="date"' : '') + '><em>' + day + '</em></span>';
    }
    $('#calendar').innerHTML = '<div class="cal-grid">' + html + '</div>';
  });

  safe('dday', function () {
    var els = {};
    $$('[data-cd]').forEach(function (el) { els[el.getAttribute('data-cd')] = el; });
    var names = C.groomShort + ', ' + C.brideShort;
    var days = daysLeft();
    var p = $('#dday');
    p.textContent = '';
    var b = document.createElement('b');
    if (days > 0) {
      b.textContent = days;
      p.append(names + '의 결혼식이 ', b, '일 남았습니다.');
      $('#ddayBadge').textContent = 'D-' + days;
    } else if (days === 0) {
      p.textContent = '오늘은 ' + names + '의 결혼식 날입니다.';
      $('#ddayBadge').textContent = 'D-DAY';
    } else {
      b.textContent = -days;
      p.append(names + '의 결혼식이 ', b, '일 지났습니다.');
    }

    function tick() {
      var diff = Math.max(0, weddingAt - Date.now());
      els.d.textContent = Math.floor(diff / DAY);
      els.h.textContent = Math.floor(diff / 3600000) % 24;
      els.m.textContent = Math.floor(diff / 60000) % 60;
      els.s.textContent = Math.floor(diff / 1000) % 60;
    }
    tick();
    if (weddingAt > Date.now()) setInterval(tick, 1000);
  });

  /* ───────── 지도 · 길안내 ───────── */
  safe('place', function () {
    var v = C.venue || {};
    var name = encodeURIComponent(v.name);
    var naverUrl = 'https://map.naver.com/p/search/' + encodeURIComponent(v.naverQuery || v.name);
    var kakaoUrl = 'https://map.kakao.com/link/to/' + name + ',' + v.lat + ',' + v.lng;

    $('#mapCover').href = naverUrl;
    $('#navNaver').href = naverUrl;
    $('#navKakao').href = kakaoUrl;

    // 약도 이미지가 없으면 지도를 대신 띄우기
    var img = $('#mapImg');
    img.addEventListener('error', function () {
      var f = document.createElement('iframe');
      f.title = v.name + ' 위치 지도';
      f.loading = 'lazy';
      f.setAttribute('tabindex', '-1');
      f.src = 'https://maps.google.com/maps?q=' + v.lat + ',' + v.lng + '&z=16&hl=ko&output=embed';
      img.parentNode.replaceChild(f, img);
      $('.map-pin').hidden = true;
      $('.map-credit').hidden = true;
    });

    if (v.tel) {
      var tel = $('#venueTel');
      var a = document.createElement('a');
      a.href = 'tel:' + v.tel.replace(/[^0-9]/g, '');
      a.innerHTML = '<svg class="ic"><use href="#i-phone"/></svg>';
      a.appendChild(document.createTextNode(v.tel));
      tel.appendChild(a);
      tel.hidden = false;
    }

    $('#navTmap').addEventListener('click', function (e) {
      e.preventDefault();
      var ua = navigator.userAgent;
      var q = 'rGoName=' + name + '&rGoX=' + v.lng + '&rGoY=' + v.lat;
      if (/Android/i.test(ua)) {
        // 설치되어 있으면 앱, 없으면 Play 스토어로 바로 연결
        location.href = 'intent://route?' + q + '#Intent;scheme=tmap;package=com.skt.tmap.ku;end';
        return;
      }
      if (!/iPhone|iPad|iPod/i.test(ua)) { toast('티맵은 휴대폰에서 이용하실 수 있어요'); return; }
      var left = false;
      var mark = function () { left = true; };
      window.addEventListener('pagehide', mark);
      window.addEventListener('blur', mark);
      location.href = 'tmap://route?' + q;
      setTimeout(function () {
        window.removeEventListener('pagehide', mark);
        window.removeEventListener('blur', mark);
        if (!left && !document.hidden) toast('티맵 앱이 없으면 네이버지도나 카카오맵을 이용해 주세요');
      }, 2500);
    });
  });

  /* ───────── 팝업 (뒤로가기로 닫기 지원) ───────── */
  var active = null, lastFocus = null, savedY = 0, ignorePop = false;

  function lockScroll() {
    savedY = window.scrollY || window.pageYOffset;
    var s = document.body.style;
    s.position = 'fixed'; s.top = -savedY + 'px'; s.left = '0'; s.right = '0';
  }
  function unlockScroll() {
    var s = document.body.style;
    s.position = ''; s.top = ''; s.left = ''; s.right = '';
    window.scrollTo(0, savedY);
  }
  function focusEl(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }

  function openModal(id, opts) {
    var m = document.getElementById(id);
    if (!m || m === active) return;
    var switching = !!active;
    if (switching) closeModal({ instant: true, keepHistory: true, keepFocus: true });
    else lastFocus = document.activeElement;
    clearTimeout(m._hideTimer);
    active = m;
    if (m.onBeforeOpen) m.onBeforeOpen(opts || {});
    m.hidden = false;
    lockScroll();
    document.body.classList.add('modal-open');
    m.offsetHeight; // 전환 효과를 위해 강제 리플로우
    m.classList.add('open');
    var sheet = $('.sheet', m);
    sheet.scrollTop = 0;
    focusEl(sheet);
    try {
      if (switching) history.replaceState({ modal: id }, '');
      else history.pushState({ modal: id }, '');
    } catch (e) { /* 무시 */ }
    if (m.onOpen) m.onOpen(opts || {});
  }
  function closeModal(o) {
    o = o || {};
    if (!active) return;
    var m = active;
    active = null;
    m.classList.remove('open');
    unlockScroll();
    document.body.classList.remove('modal-open');
    clearTimeout(m._hideTimer);
    if (o.instant) m.hidden = true;
    else m._hideTimer = setTimeout(function () { m.hidden = true; }, 320);
    if (!o.keepFocus && lastFocus && lastFocus.focus) focusEl(lastFocus);
    if (!o.fromPop && !o.keepHistory) {
      try { if (history.state && history.state.modal) { ignorePop = true; history.back(); } } catch (e) { /* 무시 */ }
    }
    if (m.onClose) m.onClose();
    updateDock();
  }
  window.addEventListener('popstate', function () {
    if (ignorePop) { ignorePop = false; return; }
    if (active) closeModal({ fromPop: true });
  });
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); openModal(o.getAttribute('data-open')); return; }
    if (active && e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (!active) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') { // 팝업 안에서만 포커스 이동
      var f = $$('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]', active)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.sheet', active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ───────── 갤러리 · 크게 보기 ───────── */
  safe('gallery', function () {
    var list = (photos.gallery && photos.gallery.length) ? photos.gallery : [];
    var count = list.length || photos.galleryPlaceholderCount || 6;
    var track = $('#gTrack');
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<div class="g-slide" role="group" aria-label="' + (i + 1) + ' / ' + count + '">' +
        '<div class="photo" data-index="' + i + '"><span class="ph"><svg class="ic"><use href="#i-photo"/></svg>사진 ' + (i + 1) + '</span></div></div>';
    }
    track.innerHTML = html;
    $$('.g-slide .photo', track).forEach(function (el, i) {
      mountPhoto(el, list[i], '웨딩 사진 ' + (i + 1), function () { $('#gHint').hidden = false; });
    });

    var prev = $('#gPrev'), next = $('#gNext'), counter = $('#gCount');
    function current() { return Math.round(track.scrollLeft / track.clientWidth); }
    function update() {
      var c = current();
      counter.textContent = (c + 1) + ' / ' + count;
      prev.disabled = c <= 0;
      next.disabled = c >= count - 1;
    }
    function go(n) { track.scrollTo({ left: n * track.clientWidth, behavior: 'smooth' }); }
    prev.addEventListener('click', function () { go(current() - 1); });
    next.addEventListener('click', function () { go(current() + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    });
    var raf;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();

    // 크게 보기
    var vTrack = $('#vTrack'), vCount = $('#vCount'), vPrev = $('#vPrev'), vNext = $('#vNext');
    var built = false, startAt = 0;
    function vCurrent() { return Math.round(vTrack.scrollLeft / (vTrack.clientWidth || 1)); }
    function vUpdate() {
      var c = vCurrent();
      vCount.textContent = (c + 1) + ' / ' + list.length;
      vPrev.disabled = c <= 0;
      vNext.disabled = c >= list.length - 1;
    }
    function vGo(n) { vTrack.scrollTo({ left: n * vTrack.clientWidth, behavior: 'smooth' }); }
    var viewer = $('#viewer');
    viewer.onOpen = function () {
      if (!built) {
        vTrack.innerHTML = list.map(function (src, i) {
          return '<div class="v-slide"><img src="' + src + '" alt="웨딩 사진 ' + (i + 1) + '"></div>';
        }).join('');
        built = true;
      }
      requestAnimationFrame(function () { vTrack.scrollLeft = startAt * vTrack.clientWidth; vUpdate(); });
    };
    viewer.onClose = function () { go(vCurrent()); };
    vPrev.addEventListener('click', function () { vGo(vCurrent() - 1); });
    vNext.addEventListener('click', function () { vGo(vCurrent() + 1); });
    var vraf;
    vTrack.addEventListener('scroll', function () { cancelAnimationFrame(vraf); vraf = requestAnimationFrame(vUpdate); }, { passive: true });
    viewer.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') vGo(vCurrent() - 1);
      if (e.key === 'ArrowRight') vGo(vCurrent() + 1);
    });
    track.addEventListener('click', function (e) {
      var ph = e.target.closest('.photo.has-img');
      if (!ph) return;
      startAt = Number(ph.getAttribute('data-index'));
      openModal('viewer');
    });
  });

  /* ───────── 계좌 접기/펼치기 ───────── */
  safe('accordion', function () {
    $$('.acc-head').forEach(function (h) {
      h.addEventListener('click', function () {
        var open = h.getAttribute('aria-expanded') === 'true';
        h.setAttribute('aria-expanded', String(!open));
        document.getElementById(h.getAttribute('aria-controls')).hidden = open;
      });
    });
  });

  /* ───────── 참석 여부 (RSVP) ───────── */
  function savedRsvp() { try { return JSON.parse(store.get('rsvp') || 'null'); } catch (e) { return null; } }
  function rsvpNeeded() { return !savedRsvp() && !weddingStarted; }

  safe('rsvp', function () {
    var modal = $('#rsvp');
    var form = $('#rsvpForm');
    var done = $('#rsvpDone');
    var submit = $('#rsvpSubmit');
    var skip = $('#rsvpSkip');
    var busOpen = !C.busDeadline || Date.now() <= Date.parse(C.busDeadline);
    var steps = {};
    var formLoaded = false;
    var memId = null;

    if (!busOpen) {
      $('#busStep').hidden = true;
      $('#busClosed').hidden = false;
    }

    function val(name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el ? el.value : '';
    }
    function setRadio(name, value) {
      var el = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
      if (el) el.checked = true;
    }

    // 인원 선택
    $$('.stepper', form).forEach(function (s) {
      var key = s.getAttribute('data-step');
      var btns = $$('.st-btn', s);
      var st = steps[key] = {
        value: 1,
        min: +s.getAttribute('data-min'), max: +s.getAttribute('data-max'),
        set: function (v) {
          st.value = Math.min(st.max, Math.max(st.min, v));
          $('b', s).textContent = st.value;
          btns[0].disabled = st.value <= st.min;
          btns[1].disabled = st.value >= st.max;
          if (key === 'count' && steps.busCount) { // 버스 인원은 동행 인원을 넘지 않게
            steps.busCount.max = st.value;
            steps.busCount.set(Math.min(steps.busCount.value, st.value));
          }
        },
      };
      s.addEventListener('click', function (e) {
        var b = e.target.closest('.st-btn');
        if (b) st.set(st.value + Number(b.getAttribute('data-delta')));
      });
    });
    steps.busCount.set(1);
    steps.count.set(1);

    function sync() {
      var attend = val('attend'), bus = val('bus');
      var busEnabled = attend === '참석';
      $$('input[name="bus"]', form).forEach(function (i) { i.disabled = !busEnabled; });
      var hint = $('#busHint');
      hint.hidden = busEnabled;
      hint.textContent = attend === '불참' ? '참석하지 않으시면 답하지 않으셔도 돼요.' : '참석 가능을 고르시면 선택할 수 있어요.';
      $$('[data-when]', form).forEach(function (el) {
        var kv = el.getAttribute('data-when').split('=');
        var show = kv[0] === 'attend' ? attend === kv[1] : (busEnabled && bus === kv[1]);
        el.hidden = !show;
      });
    }
    form.addEventListener('change', function (e) {
      sync();
      if (e.target.name) clearErr(e.target.name);
    });
    form.addEventListener('input', function (e) { if (e.target.name) clearErr(e.target.name); });

    function showErr(key, msg) {
      var el = form.querySelector('[data-err="' + key + '"]');
      if (el) el.textContent = msg;
    }
    function clearErr(key) { showErr(key, ''); showErr('submit', ''); }

    function clientId() {
      if (memId) return memId;
      var id = store.get('rsvp-client');
      if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        store.set('rsvp-client', id);
      }
      memId = id;
      return id;
    }

    function collect() {
      var attend = val('attend');
      var d = {
        clientId: clientId(),
        side: val('side'),
        name: $('#rsvpName').value.trim(),
        attend: attend,
        count: attend === '참석' ? steps.count.value : 0,
        bus: '', busCount: 0, phone: '',
        busClosed: !busOpen,
        submittedAt: new Date().toISOString(),
      };
      if (attend === '참석' && busOpen) {
        d.bus = val('bus');
        if (d.bus === '희망') { d.busCount = steps.busCount.value; d.phone = $('#rsvpPhone').value.trim(); }
      }
      if (attend === '참석' && !busOpen) { // 마감 뒤에는 기존 버스 신청을 그대로 유지
        var p = savedRsvp();
        if (p && p.bus) { d.bus = p.bus; d.busCount = Math.min(p.busCount || 0, d.count); d.phone = p.phone || ''; }
      }
      return d;
    }
    function validate(d) {
      var errs = [];
      if (!d.side) errs.push(['side', '신랑측 / 신부측 중 하나를 골라 주세요.']);
      if (!d.name) errs.push(['name', '성함을 입력해 주세요.']);
      if (!d.attend) errs.push(['attend', '참석 여부를 골라 주세요.']);
      if (d.attend === '참석' && busOpen && !d.bus) errs.push(['bus', '전세버스 탑승 희망 여부를 골라 주세요.']);
      if (busOpen && d.bus === '희망' && d.phone.replace(/[^0-9]/g, '').length < 9) errs.push(['phone', '버스 안내를 받으실 연락처를 입력해 주세요.']);
      return errs;
    }
    function focusField(key) {
      var target = key === 'name' ? $('#rsvpName') : key === 'phone' ? $('#rsvpPhone') : form.querySelector('input[name="' + key + '"]:not([disabled])');
      if (!target) return;
      var field = target.closest('.field');
      if (field) field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusEl(target);
    }

    function send(d) {
      if (!C.rsvpEndpoint) return Promise.resolve({ ok: true, test: true });
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
      var opts = { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) };
      if (ctrl) opts.signal = ctrl.signal;
      return fetch(C.rsvpEndpoint, opts)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (j) {
          clearTimeout(timer);
          if (!j || j.ok !== true) throw new Error((j && j.error) || 'not ok');
          return j;
        }, function (err) {
          clearTimeout(timer);
          throw err;
        });
    }

    function doneLines(d) {
      if (d.attend !== '참석') return [d.name + ' 님, 마음 전해 주셔서 감사합니다.', '함께하지 못하셔도 그 마음 깊이 간직하겠습니다.'];
      var lines = [d.count === 1 ? d.name + ' 님 참석' : d.name + ' 님 외 ' + (d.count - 1) + '명, 총 ' + d.count + '명 참석'];
      if (d.bus === '희망') lines.push('전세버스 탑승 희망 ' + d.busCount + '명' + (busOpen ? '' : ' (기존 신청 유지)'));
      if (d.bus === '미희망') lines.push('전세버스 탑승 안 함');
      lines.push('', '3월 27일에 뵙겠습니다.');
      return lines;
    }
    function setLines(el, lines) {
      el.textContent = '';
      lines.forEach(function (l, i) {
        if (i) el.appendChild(document.createElement('br'));
        if (l) el.appendChild(document.createTextNode(l));
      });
    }
    function updateLabels() {
      var sent = !!savedRsvp();
      $$('[data-rsvp-label]').forEach(function (el) { el.textContent = sent ? '참석 여부 다시 보내기' : '참석 여부 전달하기'; });
      updateDock();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (submit.disabled) return;
      var d = collect();
      var errs = validate(d);
      ['side', 'name', 'attend', 'bus', 'phone', 'submit'].forEach(function (k) { showErr(k, ''); });
      if (errs.length) {
        errs.forEach(function (x) { showErr(x[0], x[1]); });
        focusField(errs[0][0]);
        return;
      }
      submit.disabled = true;
      submit.textContent = '전달하는 중…';
      send(d).then(function (res) {
        store.set('rsvp', JSON.stringify(d));
        setLines($('#rsvpDoneText'), doneLines(d));
        $('#rsvpTest').hidden = !res.test;
        form.hidden = true;
        done.hidden = false;
        $('.sheet', modal).scrollTop = 0;
        focusEl($('#rsvpDoneTitle'));
        updateLabels();
      }, function (err) {
        var timeout = err && err.name === 'AbortError';
        showErr('submit', timeout
          ? '응답이 늦어지고 있어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'
          : '전달하지 못했어요. 잠시 후 다시 눌러 주세요. 계속 안 되면 신랑·신부에게 연락 부탁드려요.');
      }).then(function () {
        submit.disabled = false;
        submit.textContent = '참석 여부 전달하기';
      });
    });

    skip.addEventListener('click', function () {
      store.set('rsvp-hide', ymd(kstToday()));
      closeModal();
    });

    modal.onBeforeOpen = function (opts) {
      form.hidden = false;
      done.hidden = true;
      skip.hidden = !opts.auto;
      var p = savedRsvp();
      $('#rsvpPrev').hidden = !p;
      var kept = $('#busKept');
      kept.hidden = !(p && p.bus === '희망');
      if (p && p.bus === '희망') kept.textContent = '보내주신 전세버스 신청(' + p.busCount + '명)은 그대로 유지돼요.';
      if (!formLoaded && p) { // 처음 열 때만 이전 응답으로 채우기 (작성 중인 내용은 지우지 않음)
        setRadio('side', p.side);
        $('#rsvpName').value = p.name || '';
        setRadio('attend', p.attend);
        if (p.count) steps.count.set(p.count);
        if (p.bus && busOpen) setRadio('bus', p.bus);
        if (p.busCount) steps.busCount.set(p.busCount);
        $('#rsvpPhone').value = p.phone || '';
      }
      formLoaded = true;
      sync();
    };

    updateLabels();

    // 청첩장을 열면 표지를 잠깐 보여 준 뒤 띄우기
    // (이미 응답했거나, '오늘 하루 보지 않기'를 눌렀거나, 예식 당일 이후면 띄우지 않음)
    if (rsvpNeeded() && store.get('rsvp-hide') !== ymd(kstToday())) {
      setTimeout(function () { if (!active && rsvpNeeded()) openModal('rsvp', { auto: true }); }, 1800);
    }
  });

  /* ───────── 아래 도우미 바 · 글씨 크게 ───────── */
  var dock = $('#dock');
  function updateDock() {
    if (!dock) return;
    $('#dockRsvp').hidden = !rsvpNeeded();
    var y = window.scrollY || window.pageYOffset;
    var cover = $('.cover');
    var foot = $('#foot');
    var pastCover = cover && y > cover.offsetHeight * 0.6;
    var beforeFoot = !foot || foot.getBoundingClientRect().top > window.innerHeight - 40;
    var show = pastCover && beforeFoot && !document.body.classList.contains('modal-open');
    dock.classList.toggle('show', !!show);
  }
  safe('dock', function () {
    var fontBtn = $('#fontBtn');
    function applyFont(big) {
      document.documentElement.classList.toggle('big', big);
      fontBtn.setAttribute('aria-pressed', String(big));
      fontBtn.setAttribute('aria-label', big ? '글씨 원래 크기로 보기' : '글씨 크게 보기');
      $('#fontSign').textContent = big ? '−' : '+';
    }
    applyFont(document.documentElement.classList.contains('big'));
    fontBtn.addEventListener('click', function () {
      var big = !document.documentElement.classList.contains('big');
      applyFont(big);
      store.set('font-big', big ? '1' : '0');
      toast(big ? '글씨를 크게 했어요' : '글씨를 원래 크기로 했어요');
    });
    var raf;
    var onScroll = function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateDock); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateDock();
  });

  /* ───────── 공유 ───────── */
  safe('share', function () {
    var url = C.siteUrl || location.href;
    var title = document.title;
    var desc = '2027년 3월 27일 토요일 오전 11시 30분, 전주 바울센터';
    var kakaoReady;

    function loadKakao() {
      if (kakaoReady) return kakaoReady;
      kakaoReady = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
        s.onload = function () {
          try { if (!window.Kakao.isInitialized()) window.Kakao.init(C.kakaoJsKey); resolve(window.Kakao); }
          catch (e) { reject(e); }
        };
        s.onerror = reject;
        document.head.appendChild(s);
      });
      return kakaoReady;
    }
    function fallback() {
      if (navigator.share) {
        navigator.share({ title: title, text: desc, url: url }).catch(function () {});
      } else {
        copyText(url, '청첩장 주소가 복사되었어요. 카카오톡 대화창에 붙여 넣어 주세요.');
      }
    }
    if (C.kakaoJsKey) loadKakao().catch(function () {});

    $('#shareBtn').addEventListener('click', function () {
      if (!C.kakaoJsKey) { fallback(); return; }
      loadKakao().then(function (Kakao) {
        var img = photos.share || photos.main;
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: title,
            description: desc,
            imageUrl: img ? new URL(img, url).href : '',
            link: { mobileWebUrl: url, webUrl: url },
          },
          buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }],
        });
      }).catch(fallback);
    });
  });

  /* ───────── 표지 꽃잎 ───────── */
  safe('petals', function () {
    var cv = $('#petals');
    var cover = $('.cover');
    if (!cv || !cv.getContext || !window.requestAnimationFrame) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = cv.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = 0, H = 0, items = [], running = false, visible = true, raf = 0, last = 0;
    var COLORS = ['232,178,170', '240,200,192', '222,164,156', '246,214,206'];

    function size() {
      W = cover.offsetWidth; H = cover.offsetHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(p, initial) {
      p.x = Math.random() * W;
      p.y = initial ? Math.random() * H : -16;
      p.r = 4.5 + Math.random() * 5;
      p.vy = 16 + Math.random() * 22;
      p.sway = 10 + Math.random() * 22;
      p.phase = Math.random() * 6.28;
      p.spin = (Math.random() - 0.5) * 1.4;
      p.rot = Math.random() * 6.28;
      p.c = COLORS[Math.floor(Math.random() * COLORS.length)];
      p.a = 0.4 + Math.random() * 0.35;
      return p;
    }
    function draw(p) {
      ctx.save();
      ctx.translate(p.x + Math.sin(p.phase) * p.sway, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.bezierCurveTo(p.r * 0.95, -p.r * 0.55, p.r * 0.6, p.r * 0.75, 0, p.r);
      ctx.bezierCurveTo(-p.r * 0.6, p.r * 0.75, -p.r * 0.95, -p.r * 0.55, 0, -p.r);
      ctx.fill();
      ctx.restore();
    }
    function frame(t) {
      if (!running) return;
      var dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < items.length; i++) {
        var p = items[i];
        p.y += p.vy * dt;
        p.phase += dt * 0.9;
        p.rot += p.spin * dt;
        if (p.y > H + 16) make(p, false);
        draw(p);
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    size();
    for (var i = 0; i < 14; i++) items.push(make({}, true));
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (visible) start(); else stop();
      }).observe(cover);
    }
    start();
  });
})();
