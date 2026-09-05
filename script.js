
(function buildField() {
  const host = document.getElementById('field');
  if (!host) return;

  const step = 30;
  const dots = [];

  function layout() {
    host.innerHTML = '';
    dots.length = 0;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const d = document.createElement('span');
        d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:3px;height:3px;margin:-1.5px 0 0 -1.5px;border-radius:50%;background:oklch(0.95 0.004 260);opacity:0.06;will-change:transform,opacity`;
        host.appendChild(d);
        dots.push({ el: d, x, y, o: 0.06, s: 1 });
      }
    }
  }
  layout();

  let mx = -9999, my = -9999;
  window.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  }, { passive: true });

  const R = 160; 

  function tick() {
    requestAnimationFrame(tick);
    for (const d of dots) {
      const dx = d.x - mx, dy = d.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = dist < R ? 1 - dist / R : 0;
      d.o += (0.06 + t * 0.55 - d.o) * 0.12;
      d.s += (1 + t * 2.2 - d.s) * 0.12;
      d.el.style.opacity = d.o.toFixed(3);
      d.el.style.transform = `scale(${d.s.toFixed(3)})`;
    }
  }
  tick();

  new ResizeObserver(() => layout()).observe(host);
})();

(function buildBoard() {
  const capgrid = document.getElementById('capgrid');
  const scene = document.getElementById('scene');
  const board = document.getElementById('board');
  if (!capgrid || !scene || !board) return;

  const CAPS = [
    ['GO', '#00ADD8', '#06232B'],
    ['C++', '#0B5FA5', '#EAF2FA'],
    ['PY', '#F2C245', '#22201A'],
    ['JS', '#E8D44D', '#201F16'],
    ['TS', '#2F7BC6', '#EDF4FB'],
    ['SQL', '#3E9E96', '#06231F'],
    ['EPOLL', '#2E3540', '#F0B357'],
    ['ASYNC', '#2E3540', '#F0B357'],
    ['MEM', '#2E3540', '#F0B357'],
    ['PERF', '#2E3540', '#F0B357'],
    ['REST', '#6E56C8', '#F2EEFF'],
    ['gRPC', '#1F9E9A', '#04231F'],
    ['PROTO', '#4A6FA5', '#EEF4FB'],
    ['REDIS', '#CE3B2E', '#FFF0EE'],
    ['PG', '#33608F', '#EAF2FA'],
    ['DOCKR', '#2492E8', '#EAF6FF'],
    ['AWS', '#F0912B', '#251405'],
    ['LINUX', '#E4B33C', '#241C08'],
    ['GIT', '#E1552B', '#FFF0EA'],
    ['ESP32', '#D9463C', '#FFEFEE'],
  ];

  CAPS.forEach(([label, color, textColor]) => {
    const cap = document.createElement('div');
    cap.className = 'cap';
    const large = label.length <= 3 ? ' large' : '';
    cap.innerHTML = `
      <div class="cap-box">
        <div class="cap-face${large}" style="background: linear-gradient(166deg, color-mix(in oklab, ${color} 82%, white), ${color} 58%, color-mix(in oklab, ${color} 88%, black)); color: ${textColor}">${label}</div>
      </div>`;
    capgrid.appendChild(cap);
  });

  function capEls() { return Array.from(capgrid.querySelectorAll('.cap')); }

  const VIEW0 = { rx: 58, rz: -32, px: 0, py: 0 };
  let view = Object.assign({}, VIEW0);
  let scale = 1;
  let assembled = false;
  let scattered = false;

  function fit() {
    if (!scene.clientWidth) return;
    scale = Math.max(0.45, Math.min(1.05, Math.min(scene.clientWidth / 520, scene.clientHeight / 430)));
    applyView(false);
  }

  function applyView(animate) {
    board.style.transition = animate ? 'transform .7s cubic-bezier(.2,.7,.2,1)' : 'none';
    board.style.transform = `translate(${view.px.toFixed(1)}px, ${view.py.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateX(${view.rx.toFixed(2)}deg) rotateZ(${view.rz.toFixed(2)}deg)`;
  }

  function scatter() {
    const rnd = (a, b) => a + Math.random() * (b - a);
    capEls().forEach((el, i) => {
      el.style.transitionDelay = (i % 6) * 24 + 'ms';
      const z = rnd(45, 175), yb = z * 1.5;
      const y = yb + rnd(-72, 72), x = -0.625 * yb + rnd(-88, 88);
      el.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, ${z.toFixed(0)}px) rotateX(${rnd(-38, 38).toFixed(0)}deg) rotateY(${rnd(-38, 38).toFixed(0)}deg) rotateZ(${rnd(-45, 45).toFixed(0)}deg)`;
    });
    capgrid.classList.add('floating');
  }

  function assembleFn() {
    capEls().forEach((el, i) => {
      el.style.transitionDelay = i * 28 + 'ms';
      el.style.transform = 'translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
    });
    capgrid.classList.remove('floating');
  }

  document.getElementById('toggle-assemble').onclick = (e) => {
    e.preventDefault();
    assembled = !assembled;
    document.getElementById('assemble-label').textContent = assembled ? 'Scatter' : 'Assemble';
    document.getElementById('board-hint').textContent = assembled
      ? 'drag to rotate · shift-drag to move'
      : 'twenty things I work with — press assemble';
    if (assembled) assembleFn(); else scatter();
  };

  document.getElementById('reset-view').onclick = (e) => {
    e.preventDefault();
    view = Object.assign({}, VIEW0);
    applyView(true);
  };

  let on = false, lx = 0, ly = 0, pan = false;
  scene.addEventListener('pointerdown', (e) => {
    on = true;
    pan = e.shiftKey || e.button === 1;
    lx = e.clientX; ly = e.clientY;
    scene.style.cursor = pan ? 'move' : 'grabbing';
    if (scene.setPointerCapture) scene.setPointerCapture(e.pointerId);
  });
  scene.addEventListener('pointermove', (e) => {
    if (!on) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    if (pan) {
      view.px = Math.max(-150, Math.min(150, view.px + dx));
      view.py = Math.max(-130, Math.min(130, view.py + dy));
    } else {
      view.rz -= dx * 0.4;
      view.rx = Math.max(6, Math.min(84, view.rx - dy * 0.3));
    }
    applyView(false);
  });
  scene.addEventListener('pointerup', () => { on = false; scene.style.cursor = 'grab'; });
  scene.addEventListener('pointercancel', () => { on = false; scene.style.cursor = 'grab'; });

  new ResizeObserver(() => { fit(); if (!scattered) { scattered = true; scatter(); } }).observe(scene);
  window.addEventListener('load', () => { fit(); if (!scattered) { scattered = true; scatter(); } });
})();