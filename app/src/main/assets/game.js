const c = document.getElementById('c'), ctx = c.getContext('2d');
let W, H, run = false, score = 0, p, bots = [], bul = [], walls = [];
let lJoy = { on: false, id: 0, sx: 0, sy: 0, dx: 0, dy: 0 };
let rJoy = { on: false, id: 0, sx: 0, sy: 0, dx: 0, dy: 0 };

const MAPS = {
  dust: { bg: '#d4b483', w: '#8d6e63' },
  hangar: { bg: '#37474f', w: '#607d8b' },
  cyber: { bg: '#12131f', w: '#00e5ff' }
};
const SKINS = {
  std: { g: '#444', b: '#ffeb3b' },
  gold: { g: '#ffd700', b: '#ffd700' },
  asim: { g: '#fff', b: '#ff6d00' },
  neon: { g: '#6200ea', b: '#00e5ff' }
};

function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
window.onresize = resize; resize();

c.ontouchstart = e => {
  e.preventDefault();
  for (let t of e.changedTouches) {
    if (t.clientX < W / 2 && !lJoy.on) lJoy = { on: true, id: t.identifier, sx: t.clientX, sy: t.clientY, dx: 0, dy: 0 };
    else if (t.clientX >= W / 2 && !rJoy.on) rJoy = { on: true, id: t.identifier, sx: t.clientX, sy: t.clientY, dx: 0, dy: 0 };
  }
};
c.ontouchmove = e => {
  e.preventDefault();
  let max = +document.getElementById('jsize').value;
  for (let t of e.changedTouches) {
    let j = (lJoy.on && t.identifier === lJoy.id) ? lJoy : (rJoy.on && t.identifier === rJoy.id) ? rJoy : null;
    if (j) {
      let dx = t.clientX - j.sx, dy = t.clientY - j.sy, d = Math.hypot(dx, dy);
      if (d > max) { dx = dx / d * max; dy = dy / d * max; }
      j.dx = dx / max; j.dy = dy / max;
    }
  }
};
c.ontouchend = e => {
  for (let t of e.changedTouches) {
    if (t.identifier === lJoy.id) lJoy.on = false;
    if (t.identifier === rJoy.id) rJoy.on = false;
  }
};

function start() {
  document.getElementById('menu').classList.add('hid');
  document.getElementById('hud').classList.remove('hid');
  p = { x: 800, y: 800, r: 18, a: 0, hp: 100, t: 0 };
  score = 0; bul = []; bots = [];
  walls = [
    {x:0,y:0,w:1600,h:30}, {x:0,y:1570,w:1600,h:30}, {x:0,y:0,w:30,h:1600}, {x:1570,y:0,w:30,h:1600},
    {x:350,y:350,w:200,h:50}, {x:1050,y:350,w:200,h:50}, {x:350,y:1200,w:200,h:50}, {x:1050,y:1200,w:200,h:50},
    {x:700,y:700,w:200,h:200}
  ];
  for (let i = 0; i < +document.getElementById('bots').value; i++) spawnBot();
  run = true; loop();
}

function stop() {
  run = false;
  document.getElementById('hud').classList.add('hid');
  document.getElementById('menu').classList.remove('hid');
}

function spawnBot() {
  bots.push({ x: 100 + Math.random() * 1400, y: 100 + Math.random() * 1400, r: 18, a: 0, hp: 100, t: 0 });
}

function move(o, vx, vy) {
  o.x += vx;
  for (let w of walls) if (o.x+o.r>w.x && o.x-o.r<w.x+w.w && o.y+o.r>w.y && o.y-o.r<w.y+w.h) o.x -= vx;
  o.y += vy;
  for (let w of walls) if (o.x+o.r>w.x && o.x-o.r<w.x+w.w && o.y+o.r>w.y && o.y-o.r<w.y+w.h) o.y -= vy;
}

function fire(o, isP) {
  if (Date.now() - o.t < (isP ? 180 : 700)) return;
  o.t = Date.now();
  let col = isP ? SKINS[document.getElementById('skin').value].b : '#ff5252';
  bul.push({ x: o.x + Math.cos(o.a)*25, y: o.y + Math.sin(o.a)*25, vx: Math.cos(o.a)*13, vy: Math.sin(o.a)*13, isP, col, l: 60 });
}

function loop() {
  if (!run) return;
  if (lJoy.on) { move(p, lJoy.dx * 4, lJoy.dy * 4); if (!rJoy.on) p.a = Math.atan2(lJoy.dy, lJoy.dx); }
  if (rJoy.on && Math.hypot(rJoy.dx, rJoy.dy) > 0.2) { p.a = Math.atan2(rJoy.dy, rJoy.dx); fire(p, true); }

  for (let b of bots) {
    let d = Math.hypot(p.x - b.x, p.y - b.y);
    b.a = Math.atan2(p.y - b.y, p.x - b.x);
    if (d > 200) move(b, Math.cos(b.a) * 2.2, Math.sin(b.a) * 2.2);
    if (d < 600) fire(b, false);
  }

  for (let i = bul.length - 1; i >= 0; i--) {
    let bl = bul[i]; bl.x += bl.vx; bl.y += bl.vy; bl.l--;
    if (bl.l <= 0 || walls.some(w => bl.x>w.x && bl.x<w.x+w.w && bl.y>w.y && bl.y<w.y+w.h)) { bul.splice(i, 1); continue; }
    if (bl.isP) {
      for (let j = bots.length - 1; j >= 0; j--) {
        if (Math.hypot(bl.x - bots[j].x, bl.y - bots[j].y) < 22) {
          bots[j].hp -= 25; bul.splice(i, 1);
          if (bots[j].hp <= 0) { bots.splice(j, 1); score++; spawnBot(); }
          break;
        }
      }
    } else if (Math.hypot(bl.x - p.x, bl.y - p.y) < 22) {
      p.hp -= 10; bul.splice(i, 1);
      if (p.hp <= 0) { alert('Счёт: ' + score); stop(); return; }
    }
  }

  document.getElementById('hp').innerText = p.hp;
  document.getElementById('sc').innerText = score;
  draw(); requestAnimationFrame(loop);
}

function draw() {
  let m = MAPS[document.getElementById('map').value], shd = document.getElementById('shd').checked;
  ctx.fillStyle = m.bg; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W/2 - p.x, H/2 - p.y);

  for (let w of walls) {
    if (shd) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(w.x+6, w.y+6, w.w, w.h); }
    ctx.fillStyle = m.w; ctx.fillRect(w.x, w.y, w.w, w.h);
  }
  for (let bl of bul) { ctx.fillStyle = bl.col; ctx.beginPath(); ctx.arc(bl.x, bl.y, 4, 0, 7); ctx.fill(); }
  
  const drawBot = (o, col, gun) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
    ctx.fillStyle = gun; ctx.fillRect(10, -4, 22, 8);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 7); ctx.fill();
    ctx.restore();
  };
  for (let b of bots) drawBot(b, '#e53935', '#222');
  drawBot(p, '#1e88e5', SKINS[document.getElementById('skin').value].g);
  ctx.restore();
                                                     }
      
