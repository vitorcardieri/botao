const http = require('http');
const { Server } = require('socket.io');

// Cria um servidor básico (necessário para a nuvem aceitar a conexão)
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Servidor de Matchmaking do Futebol de Botao OK!");
});

// Configura o Socket.io permitindo acesso do seu site na Hostinger
const io = new Server(server, {
    cors: {
        origin: "*", // Permite que qualquer domínio conecte
        methods: ["GET", "POST"]
    }
});

let filaDeEspera = [];

io.on('connection', (socket) => {
    console.log('Novo jogador no Lobby:', socket.id);

    socket.on('buscarOponente', () => {
        if (filaDeEspera.includes(socket)) return; // Evita duplicidade

        console.log('Entrou na fila:', socket.id);
        filaDeEspera.push(socket);

        // Se tem 2 na fila, formamos a partida!
        if (filaDeEspera.length >= 2) {
            const player1 = filaDeEspera.shift();
            const player2 = filaDeEspera.shift();

            const roomId = 'arena-' + Math.random().toString(36).substring(2, 9);

            player1.emit('partidaEncontrada', { role: 'host', roomId: roomId });
            player2.emit('partidaEncontrada', { role: 'guest', roomId: roomId });

            console.log(`Arena criada: ${roomId}`);
        }
    });

    socket.on('disconnect', () => {
        filaDeEspera = filaDeEspera.filter(p => p.id !== socket.id);
        console.log('Jogador saiu:', socket.id);
    });
});

// O Render.com define a porta dinamicamente via process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Matchmaker rodando na porta ${PORT}`);
});