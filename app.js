(() => {
  const deck = document.getElementById('deck');
  const slides = [...deck.querySelectorAll('.slide')];
  const dotsEl = document.getElementById('dots');
  const bar = document.getElementById('bar');
  const cur = document.getElementById('cur');
  document.getElementById('tot').textContent = slides.length;

  let i = -1, locked = false, timer = null;

  slides.forEach((s, n) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', s.dataset.title || `Slide ${n + 1}`);
    b.title = s.dataset.title || '';
    b.onclick = () => go(n);
    dotsEl.appendChild(b);
  });

  const fmt = (v, el) => {
    const dec = +el.dataset.dec || 0;
    let t = v.toFixed(dec).replace('.', ',');
    if (el.dataset.sep) t = t.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return t + (el.dataset.suffix || '');
  };

  function runCounters(slide) {
    slide.querySelectorAll('.count').forEach(el => {
      const to = parseFloat(el.dataset.to);
      const dur = 1800, delay = 700, t0 = performance.now() + delay;
      el.textContent = fmt(0, el);
      const tick = now => {
        if (!slide.classList.contains('active')) return;
        const p = Math.min(Math.max((now - t0) / dur, 0), 1);
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), el);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === i || locked) return;
    const prev = slides[i];
    document.body.classList.toggle('back', n < i);
    locked = true;
    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('leaving');
      setTimeout(() => prev.classList.remove('leaving'), 850);
    }
    i = n;
    const s = slides[i];
    s.classList.remove('leaving');
    void s.offsetWidth; // restart animations
    s.classList.add('active');
    runCounters(s);
    setTimeout(() => (locked = false), 700);

    [...dotsEl.children].forEach((d, k) => d.classList.toggle('on', k === i));
    cur.textContent = i + 1;
    bar.style.width = ((i + 1) / slides.length * 100) + '%';
    history.replaceState(null, '', '#' + (i + 1));
  }

  const next = () => go(i + 1);
  const prev = () => go(i - 1);
  document.getElementById('next').onclick = next;
  document.getElementById('prev').onclick = prev;

  // Keyboard
  addEventListener('keydown', e => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length - 1);
    else if (e.key.toLowerCase() === 'f') toggleFull();
    else if (e.key.toLowerCase() === 'p') toggleAuto();
  });

  // Wheel (debounced)
  let wheelAt = 0;
  addEventListener('wheel', e => {
    if (e.target.closest('.wrap') && e.target.closest('.wrap').scrollHeight > e.target.closest('.wrap').clientHeight + 4) return;
    const now = Date.now();
    if (now - wheelAt < 1100 || Math.abs(e.deltaY) < 20) return;
    wheelAt = now;
    e.deltaY > 0 ? next() : prev();
  }, { passive: true });

  // Touch swipe
  let tx = 0, ty = 0;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.3) dx < 0 ? next() : prev();
  }, { passive: true });

  // Fullscreen & autoplay
  function toggleFull() {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  }
  document.getElementById('full').onclick = toggleFull;

  const playBtn = document.getElementById('play');
  function toggleAuto() {
    if (timer) { clearInterval(timer); timer = null; playBtn.textContent = '▶'; return; }
    playBtn.textContent = '❚❚';
    timer = setInterval(() => {
      if (i >= slides.length - 1) { toggleAuto(); return; }
      next();
    }, 9000);
  }
  playBtn.onclick = toggleAuto;

  const start = parseInt(location.hash.slice(1), 10);
  go(start > 0 && start <= slides.length ? start - 1 : 0);
})();
