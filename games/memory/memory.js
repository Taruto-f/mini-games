const board = document.getElementById('memory-board');
const symbols = ['🍎', '🍌', '🍇', '🍒', '🍋', '🍉', '🍑', '🥝'];
let cards = [];
let flipped = [];
let lock = false;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createBoard() {
    const pairSymbols = shuffle([...symbols, ...symbols]);
    board.innerHTML = '';
    cards = [];
    pairSymbols.forEach((symbol, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.symbol = symbol;
        card.dataset.index = idx;
        card.textContent = '';
        card.addEventListener('click', flipCard);
        board.appendChild(card);
        cards.push(card);
    });
}

function flipCard(e) {
    if (lock) return;
    const card = e.currentTarget;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
    card.classList.add('flipped');
    card.textContent = card.dataset.symbol;
    flipped.push(card);
    if (flipped.length === 2) {
        lock = true;
        setTimeout(checkMatch, 800);
    }
}

function checkMatch() {
    const [card1, card2] = flipped;
    if (card1.dataset.symbol === card2.dataset.symbol) {
        card1.classList.add('matched');
        card2.classList.add('matched');
    } else {
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        card1.textContent = '';
        card2.textContent = '';
    }
    flipped = [];
    lock = false;
}

createBoard(); 