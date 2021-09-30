const express = require('express');
const path = require('path');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const url = '';
const { v4: uuidv4 } = require('uuid');
console.log(__dirname);
let rooms = [];

function createRoom() {
    const room = {
        id: uuidv4(),
        players: [],
        responseNumber: 0,
        losers: [], // stock les perdants pour calculer le score
        open:true,
        quizzQuestion:'',//question en cour
        winner:''
    };
    rooms.push(room);
    return room;
}

app.use(express.static(path.join(__dirname,'../front/public')));

app.get('/',(req,res,next) => {
    res.sendFile(path.join(__dirname,'../front/index.html'));
});

app.get('/create-party',(req,res,next) => {
    res.sendFile(path.join(__dirname,'../front/create-party.html'));
});

// Rejoindre une partie
app.get('/join/:room',(req,res,next) => {
    const room = rooms.find(r => r.id === req.params.room);
    if(room){
        res.sendFile(path.join(__dirname,'../front/game-area.html'));
    } else {
        // pas de room correspondante
        res.status(400).sendFile(path.join(__dirname,'../front/join-error.html'));
    }
});

app.get('/*',(req,res,next) => {
        res.status(404).sendFile(path.join(__dirname,'../front/404.html'));
});

const httpServer = app.listen(process.env.PORT || 8080,() => console.log('Écoute sur le port 8080 '));

var socketIO = require('socket.io');

var socketIOWebSocketServer = socketIO(httpServer);


socketIOWebSocketServer.on('connection', function (socket) {
    //ferme une room après le début de partie
    socket.on('close-room',(roomId) => {
        const room = rooms.find(r => r.id === roomId);
        room.open = false;
    })
    // première question
    socket.on('requestQuestion',(roomId) => {
        const room = rooms.find(r => r.id === roomId);
        MongoClient.connect(url,{ useUnifiedTopology: true }, (err,client) => {
            if (err) {
                res.status(500);
                next();
            }
            const collection = client.db('last-quizz-standing').collection('question');
             collection.aggregate(
                [ { $sample: { size: 1 } } ]
             ).toArray((err, data) => {
                room.quizzQuestion = data[0];
                socketIOWebSocketServer.to(roomId).emit('sendQuestion', {question: data});
             })
        });
    })
    // Quand tout les joueurs ont joués renvoyer une question
    socket.on('playerAnswer', function (response) {
        const room = rooms.find(r => r.id === response.roomId);
        const player = room.players.find(p => p.socketId === response.socketId);

        if(response.response !== room.quizzQuestion.response){
            player.life --;
            socket.emit('answerReturn',false);
        } else {
            player.score++;
            socket.emit('answerReturn',true);
        } 

        // pour comparaison avec nombre de joueur sur la partie
        room.responseNumber++;
    
        if(room.responseNumber === room.players.length){

            const newTabPlayers = []; // renvoi un tableau sans les perdants
            for (let i = 0; i < room.players.length; i++) {  
                // Le joueur n'a plus de vie
                if(room.players[i].life === 0){
                     room.losers.push(room.players[i]);
                    socketIOWebSocketServer.to(room.players[i].socketId).emit('game-lose', room.players[i].socketId);
                }
                else {
                    newTabPlayers.push(room.players[i]);
                }
            }
            // on remplace l'ancien tableau par le tableau mis à jour
            room.players = newTabPlayers;

            // on renvoi une nouvelle question
            if(room.players.length > 1){
                MongoClient.connect(url,{ useUnifiedTopology: true }, (err,client) => {
                    if (err) {
                        res.status(500);
                        next();
                    }
                    const collection = client.db('last-quizz-standing').collection('question');
                    collection.aggregate(
                        [ { $sample: { size: 1 } } ]
                    ).toArray((err, data) => {
                        room.quizzQuestion = data[0];
                        socketIOWebSocketServer.to(response.roomId).emit('sendQuestion', {question: data});
                    })
                });
            }
            //fin de partie
            if (room.players.length <= 1 ){
                if(room.players.length === 1) {
                    room.winner = room.players[0];
                }
                // invertion du tableau pour mettre dans l'ordre 1er/dernier
                 room.losers.reverse();
                socketIOWebSocketServer.to(response.roomId).emit('end-game', {losers : room.losers, winner : room.winner});     
            }

            //Valeur de manche remise à 0
            room.responseNumber= 0;
            socketIOWebSocketServer.to(response.roomId).emit('updatePlayerData',{players : room.players, losers : room.losers});
        }
      });

      socket.on('createParty', function(){
            let room = null;
                room = createRoom();
                socket.emit('getRoom',{roomId : room.id});
        })

    socket.on('joinParty', (response) => {
        const room = rooms.find(r => r.id === response.roomId);
        if(room.open === true){
            const usernameCheck = room.players.find(p => p.username === response.newUserName);
            if(!usernameCheck) {
                const player = {
                    roomId: response.roomId,
                    username:response.newUserName,
                    socketId: response.socketId,
                    life : 3,
                    score:0
                };
                socket.join(response.roomId);
                room.players.push(player);
                socketIOWebSocketServer.to(response.roomId).emit('userList',room.players);
                if (room.players.length > 1) {
                    socketIOWebSocketServer.to(response.roomId).emit('can-start-game');
                }
            } else {
                socket.emit('usernameExist');
            }
        }
        else {
            socket.emit('party-already-play',room.id)
        }
    })

    socket.on('disconnect', function () {
        rooms.forEach(r => {
            const player = r.players.find(p => p.socketId === socket.id);
            if(player) {
                var playerIndex = r.players.indexOf(player);
                r.players.splice(playerIndex, 1);
                if(r.players.length === 0) {
                    var roomIndex = rooms.indexOf(r);
                    rooms.splice(roomIndex, 1);
                }
            }
        })
    });
});