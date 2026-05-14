const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer((req, res) => {
    res.writeHead(200); res.end("Servidor de Matchmaking Arena 3.0 OK!");
});

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// Agora inicializamos a fila "0" também
let filas = { '0': [], '5': [], '50': [], '500': [] };

io.on('connection', (socket) => {
    console.log('Novo jogador no Lobby:', socket.id);

    socket.on('buscarOponente', (aposta) => {
        const betString = aposta.toString();
        
        // Remove de todas as filas se o cara já estava procurando
        Object.keys(filas).forEach(k => filas[k] = filas[k].filter(p => p.id !== socket.id));
        
        console.log(`Jogador ${socket.id} buscou partida de ${betString}.`);
        
        let oponente = null;

        // SE BUSCOU 0 OU 5: Tenta achar na fila de 5. Se não achar, tenta na fila de 0.
        if (betString === '0' || betString === '5') {
            if (filas['5'].length > 0) {
                oponente = filas['5'].shift();
            } else if (filas['0'].length > 0) {
                oponente = filas['0'].shift();
            }
        } 
        // SE BUSCOU 50 OU 500: Fica restrito à própria fila
        else {
            if (filas[betString].length > 0) {
                oponente = filas[betString].shift();
            }
        }

        // SE ACHOU ALGUÉM, CRIA A SALA MISTA/NORMAL
        if (oponente) {
            const roomId = 'arena-' + Math.random().toString(36).substring(2, 9);
            oponente.emit('partidaEncontrada', { role: 'host', roomId: roomId });
            socket.emit('partidaEncontrada', { role: 'guest', roomId: roomId });
            console.log(`Arena criada: ${roomId}`);
        } else {
            // SE NÃO ACHOU NINGUÉM, ENTRA NA FILA DELE
            filas[betString].push(socket);
        }
    });

    socket.on('disconnect', () => {
        Object.keys(filas).forEach(k => filas[k] = filas[k].filter(p => p.id !== socket.id));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Matchmaker rodando na porta ${PORT}`); });