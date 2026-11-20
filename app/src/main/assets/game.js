const c = document.getElementById('c'), ctx = c.getContext('2d');
let W, H, run = false, lastT = 0, deaths = 0, stage = 1;
let p = { x: 0, y: 35, z: 0, vy: 0, yaw: 0, ground: false, sx: 0, sy: 35, sz: 0 };
let keys = { f: false, b: false, l: false, r: false, j: false };
let look = { on: false, id: 0, lx: 0 }, plats = [];

const ALL_SKINS = [
  { id: '#ffeb3b', name: 'Нуб (Жёлтые)', req: 0 },
  { id: '#ffd700', name: 'Золото VIP (1 победа)', req: 1 },
  { id: '#00e5ff', name: 'Кибер-неон (2 победы)', req: 2 },
  { id: '#ff1744', name: 'Красный дракон (3 победы)', req: 3 }
];

let prof = JSON.parse(localStorage.getItem('obby_prof')) || { nick: 'ProPlayer', wins: 0 };
document.getElementById('nick').value = prof.nick;

function saveProf() {
  prof.nick = document.getElementById('nick').value || 'Игрок';
  localStorage.setItem('obby_prof', JSON.stringify(prof));
}

function updateMenuSkins() {
  document.getElementById('winsTxt').innerText = prof.wins;
  let sel = document.getElementById('skin');
  let cur = sel.value;
  sel.innerHTML = '';
  for (let s of ALL_SKINS) {
    let opt = document.createElement('option');
    opt.value = s.id;
    let locked = prof.wins < s.req;
    opt.disabled = locked;
    opt.innerText = locked ? '🔒 ' + s.name : '✅ ' + s.name;
    sel.appendChild(opt);
  }
  if (cur && ![...sel.options].find(o => o.value === cur)?.disabled) sel.value = cur;
}
updateMenuSkins();

function build3DLevel() {
  plats = [
    { x: -80, y: 0, z: -20, w: 160, h: 20, d: 220, t: 'norm' },
    { x: -50, y: 12, z: 230, w: 100, h: 20, d: 100, t: 'norm' },
    { x: -50, y: 24, z: 360, w: 100, h: 20, d: 100, t: 'norm' },
    { x: -75, y: 24, z: 490, w: 150, h: 20, d: 130, t: 'cp', id: 2 },
    { x: -65, y: 24, z: 650, w: 130, h: 20, d: 340, t: 'norm' },
    { x: -65, y: 27, z: 730, w: 130, h: 6, d: 35, t: 'lava' },
    { x: -65, y: 27, z: 860, w: 130, h: 6, d: 35, t: 'lava' },
    { x: -75, y: 34, z: 1020, w: 150, h: 20, d: 130, t: 'cp', id: 3 },
    { x: -110, y: 48, z: 1180, w: 85, h: 20, d: 85, t: 'norm' },
    { x: 25, y: 62, z: 1300, w: 85, h: 20, d: 85, t: 'norm' },
    { x: -110, y: 76, z: 1420, w: 85, h: 20, d: 85, t: 'norm' },
    { x: -85, y: 80, z: 1540, w: 170, h: 20, d: 170, t: 'win' }
  ];
}

function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
window.onresize = resize; resize();

function bind(id, k) {
  let el = document.getElementById(id);
  if (!el) return;
  el.ontouchstart = e => { e.preventDefault(); keys[k] = true; };
  el.ontouchend = e => { e.preventDefault(); keys[k] = false; };
  el.ontouchcancel = e => { keys[k] = false; };
}
bind('bF', 'f'); bind('bB', 'b'); bind('bL', 'l'); bind('bR', 'r'); bind('jumpBtn', 'j');

c.ontouchstart = e => {
  e.preventDefault();
  if (!look.on && e.changedTouches.length > 0) {
    let t = e.changedTouches[0];
    look = { on: true, id: t.identifier, lx: t.clientX };
  }
};
c.ontouchmove = e => {
  e.preventDefault();
  let sens = +document.getElementById('sens').value * 0.0018;
  for (let t of e.changedTouches) {
    if (look.on && t.identifier === look.id) {
      p.yaw += (t.clientX - look.lx) * sens;
      look.lx = t.clientX;
    }
  }
};
c.ontouchend = e => {
  for (let t of e.changedTouches) {
    if (t.identifier === look.id) look.on = false;
  }
};

function start() {
  saveProf();
  let hudNick = document.getElementById('hudNick');
  if (hudNick) hudNick.innerText = prof.nick;
  document.getElementById('menu').classList.add('hid');
  document.getElementById('hud').classList.remove('hid');
  let ctrls = document.getElementById('ctrls');
  if (ctrls) ctrls.classList.remove('hid');
  document.getElementById('jumpBtn').classList.remove('hid');
  deaths = 0; stage = 1;
  p = { x: 0, y: 40, z: 30, vy: 0, yaw: 0, ground: false, sx: 0, sy: 40, sz: 30 };
  build3DLevel(); run = true; requestAnimationFrame(loop);
}

function stop() {
  run = false;
  updateMenuSkins();
  document.getElementById('hud').classList.add('hid');
  let ctrls = document.getElementById('ctrls');
  if (ctrls) ctrls.classList.add('hid');
  document.getElementById('jumpBtn').classList.add('hid');
  document.getElementById('menu').classList.remove('hid');
}

function die() { deaths++; p.x = p.sx; p.y = p.sy; p.z = p.sz; p.vy = 0; }

function loop(t) {
  if (!run) return;
  requestAnimationFrame(loop);
  if (t - lastT < 16) return;
  lastT = t;

  let fwd = (keys.f ? 1 : 0) - (keys.b ? 1 : 0);
  let str = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
  let spd = 4.2, sin = Math.sin(p.yaw), cos = Math.cos(p.yaw);
  p.x += (fwd * sin + str * cos) * spd;
  p.z += (fwd * cos - str * sin) * spd;

  if (keys.j && p.ground) { p.vy = 9.5; p.ground = false; }
  p.vy -= 0.5;
  p.y += p.vy;
  p.ground = false;

  let eyeH = 35;
  for (let pl of plats) {
    if (p.x + 12 > pl.x && p.x - 12 < pl.x + pl.w && p.z + 12 > pl.z && p.z - 12 < pl.z + pl.d) {
      if (p.y - eyeH <= pl.y && p.y - eyeH >= pl.y - pl.h - 15 && p.vy <= 0) {
        if (pl.t === 'lava') return die();
        if (pl.t === 'win') {
          prof.wins++;
          saveProf();
          let unlocked = ALL_SKINS.find(s => s.req === prof.wins);
          let msg = 'МАТЧ ПРОЙДЕН! Побед: ' + prof.wins;
          if (unlocked) msg += '\n🎁 НОВЫЙ СКИН ОТКРЫТ: ' + unlocked.name;
          alert(msg);
          return stop();
        }
        p.y = pl.y + eyeH; p.vy = 0; p.ground = true;
        if (pl.t === 'cp' && stage < pl.id) { stage = pl.id; p.sx = pl.x + pl.w/2; p.sy = pl.y + 45; p.sz = pl.z + pl.d/2; }
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
  let sy = Math.sin(-p.yaw), cy = Math.cos(-p.yaw);
  let rx = dx * cy - dz * sy;
  let rz = dx * sy + dz * cy;
  let rawZ = rz;
  let sp = Math.sin(-0.24), cp = Math.cos(-0.24);
  let ry = dy * cp - rz * sp;
  let fz = dy * sp + rz * cp;
  if (fz < 6) fz = 6;
  let fov = Math.min(W, H) * 0.95;
  return { x: W / 2 + (rx / fz) * fov, y: H / 2 - (ry / fz) * fov, rawZ: rawZ };
}

function drawQuad(p1, p2, p3, p4, col) {
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.closePath();
  ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.stroke();
}

function draw3D() {
  ctx.fillStyle = '#4fc3f7'; ctx.fillRect(0, 0, W, H);
  let sorted = [...plats].sort((a, b) => Math.hypot(b.x + b.w/2 - p.x, b.z + b.d/2 - p.z) - Math.hypot(a.x + a.w/2 - p.x, a.z + a.d/2 - p.z));

  for (let pl of sorted) {
    let c1 = project(pl.x, pl.y, pl.z), c2 = project(pl.x + pl.w, pl.y, pl.z);
    let c3 = project(pl.x + pl.w, pl.y, pl.z + pl.d), c4 = project(pl.x, pl.y, pl.z + pl.d);
    if (c1.rawZ <= 6 && c2.rawZ <= 6 && c3.rawZ <= 6 && c4.rawZ <= 6) continue;

    let b1 = project(pl.x, pl.y - pl.h, pl.z), b2 = project(pl.x + pl.w, pl.y - pl.h, pl.z);
    let b3 = project(pl.x + pl.w, pl.y - pl.h, pl.z + pl.d), b4 = project(pl.x, pl.y - pl.h, pl.z + pl.d);

    let topCol = pl.t === 'lava' ? '#ff1744' : pl.t === 'win' ? '#ffd700' : pl.t === 'cp' ? (stage >= pl.id ? '#00e676' : '#bdbdbd') : '#eceff1';
    let sideCol = pl.t === 'lava' ? '#b71c1c' : pl.t === 'win' ? '#ff8f00' : '#78909c';

    drawQuad(c1, c2, b2, b1, sideCol);
    drawQuad(c2, c3, b3, b2, sideCol);
    drawQuad(c4, c1, b1, b4, sideCol);
    drawQuad(c1, c2, c3, c4, topCol);
  }

  let moving = keys.f || keys.b || keys.l || keys.r;
  let bob = moving ? Math.sin(Date.now() * 0.015) * 10 : 0;
  ctx.fillStyle = document.getElementById('skin').value || '#ffeb3b';
  ctx.fillRect(W * 0.28, H - 80 + bob, 40, 100);
  ctx.fillRect(W * 0.72 - 40, H - 80 - bob, 40, 100);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  ctx.strokeRect(W * 0.28, H - 80 + bob, 40, 100);
  ctx.strokeRect(W * 0.72 - 40, H - 80 - bob, 40, 100);
      }
          
