/* TK portfolio: scroll and swipe motion. Plain JS, no libraries.
   Motion runs for everyone by default (the owner's choice); the footer switch turns it off and remembers that. */
(() => {
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let motion = !root.classList.contains('nomotion');

  /* ---------- headline: fit the poster to the width, then reveal (M2) ---------- */
  const poster = $('#poster');
  function fitPoster() {
    if (!poster) return;
    const box = poster.parentElement.clientWidth;
    poster.style.fontSize = '100px';
    let widest = 0;
    $$('.line > span', poster).forEach(s => (widest = Math.max(widest, s.getBoundingClientRect().width)));
    if (!widest) return;
    const byWidth = (box / widest) * 100 * 0.985;
    const byHeight = innerHeight * 0.3; // two lines must leave room for the rest of the first screen
    poster.style.fontSize = Math.max(44, Math.min(byWidth, byHeight)) + 'px';
  }
  fitPoster();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPoster);

  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach((w, i) => {
      const o = document.createElement('span');
      o.className = 'w';
      o.setAttribute('aria-hidden', 'true');
      const s = document.createElement('span');
      s.textContent = w;
      s.style.setProperty('--i', i);
      o.appendChild(s);
      el.appendChild(o);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- enter-view: reveal (M1), headline words (M2), numbers (M6) ---------- */
  function count(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const to = +el.dataset.count;
    if (!motion || to < 2) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1500;
    const tick = t => {
      const p = clamp((t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('[data-count]', e.target).forEach(count);
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal], [data-split]').forEach(el => io.observe(el));
  const showPoster = () => poster && poster.classList.add('in');
  requestAnimationFrame(() => requestAnimationFrame(showPoster));
  setTimeout(showPoster, 600); // in case the tab opened in the background, where frames do not run

  /* ---------- section dots + background shift (M10, M12) ---------- */
  const secs = $$('[data-sec]'), dots = $('#dots');
  const tones = { Top: '#0a0b0c', Approach: '#0b0c0e', Contact: '#0d0b09' };
  secs.forEach((s, i) => {
    if (!s.id) s.id = 'sec-' + i;
    const a = document.createElement('a');
    a.href = '#' + (i === 0 ? 'top' : s.id);
    a.dataset.name = s.dataset.sec;
    a.setAttribute('aria-label', s.dataset.sec);
    dots.appendChild(a);
  });
  const secIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const i = secs.indexOf(e.target);
      $$('a', dots).forEach((d, k) => d.classList.toggle('on', k === i));
      const tone = tones[e.target.dataset.sec];
      if (tone) document.body.style.backgroundColor = tone;
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  secs.forEach(s => secIO.observe(s));

  /* ---------- scroll-linked: progress (M10), trailer grow (M3), parallax (M4), stacking panels (M7) ---------- */
  const bar = $('#bar'), top = $('.top');
  const grows = $$('[data-grow]'), paras = $$('[data-parallax]');
  const stack = $('.stack'), panels = $$('.panel');

  function layoutStack() {
    if (!stack) return;
    stack.classList.toggle('stacking', motion);
    panels.forEach(p => p.style.setProperty('--stick', Math.min(0, innerHeight - p.offsetHeight) + 'px'));
  }

  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight, y = scrollY;
    bar.style.transform = `scaleX(${clamp(y / Math.max(1, root.scrollHeight - vh))})`;
    top.classList.toggle('scrolled', y > 40);
    if (!motion) return;
    grows.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const p = clamp(1 - (mid - vh * 0.5) / (vh * 0.62));
      el.style.transform = `scale(${0.8 + 0.2 * p})`;
    });
    paras.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom > 0) el.style.transform = `translate3d(0, ${-r.top * +el.dataset.parallax}px, 0)`;
    });
    panels.forEach((el, i) => {
      const next = panels[i + 1];
      if (!next) return;
      const nt = next.getBoundingClientRect().top;
      const p = clamp(1 - nt / vh);
      if (p <= 0) { el.style.transform = ''; el.style.filter = ''; el.style.visibility = ''; return; }
      el.style.visibility = nt <= -2 ? 'hidden' : '';
      el.style.transform = `scale(${1 - 0.05 * p})`;
      el.style.filter = `brightness(${1 - 0.55 * p})`;
    });
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { fitPoster(); layoutStack(); frame(); });
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => { layoutStack(); onScroll(); }); panels.forEach(p => ro.observe(p)); }
  layoutStack();
  frame();

  /* ---------- tools band (M8): drifts, faster while scrolling ---------- */
  const marquee = $('#marquee');
  if (marquee) {
    const original = marquee.innerHTML;
    let mx = 0, lastY = scrollY, vel = 0, half = 0, raf = 0, visible = false;
    const setup = () => {
      cancelAnimationFrame(raf);
      marquee.style.transform = '';
      if (!motion) { marquee.innerHTML = original; return; }
      marquee.innerHTML = original + original;
      $$('span', marquee).slice(marquee.children.length / 2).forEach(s => s.setAttribute('aria-hidden', 'true'));
      half = marquee.scrollWidth / 2;
      loop();
    };
    const loop = () => {
      const y = scrollY;
      vel += (Math.abs(y - lastY) - vel) * 0.1;
      lastY = y;
      if (visible) {
        mx -= 0.7 + vel * 0.4;
        if (-mx >= half) mx += half;
        marquee.style.transform = `translate3d(${mx}px,0,0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    new IntersectionObserver(es => (visible = es[0].isIntersecting)).observe(marquee.parentElement);
    marquee._setup = setup;
    setup();
  }

  /* ---------- swipe gallery (M5) ---------- */
  const sw = $('#swipe');
  if (sw) {
    const figs = $$('figure', sw), pips = $('#pips');
    figs.forEach(() => pips.appendChild(document.createElement('i')));
    let active = 0;
    const centerOf = f => f.offsetLeft + f.offsetWidth / 2;
    const mark = () => {
      const c = sw.scrollLeft + sw.clientWidth / 2;
      let best = 0, bd = Infinity;
      figs.forEach((f, i) => { const d = Math.abs(centerOf(f) - c); if (d < bd) { bd = d; best = i; } });
      active = best;
      figs.forEach((f, i) => f.classList.toggle('on', i === best));
      $$('i', pips).forEach((p, i) => p.classList.toggle('on', i === best));
    };
    const go = i => {
      const f = figs[clamp(i, 0, figs.length - 1)];
      sw.scrollTo({ left: centerOf(f) - sw.clientWidth / 2, behavior: motion ? 'smooth' : 'auto' });
    };
    let st = 0;
    sw.addEventListener('scroll', () => { cancelAnimationFrame(st); st = requestAnimationFrame(mark); }, { passive: true });
    $('#gal-prev').addEventListener('click', () => go(active - 1));
    $('#gal-next').addEventListener('click', () => go(active + 1));
    sw.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
    });
    // mouse drag with a little momentum; touch uses the browser's own swipe + snap
    let down = false, sx = 0, sl = 0, lastX = 0, v = 0;
    sw.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; sx = lastX = e.clientX; sl = sw.scrollLeft; v = 0;
      sw.classList.add('drag');
      sw.setPointerCapture(e.pointerId);
    });
    sw.addEventListener('pointermove', e => {
      if (!down) return;
      v = e.clientX - lastX; lastX = e.clientX;
      sw.scrollLeft = sl - (e.clientX - sx);
    });
    const up = () => {
      if (!down) return;
      down = false;
      const c = sw.scrollLeft - v * 12 + sw.clientWidth / 2;
      let best = 0, bd = Infinity;
      figs.forEach((f, i) => { const d = Math.abs(centerOf(f) - c); if (d < bd) { bd = d; best = i; } });
      sw.classList.remove('drag');
      go(best);
    };
    sw.addEventListener('pointerup', up);
    sw.addEventListener('pointercancel', up);
    addEventListener('resize', mark);
    mark();
  }

  /* ---------- hover feedback (M9): magnetic buttons, tilting picture (mouse only) ---------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('[data-magnet]').forEach(b => {
      b.addEventListener('pointermove', e => {
        if (!motion) return;
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
      });
      b.addEventListener('pointerleave', () => (b.style.transform = ''));
    });
    $$('[data-tilt]').forEach(t => {
      const inner = $('.tilt-in', t);
      t.addEventListener('pointermove', e => {
        if (!motion) return;
        const r = inner.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        inner.style.transition = 'transform .12s';
        inner.style.transform = `rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 8}deg) scale(1.015)`;
        inner.style.setProperty('--mx', px * 100 + '%');
        inner.style.setProperty('--my', py * 100 + '%');
      });
      t.addEventListener('pointerleave', () => { inner.style.transition = ''; inner.style.transform = ''; });
    });
  }

  /* ---------- trailer player: our own controls (the browser's bar stays only without JavaScript) ---------- */
  const video = $('#trailer-video'), player = $('#player');
  if (video && player) {
    const big = $('#pl-big'), bar = $('#pl-bar'), seek = $('#pl-seek'), volEl = $('#pl-vol');
    const playBtn = $('#pl-play'), muteBtn = $('#pl-mute'), fsBtn = $('#pl-fs'), timeEl = $('#pl-time');
    const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const dur = () => (isFinite(video.duration) && video.duration > 0 ? video.duration : 29.6);
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;

    video.controls = false;
    video.removeAttribute('controls');
    big.hidden = bar.hidden = false;
    player.tabIndex = 0;
    player.setAttribute('role', 'group');
    player.setAttribute('aria-label', 'Trailer player. Space plays or pauses, the arrow keys seek and change the volume, M mutes, F is full screen.');
    // phones (iOS above all) do not let a page set the volume: keep only the mute button there
    const v0 = video.volume;
    try { video.volume = 0.5; } catch (e) {}
    if (video.volume !== 0.5) player.classList.add('no-vol');
    try { video.volume = v0; } catch (e) {}

    const setSlider = (el, p) => {
      $('.pl-fill', el).style.width = p * 100 + '%';
      $('.pl-knob', el).style.left = p * 100 + '%';
    };
    function paint() {
      const d = dur(), t = Math.min(video.currentTime, d);
      setSlider(seek, clamp(t / d));
      timeEl.textContent = fmt(t) + ' / ' + fmt(d);
      seek.setAttribute('aria-valuemax', Math.floor(d));
      seek.setAttribute('aria-valuenow', Math.floor(t));
      seek.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(d));
      if (video.buffered.length) $('.pl-buf', seek).style.width = clamp(video.buffered.end(video.buffered.length - 1) / d) * 100 + '%';
    }
    function sync() {
      const playing = !video.paused && !video.ended;
      player.classList.toggle('is-playing', playing);
      player.classList.toggle('is-muted', video.muted || video.volume === 0);
      player.classList.toggle('is-fs', fsEl() === player);
      playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      big.setAttribute('aria-label', video.ended ? 'Play the trailer again' : 'Play the trailer');
      muteBtn.setAttribute('aria-label', video.muted || video.volume === 0 ? 'Unmute' : 'Mute');
      fsBtn.setAttribute('aria-label', fsEl() === player ? 'Leave full screen' : 'Full screen');
      const vol = video.muted ? 0 : video.volume;
      setSlider(volEl, vol);
      volEl.setAttribute('aria-valuenow', Math.round(vol * 100));
      paint();
      playing ? wake() : (clearTimeout(idleT), player.classList.remove('idle'));
    }
    let raf = 0;
    const tick = () => { paint(); raf = !video.paused && !video.ended ? requestAnimationFrame(tick) : 0; };

    // the bar hides while the trailer plays and nothing is touched
    let idleT = 0;
    function wake() {
      player.classList.remove('idle');
      clearTimeout(idleT);
      if (video.paused || video.ended) return;
      idleT = setTimeout(() => {
        if (!video.paused && !seek.classList.contains('drag') && !volEl.classList.contains('drag') && !bar.matches(':hover') && !bar.contains(document.activeElement)) player.classList.add('idle');
      }, 2600);
    }
    const toggle = () => { if (video.paused || video.ended) { const p = video.play(); if (p && p.catch) p.catch(() => {}); } else video.pause(); };
    const seekBy = s => { video.currentTime = clamp(video.currentTime + s, 0, dur()); paint(); wake(); };
    const setVol = v => { v = clamp(v); try { video.volume = v; } catch (e) {} video.muted = v === 0; sync(); };
    const toggleMute = () => { video.muted = !video.muted; if (!video.muted && video.volume === 0) { try { video.volume = 0.6; } catch (e) {} } sync(); };
    function toggleFs() {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else if (player.requestFullscreen) { const p = player.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone: only the system player can go full screen
    }

    ['play', 'pause', 'ended', 'volumechange', 'loadedmetadata', 'durationchange'].forEach(ev => video.addEventListener(ev, sync));
    video.addEventListener('play', () => { if (!raf) raf = requestAnimationFrame(tick); });
    ['timeupdate', 'progress', 'seeked'].forEach(ev => video.addEventListener(ev, paint));
    video.addEventListener('waiting', () => player.classList.add('waiting'));
    ['playing', 'canplay', 'pause', 'seeked'].forEach(ev => video.addEventListener(ev, () => player.classList.remove('waiting')));
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, sync));

    // a touch on the picture first brings the bar back; a click (or a second touch) plays or pauses
    let lastPointer = 'mouse', wasIdle = false;
    player.addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; wasIdle = player.classList.contains('idle'); }, true);
    video.addEventListener('click', () => {
      if (lastPointer !== 'mouse' && wasIdle) { wasIdle = false; wake(); return; }
      toggle();
    });
    video.addEventListener('dblclick', () => { if (lastPointer === 'mouse') toggleFs(); });
    big.addEventListener('click', toggle);
    playBtn.addEventListener('click', toggle);
    muteBtn.addEventListener('click', toggleMute);
    fsBtn.addEventListener('click', toggleFs);
    ['pointermove', 'pointerdown', 'focusin'].forEach(ev => player.addEventListener(ev, wake));

    // sliders: click or drag, mouse and touch alike
    function drag(el, apply) {
      const at = e => { const r = el.getBoundingClientRect(); apply(clamp((e.clientX - r.left) / r.width)); };
      el.addEventListener('pointerdown', e => {
        if (e.button) return;
        el.classList.add('drag');
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
        at(e);
        e.preventDefault();
      });
      el.addEventListener('pointermove', e => { if (el.classList.contains('drag')) at(e); });
      const end = () => { el.classList.remove('drag'); wake(); };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    }
    drag(seek, p => { video.currentTime = p * dur(); paint(); });
    drag(volEl, setVol);

    player.addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const onButton = e.target.tagName === 'BUTTON', onVol = e.target === volEl;
      let used = true;
      switch (e.key) {
        case ' ': case 'Enter': if (onButton) return; toggle(); break;
        case 'k': case 'K': toggle(); break;
        case 'ArrowLeft': onVol ? setVol(video.volume - 0.1) : seekBy(-5); break;
        case 'ArrowRight': onVol ? setVol(video.volume + 0.1) : seekBy(5); break;
        case 'ArrowUp': setVol((video.muted ? 0 : video.volume) + 0.1); break;
        case 'ArrowDown': setVol((video.muted ? 0 : video.volume) - 0.1); break;
        case 'Home': video.currentTime = 0; paint(); break;
        case 'End': video.currentTime = dur(); paint(); break;
        case 'm': case 'M': toggleMute(); break;
        case 'f': case 'F': toggleFs(); break;
        default: used = false;
      }
      if (used) { e.preventDefault(); wake(); }
    });

    // pause when the trailer leaves the screen
    new IntersectionObserver(es => { if (!es[0].isIntersecting && !video.paused && !fsEl()) video.pause(); }, { threshold: 0.15 }).observe(video);
    sync();
  }

  /* ---------- copy buttons ---------- */
  const toast = $('#toast');
  let toastT = 0;
  const say = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('show'), 1800); };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e2) {}
      ta.remove();
      return ok;
    }
  }
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const ok = await copy(b.dataset.copy);
    say(ok ? 'Copied: ' + b.dataset.copy : 'Copy failed: ' + b.dataset.copy);
    if (!ok) return;
    const old = b.textContent;
    b.textContent = 'Copied'; b.classList.add('ok');
    setTimeout(() => { b.textContent = old; b.classList.remove('ok'); }, 1600);
  }));

  /* ---------- resume buttons appear only when resume.pdf exists ---------- */
  if (location.protocol.startsWith('http')) {
    fetch('resume.pdf', { method: 'HEAD', cache: 'no-store' })
      .then(r => { if (r.ok && /pdf/i.test(r.headers.get('content-type') || 'pdf')) $$('[data-resume]').forEach(a => { a.hidden = false; a.target = '_blank'; a.rel = 'noopener'; }); })
      .catch(() => {});
  }

  /* ---------- motion switch ---------- */
  const toggle = $('#motion-toggle');
  const paint = () => { toggle.textContent = 'Motion: ' + (motion ? 'on' : 'off'); toggle.setAttribute('aria-pressed', String(motion)); };
  toggle.addEventListener('click', () => {
    motion = !motion;
    root.classList.toggle('nomotion', !motion);
    try { localStorage.setItem('motion', motion ? 'on' : 'off'); } catch (e) {}
    $$('.panel, [data-grow], [data-parallax]').forEach(el => { el.style.transform = ''; el.style.filter = ''; el.style.visibility = ''; });
    layoutStack();
    if (marquee && marquee._setup) marquee._setup();
    frame();
    paint();
  });
  paint();

  $('#year').textContent = new Date().getFullYear();
})();
