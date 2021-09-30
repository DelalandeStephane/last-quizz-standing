# last-quizz-standing
jeu multijoueur / quizz battle royal

## Prerequisites
- Install Node.js which includes Node Package Manager
## Setting up this project
Clone this project. Enter into the project directory with cd last-quizz-standing. Then type npm install to install all the dependencies, for the front and the back end.
## Database
 The project need a mongoDB database.
- Create a database named last-quizz-standing
- Create inside the new database a collection named question
- put inside the collection question the json file named quizz.json
## Config
- in back/server.js, insert in const url the link of your mongodb database ('mongodb://localhost:27017' or 'mongodb+srv://username:<password>@cluster0.hxno3.mongodb.net/yourdatabase?retryWrites=true&w=majority' )

 ## Server
  - Run node back/server.js for server
