(function () {
  'use strict';

  var C = window.WEDDING || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 사생활 보호 모드 등 */ } },
  };

  var DAY = 86400000;
  var KST = 9 * 3600000;
  var parts = C.date.split('-').map(Number); // [y, m, d]
  var weddingAt = Date.parse(C.date + 'T' + C.time + ':00+09:00');

  function kstToday() {
    var n = new Date(Date.now() + KST);
    return { y: n.getUTCFullYear(), m: n.getUTCMonth() + 1, d: n.getUTCDate() };
  }
  function ymd(o) { return o.y + '-' + String(o.m).padStart(2, '0') + '-' + String(o.d).padStart(2, '0'); }

  /* ───────── 알림 ───────── */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
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
  function mountPhoto(el, src, alt) {
    if (!src) return;
    var img = new Image();
    img.alt = alt || '';
    img.decoding = 'async';
    img.onload = function () { el.appendChild(img); el.classList.add('has-img'); };
    img.src = src;
  }
  var photos = C.photos || {};
  $$('[data-photo]').forEach(function (el) {
    mountPhoto(el, photos[el.getAttribute('data-photo')], el.getAttribute('data-label'));
  });

  /* ───────── 달력 ───────── */
  (function renderCalendar() {
    var y = parts[0], m = parts[1], d = parts[2];
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
  })();

  /* ───────── D-day ───────── */
  (function countdown() {
    var els = {};
    $$('[data-cd]').forEach(function (el) { els[el.getAttribute('data-cd')] = el; });
    var names = C.groomShort + ', ' + C.brideShort;

    function tick() {
      var diff = Math.max(0, weddingAt - Date.now());
      els.d.textContent = Math.floor(diff / DAY);
      els.h.textContent = Math.floor(diff / 3600000) % 24;
      els.m.textContent = Math.floor(diff / 60000) % 60;
      els.s.textContent = Math.floor(diff / 1000) % 60;
    }
    var t = kstToday();
    var days = Math.round((Date.UTC(parts[0], parts[1] - 1, parts[2]) - Date.UTC(t.y, t.m - 1, t.d)) / DAY);
    var text;
    if (days > 0) text = names + '의 결혼식이 <b>' + days + '</b>일 남았습니다.';
    else if (days === 0) text = '오늘은 ' + names + '의 결혼식 날입니다.';
    else text = names + '의 결혼식이 <b>' + (-days) + '</b>일 지났습니다.';
    $('#dday').innerHTML = text;

    tick();
    if (weddingAt > Date.now()) setInterval(tick, 1000);
  })();

  /* ───────── 지도 · 길안내 ───────── */
  (function place() {
    var v = C.venue || {};
    var name = encodeURIComponent(v.name);
    var naverUrl = 'https://map.naver.com/p/search/' + encodeURIComponent(v.naverQuery || v.name);
    var kakaoUrl = 'https://map.kakao.com/link/to/' + name + ',' + v.lat + ',' + v.lng;

    $('#mapFrame').src = 'https://maps.google.com/maps?q=' + v.lat + ',' + v.lng + '&z=16&hl=ko&output=embed';
    $('#mapCover').href = naverUrl;
    $('#navNaver').href = naverUrl;
    $('#navKakao').href = kakaoUrl;

    if (v.tel) {
      var tel = $('#venueTel');
      tel.innerHTML = '<a href="tel:' + v.tel.replace(/[^0-9]/g, '') + '"><svg class="ic"><use href="#i-phone"/></svg>' + v.tel + '</a>';
      tel.hidden = false;
    }

    $('#navTmap').addEventListener('click', function (e) {
      e.preventDefault();
      var ua = navigator.userAgent;
      var isAndroid = /Android/i.test(ua);
      var isIOS = /iPhone|iPad|iPod/i.test(ua);
      if (!isAndroid && !isIOS) { toast('티맵은 휴대폰에서 이용하실 수 있어요'); return; }
      var opened = false;
      var onHide = function () { if (document.hidden) opened = true; };
      document.addEventListener('visibilitychange', onHide);
      location.href = 'tmap://route?rGoName=' + name + '&rGoX=' + v.lng + '&rGoY=' + v.lat;
      setTimeout(function () {
        document.removeEventListener('visibilitychange', onHide);
        if (opened || document.hidden) return;
        location.href = isAndroid
          ? 'market://details?id=com.skt.tmap.ku'
          : 'https://apps.apple.com/kr/app/id431589174';
      }, 1600);
    });
  })();

  /* ───────── 갤러리 ───────── */
  (function gallery() {
    var list = (photos.gallery && photos.gallery.length) ? photos.gallery : [];
    var count = list.length || photos.galleryPlaceholderCount || 6;
    var track = $('#gTrack');
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<div class="g-slide" role="group" aria-label="' + (i + 1) + ' / ' + count + '">' +
        '<div class="photo"><span class="ph"><svg class="ic"><use href="#i-photo"/></svg>사진 ' + (i + 1) + '</span></div></div>';
    }
    track.innerHTML = html;
    $$('.g-slide .photo', track).forEach(function (el, i) { mountPhoto(el, list[i], '웨딩 사진 ' + (i + 1)); });

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
  })();

  /* ───────── 계좌 접기/펼치기 ───────── */
  $$('.acc-head').forEach(function (h) {
    h.addEventListener('click', function () {
      var open = h.getAttribute('aria-expanded') === 'true';
      h.setAttribute('aria-expanded', String(!open));
      document.getElementById(h.getAttribute('aria-controls')).hidden = open;
    });
  });

  /* ───────── 팝업 ───────── */
  var active = null, lastFocus = null, scrollY = 0;

  function lockScroll() {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = -scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
  }
  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    window.scrollTo(0, scrollY);
  }
  function openModal(id, opts) {
    if (active) closeModal(true);
    var m = document.getElementById(id);
    if (!m) return;
    lastFocus = document.activeElement;
    active = m;
    if (m.onBeforeOpen) m.onBeforeOpen(opts || {});
    m.hidden = false;
    lockScroll();
    m.offsetHeight; // 전환 효과를 위해 강제 리플로우
    m.classList.add('open');
    $('.sheet', m).scrollTop = 0;
    $('.sheet', m).focus({ preventScroll: true });
  }
  function closeModal(instant) {
    if (!active) return;
    var m = active;
    active = null;
    m.classList.remove('open');
    unlockScroll();
    var hide = function () { m.hidden = true; };
    if (instant) hide(); else setTimeout(hide, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
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

  /* ───────── 참석 여부 (RSVP) ───────── */
  (function rsvp() {
    var modal = $('#rsvp');
    var form = $('#rsvpForm');
    var done = $('#rsvpDone');
    var submit = $('#rsvpSubmit');
    var skip = $('#rsvpSkip');
    var busOpen = !C.busDeadline || Date.now() <= Date.parse(C.busDeadline);
    var steps = {};

    if (!busOpen) {
      $$('[data-bus]', form).forEach(function (el) { el.remove(); });
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
      var st = steps[key] = {
        el: s, value: 1,
        min: +s.getAttribute('data-min'), max: +s.getAttribute('data-max'),
        set: function (v) {
          st.value = Math.min(st.max, Math.max(st.min, v));
          $('b', s).textContent = st.value;
          $$('.st-btn', s)[0].disabled = st.value <= st.min;
          $$('.st-btn', s)[1].disabled = st.value >= st.max;
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
    steps.count.set(1);
    steps.busCount.set(1);

    function sync() {
      var state = { attend: val('attend'), bus: val('bus') };
      $$('[data-when]', form).forEach(function (el) {
        var kv = el.getAttribute('data-when').split('=');
        var show = state[kv[0]] === kv[1];
        if (kv[0] === 'bus') show = show && state.attend === '참석';
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

    function collect() {
      var attend = val('attend');
      var bus = attend === '참석' && busOpen ? val('bus') : '';
      return {
        clientId: clientId(),
        side: val('side'),
        name: $('#rsvpName').value.trim(),
        attend: attend,
        count: attend === '참석' ? steps.count.value : 0,
        bus: bus,
        busCount: bus === '희망' ? steps.busCount.value : 0,
        phone: bus === '희망' ? $('#rsvpPhone').value.trim() : '',
        submittedAt: new Date().toISOString(),
      };
    }
    function validate(d) {
      var errs = [];
      if (!d.side) errs.push(['side', '신랑측 / 신부측 중 하나를 골라 주세요.']);
      if (!d.name) errs.push(['name', '성함을 입력해 주세요.']);
      if (!d.attend) errs.push(['attend', '참석 여부를 골라 주세요.']);
      if (d.attend === '참석' && busOpen && !d.bus) errs.push(['bus', '전세버스 탑승 희망 여부를 골라 주세요.']);
      if (d.bus === '희망' && d.phone.replace(/[^0-9]/g, '').length < 9) errs.push(['phone', '버스 안내를 받으실 연락처를 입력해 주세요.']);
      return errs;
    }
    function clientId() {
      var id = store.get('rsvp-client');
      if (!id) {
        id = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        store.set('rsvp-client', id);
      }
      return id;
    }

    function summary(d) {
      if (d.attend !== '참석') return d.name + ' 님, 마음 전해 주셔서 감사합니다.<br>함께하지 못하셔도 그 마음 깊이 간직하겠습니다.';
      var lines = [d.name + ' 님 외 ' + (d.count - 1) + '명, 총 ' + d.count + '명 참석'];
      if (d.count === 1) lines[0] = d.name + ' 님 참석';
      if (d.bus === '희망') lines.push('전세버스 탑승 희망 ' + d.busCount + '명');
      if (d.bus === '미희망') lines.push('전세버스 탑승 안 함');
      return lines.join('<br>') + '<br><br>3월 27일에 뵙겠습니다.';
    }
    function updateLabels() {
      var sent = !!store.get('rsvp');
      $$('[data-rsvp-label]').forEach(function (el) { el.textContent = sent ? '참석 여부 다시 보내기' : '참석 여부 전달하기'; });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = collect();
      var errs = validate(d);
      ['side', 'name', 'attend', 'bus', 'phone', 'submit'].forEach(function (k) { showErr(k, ''); });
      if (errs.length) {
        errs.forEach(function (x) { showErr(x[0], x[1]); });
        var firstErr = form.querySelector('[data-err="' + errs[0][0] + '"]');
        if (firstErr) firstErr.closest('.field').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      submit.disabled = true;
      submit.textContent = '전달하는 중…';
      var finish = function () {
        store.set('rsvp', JSON.stringify(d));
        $('#rsvpDoneText').innerHTML = summary(d);
        $('#rsvpTest').hidden = !!C.rsvpEndpoint;
        form.hidden = true;
        done.hidden = false;
        $('.sheet', modal).scrollTop = 0;
        updateLabels();
      };
      var send = C.rsvpEndpoint
        ? fetch(C.rsvpEndpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(d),
          })
        : Promise.resolve();
      send.then(finish, function () {
        showErr('submit', '전송하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.');
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
      var prev = store.get('rsvp');
      $('#rsvpPrev').hidden = !prev;
      if (prev) {
        try {
          var p = JSON.parse(prev);
          setRadio('side', p.side);
          $('#rsvpName').value = p.name || '';
          setRadio('attend', p.attend);
          if (p.count) steps.count.set(p.count);
          if (p.bus) setRadio('bus', p.bus);
          if (p.busCount) steps.busCount.set(p.busCount);
          $('#rsvpPhone').value = p.phone || '';
        } catch (err) { /* 무시 */ }
      }
      sync();
    };

    updateLabels();

    // 청첩장을 열자마자 띄우기 (이미 응답했거나 '오늘 하루 보지 않기'를 누른 경우 제외)
    if (!store.get('rsvp') && store.get('rsvp-hide') !== ymd(kstToday())) {
      setTimeout(function () { if (!active) openModal('rsvp', { auto: true }); }, 900);
    }
  })();

  /* ───────── 공유 ───────── */
  (function share() {
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
  })();

  /* ───────── 스크롤 등장 효과 ───────── */
  (function fade() {
    var els = $$('.fade');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  })();
})();
