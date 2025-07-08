const SIZE = 21; // 奇数で壁と道を交互に
const boardElem = document.getElementById('maze-board');
let maze = [];
let player = { x: 1, y: 1 };
let goal = { x: SIZE - 2, y: SIZE - 2 };

function initMaze() {
    // 全部壁で初期化
    maze = Array.from({ length: SIZE }, () => Array(SIZE).fill(1));
    // 再帰的バックトラッキング法で迷路生成
    function carve(x, y) {
        maze[y][x] = 0;
        const dirs = [
            [2, 0], [-2, 0], [0, 2], [0, -2]
        ].sort(() => Math.random() - 0.5);
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx > 0 && nx < SIZE - 1 && ny > 0 && ny < SIZE - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
    }
    carve(1, 1);
    // スタート・ゴール確保
    maze[1][1] = 0;
    maze[goal.y][goal.x] = 0;
}

function renderMaze() {
    boardElem.innerHTML = '';
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (maze[y][x] === 1) cell.classList.add('wall');
            if (x === player.x && y === player.y) cell.classList.add('player');
            if (x === goal.x && y === goal.y) cell.classList.add('goal');
            boardElem.appendChild(cell);
        }
    }
}

function movePlayer(dx, dy) {
    const nx = player.x + dx, ny = player.y + dy;
    if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && maze[ny][nx] === 0) {
        player.x = nx;
        player.y = ny;
        renderMaze();
        if (player.x === goal.x && player.y === goal.y) {
            setTimeout(() => alert('ゴール！クリア！'), 100);
        }
    }
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') movePlayer(0, -1);
    if (e.key === 'ArrowDown') movePlayer(0, 1);
    if (e.key === 'ArrowLeft') movePlayer(-1, 0);
    if (e.key === 'ArrowRight') movePlayer(1, 0);
});

initMaze();
renderMaze(); 