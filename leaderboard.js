class Leaderboard {
    constructor() {
        this.database = window.gameDatabase;
        this.leaderboardRef = this.database.ref('leaderboard');
        this.setupEventListeners();
        this.loadLeaderboard();
    }

    submitScore(playerName, score, playTime) {
        if (!playerName.trim()) {
            alert('Please enter your name!');
            return;
        }

        return this.leaderboardRef.push({
            playerName: playerName.trim(),
            score,
            playTime: Math.round(playTime),
            timestamp: Date.now()
        });
    }

    loadLeaderboard() {
        this.leaderboardRef
            .orderByChild('score')
            .limitToLast(10)
            .on('value', (snapshot) => {
                const leaderboardList = document.getElementById('leaderboardList');
                leaderboardList.innerHTML = '';
                
                const entries = [];
                snapshot.forEach(childSnapshot => {
                    entries.unshift(childSnapshot.val());
                });

                entries.forEach((entry, index) => {
                    const div = document.createElement('div');
                    div.className = 'leaderboard-entry';
                    div.innerHTML = `
                        ${index + 1}. ${entry.playerName} - ${entry.score} points 
                        (${entry.playTime}s)
                    `;
                    leaderboardList.appendChild(div);
                });
            });
    }

    setupEventListeners() {
        const submitButton = document.getElementById('submitScore');
        submitButton.addEventListener('click', () => {
            const playerName = document.getElementById('playerName').value;
            if (window.game && window.game.score) {
                this.submitScore(
                    playerName,
                    window.game.score,
                    window.game.playTime
                ).then(() => {
                    document.getElementById('playerName').value = '';
                    document.getElementById('restartBtn').click();
                });
            }
        });
    }
}

// Initialize leaderboard
window.addEventListener('load', () => new Leaderboard());
