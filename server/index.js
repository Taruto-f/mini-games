// サーバー起動用ファイル
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const PORT = process.env.PORT || 3000;

// ルームごとにゲーム状態を管理
const rooms = {};

// ゲーム種別
const GAME_TYPE = {
    TIC_TAC_TOE: 'tic-tac-toe',
    OTHELLO: 'othello',
};

io.on('connection', (socket) => {
    // ルーム参加
    socket.on('joinRoom', ({ roomId, gameType }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: [],
                gameType,
                state: null, // 盤面やターン情報
            };
        }
        if (rooms[roomId].players.length >= 2) {
            socket.emit('roomFull');
            return;
        }
        rooms[roomId].players.push(socket.id);
        socket.join(roomId);
        socket.emit('joinedRoom', { roomId, playerIndex: rooms[roomId].players.length - 1 });
        io.to(roomId).emit('playerCount', rooms[roomId].players.length);

        // 2人揃ったらゲーム開始
        if (rooms[roomId].players.length === 2) {
            io.to(roomId).emit('startGame');
        }
    });

    // ゲーム状態の同期
    socket.on('syncState', ({ roomId, state }) => {
        if (rooms[roomId]) {
            rooms[roomId].state = state;
            socket.to(roomId).emit('updateState', state);
        }
    });

    // 切断時の処理
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const idx = rooms[roomId].players.indexOf(socket.id);
            if (idx !== -1) {
                rooms[roomId].players.splice(idx, 1);
                io.to(roomId).emit('playerCount', rooms[roomId].players.length);
                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId];
                }
                break;
            }
        }
    });

    // ルーム退出
    socket.on('leaveRoom', ({ roomId }) => {
        socket.leave(roomId);
        if (rooms[roomId]) {
            const idx = rooms[roomId].players.indexOf(socket.id);
            if (idx !== -1) {
                rooms[roomId].players.splice(idx, 1);
                io.to(roomId).emit('playerCount', rooms[roomId].players.length);
                if (rooms[roomId].players.length === 0) {
                    delete rooms[roomId];
                }
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
}); 