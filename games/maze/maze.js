const ALL_STAGES = [
    { width: 15, height: 9 },
    { width: 19, height: 11 },
    { width: 23, height: 13 },
    { width: 17, height: 13 },
    { width: 25, height: 9 },
    { width: 21, height: 15 },
    { width: 27, height: 13 },
    { width: 23, height: 9 },
    { width: 17, height: 11 },
    { width: 29, height: 11 },
    { width: 21, height: 9 },
    { width: 25, height: 13 },
    { width: 19, height: 15 },
    { width: 27, height: 9 },
    { width: 23, height: 11 }
];

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const STAGES = shuffle([...ALL_STAGES]).slice(0, 10);
let currentStage = 0;
let WIDTH = STAGES[currentStage].width;
let HEIGHT = STAGES[currentStage].height;
const boardElem = document.getElementById('maze-board');
let maze = [];
let player = { x: 1, y: 1 };
let goal = { x: WIDTH - 2, y: HEIGHT - 2 };

function setStage(stageIdx) {
    currentStage = stageIdx;
    WIDTH = STAGES[currentStage].width;
    HEIGHT = STAGES[currentStage].height;
    player = { x: 1, y: 1 };
    goal = { x: WIDTH - 2, y: HEIGHT - 2 };
    boardElem.style.gridTemplateColumns = `repeat(${WIDTH}, 32px)`;
    boardElem.style.gridTemplateRows = `repeat(${HEIGHT}, 32px)`;
    initMaze();
    renderMaze();
}

function initMaze() {
    maze = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(1));
    function carve(x, y) {
        maze[y][x] = 0;
        let dirs = [
            [2, 0], [-2, 0], [0, 2], [0, -2]
        ];
        dirs = shuffle(shuffle(dirs));
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx > 0 && nx < WIDTH - 1 && ny > 0 && ny < HEIGHT - 1 && maze[ny][nx] === 1) {
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny);
            }
        }
        if (Math.random() < 0.25) {
            const rx = 2 * Math.floor(Math.random() * ((WIDTH - 1) / 2)) + 1;
            const ry = 2 * Math.floor(Math.random() * ((HEIGHT - 1) / 2)) + 1;
            if (maze[ry][rx] === 1) {
                maze[ry][rx] = 0;
            }
        }
    }
    carve(1, 1);
    maze[1][1] = 0;
    maze[goal.y][goal.x] = 0;
}

function renderMaze() {
    boardElem.innerHTML = '';
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
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
    if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT && maze[ny][nx] === 0) {
        player.x = nx;
        player.y = ny;
        renderMaze();
        if (player.x === goal.x && player.y === goal.y) {
            setTimeout(() => {
                if (currentStage < STAGES.length - 1) {
                    if (confirm(`ステージ${currentStage + 1}クリア！次のステージへ進みますか？`)) {
                        setStage(currentStage + 1);
                    }
                } else {
                    alert('全ステージクリア！おめでとう！');
                }
            }, 100);
        }
    }
}

document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') movePlayer(0, -1);
    if (e.key === 'ArrowDown') movePlayer(0, 1);
    if (e.key === 'ArrowLeft') movePlayer(-1, 0);
    if (e.key === 'ArrowRight') movePlayer(1, 0);
});

setStage(0); 