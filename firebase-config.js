const firebaseConfig = {
    apiKey: "AIzaSyCGNdmc4ELyrZqqeAi2RJpce_f6kUhRBqo",
    authDomain: "math-snake-game.firebaseapp.com",
    databaseURL: "https://math-snake-game-default-rtdb.firebaseio.com",
    projectId: "math-snake-game",
    storageBucket: "math-snake-game.firebasestorage.app",
    messagingSenderId: "606593013462",
    appId: "1:606593013462:web:f144bd683dba603fbd9b77"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Export database for use in other files
window.gameDatabase = database;
