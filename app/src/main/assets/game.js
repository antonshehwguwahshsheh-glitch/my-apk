const c = document.getElementById('c'), ctx = c.getContext('2d');
let W, H, run = false, deaths = 0, stage = 1;
let keys = { l: false, r: false, j: false };
let p = { x: 100, y: 300, w: 28, h: 42, vx: 0, vy: 0, ground: false, spawnX: 100, spawnY: 300 };

const SKINS = {
  noob: { head: '#ffeb3b', body: '#2196f3', legs: '#4caf50' },
  gold: { head: '#ffd700', body: '#ffb300', legs: '#ff8f00' },
  cyber: { head: '#212121', body: '#00e5ff', legs: '#111' },
  fire: { head: '#ff5722', body: '#d50000', legs: '#3e2723' }
};

// Платформы: t = 'norm' (обычная), 'lava' (красная убивает), 'move' (ездит), 'cp' (чекпоинт), 'win' (финиш)
let plats = [];

function buildLevel() {
  plats = [
    // Этап 1: Старт и простые прыжки
    { x: 40, y: 400, w: 200, h: 30, t: 'norm' },
    { x: 290, y: 370, w: 100, h: 25, t: 'norm' },
    { x: 440, y: 330, w: 100, h: 25, t: 'norm' },
    { x: 590, y: 330, w: 140, h: 25, t: 'cp', id: 2 },
    
    // Этап 2: Лава на полу!
    { x: 780, y: 330, w: 320, h: 25, t: 'norm' },
    { x: 850, y: 315, w: 40, h: 15, t: 'lava' },
    { x: 980, y: 315, w: 40, h: 15, t: 'lava' },
    { x: 1150, y: 300, w: 140, h: 25, t: 'cp', id: 3 },

    // Этап 3: Движущиеся платформы
    { x: 1350, y: 300, w: 110, h: 20, t: 'move', sx: 1350, range: 160, spd: 2.5, dir: 1 },
    { x: 1680, y: 260, w: 110, h: 20, t: 'move', sx: 1680, range: 160, spd: 3, dir: -1 },
    { x: 2000, y: 240, w: 140, h: 25, t: 'cp', id: 4 },

    // Этап 4: Лестница в небо с лавой
    { x: 2200, y: 200, w: 80, h: 20, t: 'norm' },
    { x: 2340, y: 150, w: 80, h: 20, t: 'norm' },
    { x: 2480, y: 100, w: 80, h: 20, t: 'norm' },
    { x: 2620, y: 100, w: 140, h: 25, t: 'cp', id: 5 },

    // Этап 5: Финальный рывок
    { x: 2820, y: 100, w: 350, h: 25, t: 'norm' },
    { x: 2900, y: 85, w: 45, h: 15, t: 'lava' },
    { x: 3030, y: 85, w: 45, h: 15, t: 'lava' },
    { x: 3230, y: 80, w: 160, h: 30, t: 'win' }
  ];
}

function resize() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
window.onresize = resize; resize();

// Настройка кнопок сенсора
function bindBtn(id, k) {
  let el = document.getElementById(id);
  el.ontouchstart = e => { e.preventDefault(); keys[k] = true; };
  el.ontouchend = e => { e.preventDefault(); keys[k] = false; };
}
bindBtn('btnL', 'l'); bindBtn('btnR', 'r'); bindBtn('btnJ', 'j');

function start() {
  document.getElementById('menu').classList.add('hid');
  document.getElementById('hud').classList.remove('hid');
  document.getElementById('controls').classList.remove('hid');
  deaths = 0; stage = 1;
  p = { x: 100, y: 300, w: 28, h: 42, vx: 0, vy: 0, ground: false, spawnX: 100, spawnY: 300 };
  buildLevel(); run = true; loop();
}

function stop() {
  run = false;
  document.getElementById('hud').classList.add('hid');
  document.getElementById('controls').classList.add('hid');
  document.getElementById('menu').classList.remove('hid');
}

function die() {
  deaths++;
  p.x = p.spawnX; p.y = p.spawnY; p.vx = 0; p.vy = 0;
}

function loop() {
  if (!run) return;

  // Движение платформ
  for (let pl of plats) {
    if (pl.t === 'move') {
      pl.x += pl.spd * pl.dir;
      if (pl.x > pl.sx + pl.range || pl.x < pl.sx) pl.dir *= -1;
    }
  }

  // Управление игроком
  p.vx = keys.l ? -5.5 : keys.r ? 5.5 : 0;
  if (keys.j && p.ground) { p.vy = -12.5; p.ground = false; }
  p.vy += 0.6; // Гравитация

  // Горизонталь
  p.x += p.vx;
  for (let pl of plats) {
    if (p.x + p.w > pl.x && p.x < pl.x + pl.w && p.y + p.h > pl.y && p.y < pl.y + pl.h) {
      if (pl.t === 'lava') { die(); return requestAnimationFrame(loop); }
      if (p.vx > 0) p.x = pl.x - p.w;
      if (p.vx < 0) p.x = pl.x + pl.w;
    }
  }

  // Вертикаль
  p.y += p.vy;
  p.ground = false;
  for (let pl of plats) {
    if (p.x + p.w > pl.x && p.x < pl.x + pl.w && p.y + p.h > pl.y && p.y < pl.y + pl.h) {
      if (pl.t === 'lava') { die(); return requestAnimationFrame(loop); }
      if (pl.t === 'win') { alert('ПОБЕДА! Ты прошёл Обби! Смертей: ' + deaths); stop(); return; }
      if (p.vy > 0) {
        p.y = pl.y - p.h; p.vy = 0; p.ground = true;
        if (pl.t === 'move') p.x += pl.spd * pl.dir;
        if (pl.t === 'cp' && stage < pl.id) {
          stage = pl.id; p.spawnX = pl.x + 50; p.spawnY = pl.y - 60;
        }
      } else if (p.vy < 0) {
        p.y = pl.y + pl.h; p.vy = 0;
      }
    }
  }

  if (p.y > 750) die(); // Упал вниз в пропасть

  document.getElementById('stage').innerText = stage;
  document.getElementById('deaths').innerText = deaths;
  draw(); requestAnimationFrame(loop);
}

function draw() {
  // Небо в стиле Roblox
  ctx.fillStyle = '#4fc3f7'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W/2 - p.x - 14, H/2 - p.y);

  for (let pl of plats) {
    ctx.fillStyle = pl.t === 'lava' ? '#ff1744' : pl.t === 'move' ? '#2979ff' : pl.t === 'win' ? '#ffd700' : pl.t === 'cp' ? (stage >= pl.id ? '#00e676' : '#9e9e9e') : '#eceff1';
    ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
    
    // Флажок на чекпоинте
    if (pl.t === 'cp' || pl.t === 'win') {
      ctx.fillStyle = '#333'; ctx.fillRect(pl.x + pl.w/2 - 2, pl.y - 45, 4, 45);
      ctx.fillStyle = pl.t === 'win' ? '#ff9800' : (stage >= pl.id ? '#00e676' : '#757575');
      ctx.fillRect(pl.x + pl.w/2 + 2, pl.y - 45, 25, 16);
    }
  }

  // Рисуем персонажа как в Roblox (голова, торс, ноги)
  let sk = SKINS[document.getElementById('skin').value];
  ctx.fillStyle = sk.head; ctx.fillRect(p.x + 6, p.y, 16, 14); // Голова
  ctx.fillStyle = sk.body; ctx.fillRect(p.x + 2, p.y + 14, 24, 16); // Торс
  ctx.fillStyle = sk.legs; ctx.fillRect(p.x + 4, p.y + 30, 9, 12); // Левая нога
  ctx.fillRect(p.x + 15, p.y + 30, 9, 12); // Правая нога

  ctx.restore();
        }
