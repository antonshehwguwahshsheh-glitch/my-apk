const c = document.getElementById('c'), ctx = c.getContext('3d');
let W, H, run = false, lastT = 0, deaths = 0, stage = 1;
let p = { x: 0, y: 50, z: 0, vy: 0, yaw: 0, ground: false, sx: 0, sy: 50, sz: 0 };
let moveJoy = { on: false, id: 0, sx: 0, sy: 0, dx: 0, dy: 0 };
let lookTouch = { on: false, id: 0, lx: 0 };
let jumpPressed = false, plats = [];

function build3DLevel() {
  // x, y (высота), z (вперёд), w (ширина), h (толщина), d (длина), t (тип)
  plats = [
    { x: -70, y: 0, z: -40, w: 140, h: 20, d: 180, t: 'norm' },
    { x: -45, y: 10, z: 180, w: 90, h: 20, d: 90, t: 'norm' },
    { x: -45, y: 25, z: 310, w: 90, h: 20, d: 90, t: 'norm' },
    { x: -70, y: 25, z: 440, w: 140, h: 20, d: 120, t: 'cp', id: 2 },
    // Этап 2: Дорога с лавой
    { x: -60, y: 25, z: 600, w: 120, h: 20, d: 340, t: 'norm' },
    { x: -60, y: 28, z: 680, w: 120, h: 6, d: 35, t: 'lava' },
    { x: -60, y: 28, z: 810, w: 120, h: 6, d: 35, t: 'lava' },
    { x: -70, y: 35, z: 980, w: 140, h: 20, d: 120, t: 'cp', id: 3 },
    // Этап 3: Прыжки зигзагом
    { x: -110, y: 50, z: 1140, w: 80, h: 20, d: 80, t: 'norm' },
    { x: 30, y: 65, z: 1260, w: 80, h: 20, d: 80, t: 'norm' },
    { x: -110, y: 80, z: 1380, w: 80, h: 20, d: 80, t: 'norm' },
    { x: -80, y: 85, z: 1500, w: 160, h: 20, d: 160, t: 'win' }
  ];
}

function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
window.onresize = resize; resize();

document.getElementById('jumpBtn').ontouchstart = e => { e.preventDefault(); jumpPressed = true; };
document.getElementById('jumpBtn').ontouchend = e => { e.preventDefault(); jumpPressed = false; };

c.ontouchstart = e => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    if (t.clientX < W / 2 && !moveJoy.on) moveJoy = { on: true, id: t.identifier, sx: t.clientX, sy: t.clientY, dx: 0, dy: 0 };
    else if (t.clientX >= W / 2 && !lookTouch.on) lookTouch = { on: true, id: t.identifier, lx: t.clientX };
  }
};
c.ontouchmove = e => {
  e.preventDefault();
  let sens = +document.getElementById('sens').value * 0.0018;
  for (let t of e.changedTouches) {
    if (moveJoy.on && t.identifier === moveJoy.id) {
      let dx = t.clientX - moveJoy.sx, dy = t.clientY - moveJoy.sy, d = Math.hypot(dx, dy);
      if (d > 50) { dx = dx / d * 50; dy = dy / d * 50; }
      moveJoy.dx = dx / 50; moveJoy.dy = -dy / 50;
    } else if (lookTouch.on && t.identifier === lookTouch.id) {
      p.yaw += (t.clientX - lookTouch.lx) * sens;
      lookTouch.lx = t.clientX;
    }
  }
};
c.ontouchend = e => {
  for (let t of e.changedTouches) {
    if (t.identifier === moveJoy.id) { moveJoy.on = false; moveJoy.dx = 0; moveJoy.dy = 0; }
    if (t.identifier === lookTouch.id) lookTouch.on = false;
  }
};

function start() {
  document.getElementById('menu').classList.add('hid');
  document.getElementById('hud').classList.remove('hid');
  document.getElementById('jumpBtn').classList.remove('hid');
  deaths = 0; stage = 1;
  p = { x: 0, y: 60, z: 20, vy: 0, yaw: 0, ground: false, sx: 0, sy: 60, sz: 20 };
  build3DLevel(); run = true; requestAnimationFrame(loop);
}

function stop() {
  run = false;
  document.getElementById('hud').classList.add('hid');
  document.getElementById('jumpBtn').classList.add('hid');
  document.getElementById('menu').classList.remove('hid');
}

function die() { deaths++; p.x = p.sx; p.y = p.sy; p.z = p.sz; p.vy = 0; }

function loop(t) {
  if (!run) return;
  requestAnimationFrame(loop);
  if (t - lastT < 16) return;
  lastT = t;

  // Движение вперёд/назад и вбок с учётом поворота камеры
  let spd = 4.2;
  let sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
  p.x += (moveJoy.dy * sin + moveJoy.dx * cos) * spd;
  p.z += (moveJoy.dy * cos - moveJoy.dx * sin) * spd;

  if (jumpPressed && p.ground) { p.vy = 9.5; p.ground = false; }
  p.vy -= 0.5;
  p.y += p.vy;
  p.ground = false;

  let eyeH = 42; // Рост игрока
  for (let pl of plats) {
    if (p.x + 12 > pl.x && p.x - 12 < pl.x + pl.w && p.z + 12 > pl.z && p.z - 12 < pl.z + pl.d) {
      if (p.y - eyeH <= pl.y && p.y - eyeH >= pl.y - pl.h - 15 && p.vy <= 0) {
        if (pl.t === 'lava') return die();
        if (pl.t === 'win') { alert('ПОБЕДА В 3D! Смертей: ' + deaths); return stop(); }
        p.y = pl.y + eyeH; p.vy = 0; p.ground = true;
        if (pl.t === 'cp' && stage < pl.id) { stage = pl.id; p.sx = pl.x + pl.w/2; p.sy = pl.y + 60; p.sz = pl.z + pl.d/2; }
      }
    }
  }

  if (p.y < -150) die();
  document.getElementById('st').innerText = stage;
  document.getElementById('dt').innerText = deaths;
  draw3D();
}

function project(x, y, z) {
  let dx = x - p.x, dy = y - p.y, dz = z - p.z;
  let sin = Math.sin(-p.yaw), cos = Math.cos(-p.yaw);
  let rx = dx * cos - dz * sin;
  let rz = dx * sin + dz * cos;
  if (rz < 8) rz = 8;
  let fov = W * 0.65;
  return { x: W / 2 + (rx / rz) * fov, y: H / 2 - (dy / rz) * fov, z: rz };
}

function drawQuad(p1, p2, p3, p4, col) {
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
  ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
}

function draw3D() {
  ctx.fillStyle = '#4fc3f7'; ctx.fillRect(0, 0, W, H); // Небо

  // Сортируем платформы от дальних к ближним
  let sorted = [...plats].sort((a, b) => Math.hypot(b.x + b.w/2 - p.x, b.z + b.d/2 - p.z) - Math.hypot(a.x + a.w/2 - p.x, a.z + a.d/2 - p.z));

  for (let pl of sorted) {
    let c1 = project(pl.x, pl.y, pl.z), c2 = project(pl.x + pl.w, pl.y, pl.z);
    let c3 = project(pl.x + pl.w, pl.y, pl.z + pl.d), c4 = project(pl.x, pl.y, pl.z + pl.d);
    let b1 = project(pl.x, pl.y - pl.h, pl.z), b2 = project(pl.x + pl.w, pl.y - pl.h, pl.z);
    let b3 = project(pl.x + pl.w, pl.y - pl.h, pl.z + pl.d), b4 = project(pl.x, pl.y - pl.h, pl.z + pl.d);

    if (c1.z <= 8 && c2.z <= 8 && c3.z <= 8 && c4.z <= 8) continue;

    let topCol = pl.t === 'lava' ? '#ff1744' : pl.t === 'win' ? '#ffd700' : pl.t === 'cp' ? (stage >= pl.id ? '#00e676' : '#bdbdbd') : '#eceff1';
    let sideCol = pl.t === 'lava' ? '#b71c1c' : pl.t === 'win' ? '#ff8f00' : '#90a4ae';

    drawQuad(c1, c2, b2, b1, sideCol); // Передняя грань
    drawQuad(c2, c3, b3, b2, sideCol); // Правая грань
    drawQuad(c4, c1, b1, b4, sideCol); // Левая грань
    drawQuad(c1, c2, c3, c4, topCol);  // Верхняя площадка
  }

  // Руки персонажа от 1-го лица
  let bob = moveJoy.on ? Math.sin(Date.now() * 0.015) * 10 : 0;
  ctx.fillStyle = document.getElementById('skin').value;
  ctx.fillRect(W * 0.18, H - 90 + bob, 45, 110);
  ctx.fillRect(W * 0.82 - 45, H - 90 - bob, 45, 110);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.strokeRect(W * 0.18, H - 90 + bob, 45, 110);
  ctx.strokeRect(W * 0.82 - 45, H - 90 - bob, 45, 110);
        }
    
