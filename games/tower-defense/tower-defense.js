// 8bitタワーディフェンス
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const lifeSpan = document.getElementById('life');
const moneySpan = document.getElementById('money');
const startBtn = document.getElementById('start-btn');
const towerBtns = [
    document.getElementById('tower-normal'),
    document.getElementById('tower-slow'),
    document.getElementById('tower-power')
];

const GRID_COLS = 20;
const GRID_ROWS = 12;
const CELL_SIZE = 32;
const GAME_W = GRID_COLS * CELL_SIZE;
const GAME_H = GRID_ROWS * CELL_SIZE;
canvas.width = GAME_W;
canvas.height = GAME_H;

let gameState = 'ready';
let life = 10;
let money = 100;
let enemies = [];
let towers = [];
let bullets = [];
let wave = 0;
let enemyTimer = 0;
let enemyInterval = 60;
let frame = 0;
let grid = [];
let selectedTowerType = 'normal';

// タワー種類定義
const TOWER_TYPES = {
    normal: { color: '#ffd700', cost: 50, cooldown: 30, range: 2, power: 1, slow: 0 },
    slow: { color: '#00bfff', cost: 60, cooldown: 40, range: 2, power: 1, slow: 0.5 },
    power: { color: '#ff5722', cost: 80, cooldown: 50, range: 3, power: 3, slow: 0 }
};

// タワー選択UI
for (const btn of towerBtns) {
    btn.onclick = () => {
        for (const b of towerBtns) b.classList.remove('selected');
        btn.classList.add('selected');
        if (btn.id === 'tower-normal') selectedTowerType = 'normal';
        if (btn.id === 'tower-slow') selectedTowerType = 'slow';
        if (btn.id === 'tower-power') selectedTowerType = 'power';
    };
}

function resetGame() {
    life = 10;
    money = 100;
    enemies = [];
    towers = [];
    bullets = [];
    wave = 1;
    enemyTimer = 0;
    frame = 0;
    gameState = 'playing';
    // グリッド初期化（0:空き, 1:タワー, 9:通行不可）
    grid = [];
    for (let y = 0; y < GRID_ROWS; y++) {
        let row = [];
        for (let x = 0; x < GRID_COLS; x++) {
            row.push(0);
        }
        grid.push(row);
    }
}

function spawnEnemy() {
    // スタートは左端中央
    const sy = Math.floor(GRID_ROWS / 2);
    enemies.push({ gx: 0, gy: sy, x: 0, y: sy * CELL_SIZE, hp: 3 + wave, speed: 1, alive: true, path: [], pathStep: 0, slow: 0 });
}

function canPlaceTower(gx, gy) {
    if (gx <= 0 || gx >= GRID_COLS - 1) return false; // 端には置けない
    if (grid[gy][gx] !== 0) return false;
    // 仮に置いてみて通路が残るかチェック
    grid[gy][gx] = 1;
    const path = findPath(0, Math.floor(GRID_ROWS / 2));
    grid[gy][gx] = 0;
    return path.length > 0;
}

function placeTower(gx, gy) {
    const tdef = TOWER_TYPES[selectedTowerType];
    if (money < tdef.cost) return;
    if (!canPlaceTower(gx, gy)) return;
    grid[gy][gx] = 1;
    towers.push({
        gx, gy,
        x: gx * CELL_SIZE + CELL_SIZE / 2,
        y: gy * CELL_SIZE + CELL_SIZE / 2,
        cooldown: 0,
        type: selectedTowerType
    });
    money -= tdef.cost;
    // すべての敵の経路再計算
    for (const enemy of enemies) {
        if (enemy.alive) {
            enemy.path = findPath(enemy.gx, enemy.gy);
            enemy.pathStep = 0;
        }
    }
}

canvas.addEventListener('click', e => {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const gx = Math.floor(mx / CELL_SIZE);
    const gy = Math.floor(my / CELL_SIZE);
    placeTower(gx, gy);
});

startBtn.onclick = () => {
    resetGame();
};

function findPath(sx, sy) {
    // ゴールは右端中央
    const gx = GRID_COLS - 1;
    const gy = Math.floor(GRID_ROWS / 2);
    // A*アルゴリズム
    let open = [{ x: sx, y: sy, cost: 0, est: Math.abs(gx - sx) + Math.abs(gy - sy), prev: null }];
    let closed = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
    while (open.length > 0) {
        open.sort((a, b) => (a.cost + a.est) - (b.cost + b.est));
        let cur = open.shift();
        if (cur.x === gx && cur.y === gy) {
            // 経路復元
            let path = [];
            let node = cur;
            while (node.prev) {
                path.push({ x: node.x, y: node.y });
                node = node.prev;
            }
            path.reverse();
            return path;
        }
        closed[cur.y][cur.x] = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            let nx = cur.x + dx, ny = cur.y + dy;
            if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
            if (grid[ny][nx] === 1) continue; // タワーは通れない
            if (closed[ny][nx]) continue;
            open.push({ x: nx, y: ny, cost: cur.cost + 1, est: Math.abs(gx - nx) + Math.abs(gy - ny), prev: cur });
        }
    }
    return [];
}

function update() {
    if (gameState !== 'playing') return;
    frame++;
    // 敵出現
    enemyTimer++;
    if (enemyTimer > enemyInterval && enemies.length < 5 + wave * 2) {
        spawnEnemy();
        enemyTimer = 0;
    }
    // 敵移動
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (!enemy.path || enemy.path.length === 0) {
            enemy.path = findPath(enemy.gx, enemy.gy);
            enemy.pathStep = 0;
        }
        if (enemy.path && enemy.pathStep < enemy.path.length) {
            let next = enemy.path[enemy.pathStep];
            let tx = next.x * CELL_SIZE;
            let ty = next.y * CELL_SIZE;
            let dx = tx - enemy.x;
            let dy = ty - enemy.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let spd = enemy.speed * (1 - (enemy.slow || 0));
            if (dist < 2) {
                enemy.gx = next.x;
                enemy.gy = next.y;
                enemy.x = tx;
                enemy.y = ty;
                enemy.pathStep++;
            } else {
                enemy.x += dx / dist * spd;
                enemy.y += dy / dist * spd;
            }
        } else {
            // ゴール到達
            if (enemy.gx === GRID_COLS - 1) {
                enemy.alive = false;
                life--;
                if (life <= 0) gameState = 'gameover';
            }
        }
    }
    // タワー攻撃
    for (const tower of towers) {
        const tdef = TOWER_TYPES[tower.type];
        tower.cooldown--;
        if (tower.cooldown <= 0) {
            // 射程内の敵を探す
            const target = enemies.find(e => e.alive && Math.abs(e.x - tower.x) < CELL_SIZE * tdef.range && Math.abs(e.y - tower.y) < CELL_SIZE * tdef.range);
            if (target) {
                bullets.push({ x: tower.x, y: tower.y, tx: target.x, ty: target.y, target, type: tower.type });
                tower.cooldown = tdef.cooldown;
            }
        }
    }
    // 弾移動
    for (const bullet of bullets) {
        const dx = bullet.tx - bullet.x;
        const dy = bullet.ty - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 8) {
            if (bullet.target && bullet.target.alive) {
                const tdef = TOWER_TYPES[bullet.type];
                bullet.target.hp -= tdef.power;
                if (tdef.slow) bullet.target.slow = tdef.slow;
                if (bullet.target.hp <= 0) {
                    bullet.target.alive = false;
                    money += 20;
                }
            }
            bullet.hit = true;
        } else {
            bullet.x += dx / dist * 8;
            bullet.y += dy / dist * 8;
        }
    }
    bullets = bullets.filter(b => !b.hit);
    // 敵リスト整理
    enemies = enemies.filter(e => e.alive);
    // クリア判定
    if (enemies.length === 0 && frame > 300) {
        gameState = 'clear';
    }
}

function draw() {
    ctx.clearRect(0, 0, GAME_W, GAME_H);
    // グリッド
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, GAME_H);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(GAME_W, y * CELL_SIZE);
        ctx.stroke();
    }
    // タワー
    for (const tower of towers) {
        const tdef = TOWER_TYPES[tower.type];
        ctx.fillStyle = tdef.color;
        ctx.fillRect(tower.gx * CELL_SIZE + 4, tower.gy * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(tower.gx * CELL_SIZE + 4, tower.gy * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    }
    // 敵
    for (const enemy of enemies) {
        ctx.fillStyle = '#e53935';
        ctx.fillRect(enemy.x + 4, enemy.y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(enemy.x + 4, enemy.y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText('HP:' + enemy.hp, enemy.x + 6, enemy.y + 16);
    }
    // 弾
    for (const bullet of bullets) {
        ctx.fillStyle = TOWER_TYPES[bullet.type].color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }
    // UI
    if (gameState === 'gameover') {
        ctx.fillStyle = '#fff';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillText('ゲームオーバー', GAME_W / 2 - 90, GAME_H / 2);
    } else if (gameState === 'clear') {
        ctx.fillStyle = '#ffd700';
        ctx.font = '18px "Press Start 2P", monospace';
        ctx.fillText('クリア！', GAME_W / 2 - 45, GAME_H / 2);
    }
}

function updateUI() {
    lifeSpan.textContent = 'ライフ: ' + life;
    moneySpan.textContent = 'お金: ' + money;
}

function loop() {
    update();
    draw();
    updateUI();
    requestAnimationFrame(loop);
}

loop(); 