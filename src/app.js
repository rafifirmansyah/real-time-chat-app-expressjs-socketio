import express from 'express';


const app = express();
const port = 3000;
const server = require("http").createServer(app);
const chatSocket = require('socket.io')(server);


app.get('/', (req, res) => {
    res.sendFile(`${process.cwd()}/public/index.html`);
});

server.listen(port, () => {
    console.log(`[server]: Server is running at localhost:${port}`);
});

app.use(express.static(`${process.cwd()}/public`));

const escapeHtml = text =>
{
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const onlineUsers = [];

// Listen if socket connected to client
chatSocket.on('connection', socket => {
    socket.on('setup', req => {
        onlineUsers.push({
            socketId: req.socketId,
            uuid: req.uuid,
            profile: req.profile,
            name: req.name
        });

        // Emit online users to client
        chatSocket.emit('get-list-online-users', onlineUsers);
    });

    // Listen 'chat-message' from client
    socket.on('chat-message', req => {
        chatSocket.to(req.destinationSocketId).emit('chat-message', {
            sourceSocketId: req.sourceSocketId,
            destinationSocketId: req.destinationSocketId,
            message: req.message,
            time: req.time
        });
    });

    // Listen handling invite to chat
    socket.on('join-chat', (req) => {
        chatSocket.to(req.destinationSocketId).emit('join-chat', {
            type: req.type,
            sourceSocketId: req.sourceSocketId,
            destinationSocketId: req.destinationSocketId,
            nameOpponentUser: escapeHtml(getNameOpponentUser(req.sourceSocketId)),
            profileOpponentUser: getProfileOpponentUser(req.sourceSocketId),
            message: req.message
        });
    });

    // Listen to update socket id, if user restart tab
    socket.on('update-socket-id', req => {
        onlineUsers.push({
            socketId: req.socketId,
            uuid: req.uuid,
            profile: req.profile,
            name: req.name
        });

        // Emit online users to client
        chatSocket.emit('get-list-online-users', onlineUsers);
    });

    // Listen disconnect
    socket.on('disconnect', req => {
        // Remove online user
        removeOnlineUser(socket.id);

        // Emit online users to client
        chatSocket.emit('get-list-online-users', onlineUsers);
    });
});

function removeOnlineUser(socketId) {
    for (let index = 0; index < onlineUsers.length; index++) {
        if(onlineUsers[index].socketId == socketId) {
            onlineUsers.splice(index, 1);
        }
    }
}

function getNameOpponentUser(socketId) {
    for (let index = 0; index < onlineUsers.length; index++) {
        if(onlineUsers[index].socketId == socketId) {
            return onlineUsers[index].name;
        }
    }
}

function getProfileOpponentUser(socketId) {
    for (let index = 0; index < onlineUsers.length; index++) {
        if(onlineUsers[index].socketId == socketId) {
            return onlineUsers[index].profile;
        }
    }
}
