const gameDisplay= {
    waitingRoom : document.getElementById('waiting-room'),
    waitingList : document.getElementById('waiting-list'),
    newUserForm : document.getElementById('new-user-form'),
    messageUsername : document.getElementById('message-username'),
    playerArea : document.getElementById('player-area'),
    loserArea : document.getElementById('loser-area'),
    wallOfShame : document.getElementById('wall-of-shame'),
    quizzArea : document.getElementById('quizz-area'),
    timeModal : document.getElementById('time-modal'),
    timeModalValue : document.getElementById('time-modal-value'),
    mastHead : document.getElementById('masthead'),
    scoreTabBox : document.getElementById('score-table-box'),
    scoreTab : document.getElementById('score-table'),
    endMessageStatus : document.getElementById('end-party-status'),
    quizzQuestion : document.getElementById('quizz-question'),
    quizzAnswer1 : document.getElementById('quizz-answer-1'),
    quizzAnswer2 : document.getElementById('quizz-answer-2'),
    quizzAnswer3 : document.getElementById('quizz-answer-3'),
    quizzAnswer4 : document.getElementById('quizz-answer-4'),
    btnAnswerQuizz : document.querySelectorAll('.btn-answer'),
    btnStartGame : document.getElementById('start-game'),
    gameArea : document.getElementById('game-area'),
    joinRoomLink : document.getElementById('join-room-link'),
     getScore(name, score,place){
        const tableRow = document.createElement('tr');
        tableRow.scope='row';
        this.scoreTab.appendChild(tableRow);  
        const tData1 = document.createElement('td');
        tData1.scope="col";
        tData1.innerText=place;
        tableRow.appendChild(tData1);
        const tData2 = document.createElement('td');
        tData2.scope="col";
        tData2.innerText=name;
        tableRow.appendChild(tData2);
        const tData3 = document.createElement('td');
        tData3.scope="col";
        tData3.innerText=score;
        tableRow.appendChild(tData3);
    },
    userConnexion () {
        this.messageUsername.style.display="none";
        const newUserName = this.newUserForm[0].value;
        this.newUserForm.style.display="none";
        return newUserName;
    },
    userNameExist() {
        this.messageUsername.style.display="block";
        this.messageUsername.textContent = "Ce pseudo est déja utilisé";
        this.newUserForm.style.display="block";
    },
    showUserList(response) {
        this.waitingList.innerHTML="";
        this.playerArea.innerHTML="";
        response.forEach(player => {
            const li = document.createElement('li');
            li.classList.add('list-group-item');
            li.textContent = player.username;
            this.waitingList.appendChild(li);
            const card = document.createElement('div');
            card.classList.add('card','card-player');
            card.id=player.socketId;
            card.innerHTML = `<h5>${player.username}</h5>`;
            this.playerArea.appendChild(card);
            
            const lifeBar = document.createElement('span');
                lifeBar.classList.add('life-bar');
            card.appendChild(lifeBar);
                for(let i=0 ; i < player.life; i++){
                    const life = document.createElement('img');
                    life.classList.add('life');
                    life.src="../assets/img/life.png";
                    lifeBar.appendChild(life);
                }
            });
    },

}

const gameParams = {
    answerTimeout :5,
    goodAnswer: '',

    questionCountdown() {
        const chrono = setInterval(() => {
            this.answerTimeout--;
            gameDisplay.timeModalValue.textContent = this.answerTimeout;
            if(this.answerTimeout < 1){
                gameDisplay.timeModal.style.display='none';
                this.answerTimeout=5;
                clearInterval(chrono);
            }
        },1000);
    },
    sendQuestion(data){
        gameDisplay.waitingRoom.style.display="none";
        gameDisplay.gameArea.style.display="block";
        gameDisplay.timeModalValue.textContent = gameParams.answerTimeout;
        gameDisplay.timeModal.style.display='flex';
        this.questionCountdown();
        setTimeout(() => {
            const quizz = data.question[0];
            gameDisplay.quizzQuestion.innerText = quizz.question;

            gameDisplay.quizzAnswer1.innerText=quizz.propositions[0];
            gameDisplay.quizzAnswer2.innerText=quizz.propositions[1];
            gameDisplay.quizzAnswer3.innerText=quizz.propositions[2];
            gameDisplay.quizzAnswer4.innerText=quizz.propositions[3];

            // reset du styles des boutons pour la prochaine question
            gameDisplay.btnAnswerQuizz.forEach(btn => {
                btn.classList.remove('good-answer','wrong-answer');
                btn.removeAttribute('disabled');
            });

       },5000);

    },
    answerReturn(response){
        if(response === true){
            gameParams.goodAnswer.classList.add('good-answer');
        }else {
            gameParams.goodAnswer.classList.add('wrong-answer');
        }
    },
    updatePlayerData(response){
           // player-area
           gameDisplay.playerArea.innerHTML="";
           response.players.forEach(player => {
           const card = document.createElement('div');
           card.classList.add('card','card-player');
           card.id=player.socketId;
           card.innerHTML = `<h5>${player.username}</h5>`;
           gameDisplay.playerArea.appendChild(card);
           const lifeBar = document.createElement('span');
               lifeBar.classList.add('life-bar');
           card.appendChild(lifeBar);
               for(let i=0 ; i < player.life; i++){
                   const life = document.createElement('img');
                   life.classList.add('life');
                   life.src="../assets/img/life.png";
                   lifeBar.appendChild(life);
               }
           });

           //loser-area
           if(response.losers.length > 0){
               gameDisplay.loserArea.style.display="block";
               gameDisplay.wallOfShame.innerHTML="";
               response.losers.forEach(player => {
                   // créer les card de joeurs sur le plateau de jeu
                   const card = document.createElement('div');
                   card.classList.add('card','card-player');
                   card.id=player.socketId;
                   card.innerHTML = `<h5>${player.username}</h5>
                                       <p>R.I.P</p>`;
                   gameDisplay.wallOfShame.appendChild(card);
           
                   });
           }
    },
    endGame(response){
        gameDisplay.mastHead.style.display='none';
        gameDisplay.scoreTabBox.style.display="block";
        let place = 1;
        // intégrer tableaux des perdants
        if(response.winner !== ''){
            gameDisplay.endMessageStatus.innerText=`${response.winner.username} a remporté(e) la partie`;
            gameDisplay.getScore(response.winner.username, response.winner.score,place);
            place++;
        } else {
            gameDisplay.endMessageStatus.innerText=`La partie c'est terminée par une égalité.... Tout le monde est mort !`;        
        }
        // other players score
        response.losers.forEach(loser => {
            gameDisplay.getScore(loser.username, loser.score,place);
            place++;
        })
    }
};