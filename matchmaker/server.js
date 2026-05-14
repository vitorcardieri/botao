const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer((req, res) => {
    res.writeHead(200); res.end("Servidor de Matchmaking Arena 2.0 OK!");
});

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Agora temos filas separadas pelo valor da aposta!
let filas = { '5': [], '50': [], '500': [] };

io.on('connection', (socket) => {
    console.log('Novo jogador no Lobby:', socket.id);

    // Recebe o pedido de busca incluindo a aposta
    socket.on('buscarOponente', (aposta) => {
        const betString = aposta.toString();
        
        // Garante que a pessoa não está em outra fila
        Object.keys(filas).forEach(k => filas[k] = filas[k].filter(p => p.id !== socket.id));
        
        console.log(`Jogador ${socket.id} entrou na fila de ${betString} moedas.`);
        filas[betString].push(socket);

        // Se tem 2 na fila dessa mesma aposta, formamos a partida!
        if (filas[betString].length >= 2) {
            const player1 = filas[betString].shift();
            const player2 = filas[betString].shift();

            const roomId = 'arena-' + Math.random().toString(36).substring(2, 9);

            player1.emit('partidaEncontrada', { role: 'host', roomId: roomId });
            player2.emit('partidaEncontrada', { role: 'guest', roomId: roomId });

            console.log(`Arena de ${betString} criada: ${roomId}`);
        }
    });

    socket.on('disconnect', () => {
        Object.keys(filas).forEach(k => filas[k] = filas[k].filter(p => p.id !== socket.id));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Matchmaker rodando na porta ${PORT}`); });