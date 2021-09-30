(function(window, io){ 
    window.addEventListener('DOMContentLoaded',function(){  
        var socket = io('http://localhost:8080/');

        const url = document.location.href;
        const urlSplit = url.split('/');
        const roomId =  urlSplit[urlSplit.length-1];
        gameDisplay.joinRoomLink.innerText = url;
        // ------------------------------------ CONNEXION -----------------------------------

        gameDisplay.newUserForm.addEventListener('submit',(e) => {
            e.preventDefault();
            const newUserName = gameDisplay.userConnexion();
            socket.emit('joinParty',{newUserName : newUserName, roomId : roomId,socketId : socket.id});
        })

        socket.on('usernameExist',() => {
            gameDisplay.userNameExist();
        })

        socket.on('userList',(response) => {
            gameDisplay.showUserList(response)
        })

        socket.on('party-already-play', (roomId) => {
            gameDisplay.waitingRoom.innerHTML=`<h2 class="end-message">Désolé la partie ${roomId} est déja en cours</h2>`;
        })

        // Si il y a plus de 2 joueurs le bouton est activé 
        socket.on('can-start-game',() => {
            gameDisplay.btnStartGame.removeAttribute('disabled');
        })

        // ------------------------------------ GAME -----------------

        
        gameDisplay.btnStartGame.addEventListener('click',() => {
            socket.emit('close-room', roomId);
            socket.emit('requestQuestion', roomId);
        })

        socket.on('sendQuestion', function (data) {
            gameParams.sendQuestion(data)
        });
        // envoie de la réponse du joueur
        gameDisplay.btnAnswerQuizz.forEach(btn => {
            btn.addEventListener('click', (e) => {
                gameDisplay.btnAnswerQuizz.forEach(btn => {
                    btn.setAttribute('disabled', true);
                })       
                gameParams.goodAnswer = e.target;
                socket.emit('playerAnswer', { response: e.target.textContent, roomId: roomId, socketId : socket.id });
            } )
            
        });
     
        // Change couleur du bouton selon la réponse
        socket.on('answerReturn',(response) => {
            gameParams.answerReturn(response);
        })

        socket.on('updatePlayerData',(response) => {
            gameParams.updatePlayerData(response)
        })

        socket.on('game-lose',() => {
            gameDisplay.quizzArea.innerHTML='<h5 class="end-message">Désolé mais vous avez perdu !</h5>';
        })

        socket.on('end-game',(response) => {
            gameParams.endGame(response);
        })
    });
})(window, io);