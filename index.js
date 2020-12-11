const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = 80;

app.use(express.static('src'));

var players = [];

io.on('connection',socket=>{

    socket.on('init',()=>players=[]);

    socket.on('username',u=>{
        players.push(u);
        io.emit('player',players,u);
    });

    socket.on('start',()=>io.emit('start'));
    socket.on('question',a=>io.emit('question',players,a));
    socket.on('doubt',u=>io.emit('doubt',u));
    socket.on('answered',()=>io.emit('answered'));
    socket.on('right',()=>io.emit('right'));
    socket.on('wrong',()=>io.emit('wrong'));

});

http.listen(port,()=>console.log('Started!'));