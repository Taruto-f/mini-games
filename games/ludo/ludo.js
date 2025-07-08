const boardElem = document.getElementById('ludo-board');
const diceBtn = document.getElementById('roll-btn');
const diceResult = document.getElementById('dice-result');

// 7x7のボード
const BOARD_SIZE = 7;
// プレイヤー色
const COLORS = ['red', 'green', 'blue', 'yellow'];
// 各プレイヤーの初期位置（左上、右上、右下、左下）
const START_POS = [
    { x: 0, y: 0 }, // 赤
    { x: 6, y: 0 }, // 緑
    { x: 6, y: 6 }, // 青
    { x: 0, y: 6 }  // 黄
];

let pieces = [
    { color: 'red', x: 0, y: 0 },
    { color: 'green', x: 6, y: 0 },
    { color: 'blue', x: 6, y: 6 },
    { color: 'yellow', x: 0, y: 6 }
];

function drawBoard() {
    boardElem.innerHTML = '';
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            // コマがある場合
            const piece = pieces.find(p => p.x === x && p.y === y);
            if (piece) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece ' + piece.color;
                cell.appendChild(pieceDiv);
            }
            boardElem.appendChild(cell);
        }
    }
}

diceBtn.onclick = function () {
    const num = Math.floor(Math.random() * 6) + 1;
    diceResult.textContent = '出目: ' + num;
};

drawBoard(); 