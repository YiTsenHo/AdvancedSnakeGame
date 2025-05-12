class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [
            {x: 5, y: 5},
            {x: 4, y: 5},
            {x: 3, y: 5}
        ];
        this.direction = 'right';
        this.foods = [];  // Replace single food with array
        this.maxFoods = 5;  // Maximum number of foods on screen
        this.score = 3;  // Initial score matches initial snake length
        this.baseSpeed = 200;
        this.currentSpeed = this.baseSpeed;
        this.difficultyLevel = 1;
        this.specialItems = []; // For stars and portals
        this.winScore = 30;
        this.gameInterval = null;
        this.currentEquation = null;
        this.isGameOver = false;
        this.lastStarTime = 0;  // Add timer for star generation
        this.startTime = Date.now();
        this.playTime = 0;
        window.game = this; // 讓 leaderboard.js 可以存取遊戲實例

        this.bindEvents();
        this.generateNewEquation();
        this.generateFood();
        this.start();
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    }

    handleKeyPress(e) {
    const keyMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right'
    };

    const newDirection = keyMap[e.key];
    if (newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[this.direction] !== newDirection) {
            this.direction = newDirection;
        }
        return; // 避免繼續往下判斷 R 鍵
    }

    // 👉 加這段：按下 R 鍵可以重新開始遊戲
    if (e.key === 'r' || e.key === 'R') {
        this.restart();
    }
}

    generateSpecialItems() {
        const currentTime = Date.now();
        
        // Generate star (20% chance every 5 seconds)
        if (currentTime - this.lastStarTime >= 5000) {  // 5 seconds
            this.lastStarTime = currentTime;
            if (Math.random() < 0.2 && !this.specialItems.some(item => item.type === 'star')) {
                const pos = this.getRandomPosition();
                this.specialItems.push({ ...pos, type: 'star' });
            }
        }
        
        // Generate portal (15% chance)
        if (Math.random() < 0.15 && !this.specialItems.some(item => item.type === 'portal')) {
            const pos = this.getRandomPosition();
            this.specialItems.push({ ...pos, type: 'portal' });
        }
    }

    getRandomPosition() {
        let x, y, validPosition;
        do {
            validPosition = true;
            x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
            y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
            
            // Check collisions with snake, foods, and other special items
            if (this.snake.some(segment => segment.x === x && segment.y === y) ||
                this.foods.some(food => food.x === x && food.y === y) ||
                this.specialItems.some(item => item.x === x && item.y === y)) {
                validPosition = false;
            }
        } while (!validPosition);
        return { x, y };
    }

    generateNewEquation() {
        const operations = ['+', '-', '*', '/'];
        let num1, num2, result, operation;
        
        // Ensure single-digit numbers
        do {
            num1 = Math.floor(Math.random() * 9) + 1;  // 1-9
            num2 = Math.floor(Math.random() * 9) + 1;  // 1-9
            operation = operations[Math.floor(Math.random() * 2)];  // Start with only + and -
            
            switch(operation) {
                case '+': 
                    result = num1 + num2;
                    break;
                case '-': 
                    // Ensure positive result
                    if (num1 < num2) [num1, num2] = [num2, num1];
                    result = num1 - num2;
                    break;
                case '*':
                    // Only use small numbers for multiplication
                    num2 = Math.floor(Math.random() * 5) + 1;  // 1-5
                    result = num1 * num2;
                    break;
                case '/':
                    // Ensure clean division
                    num2 = Math.floor(Math.random() * 5) + 1;  // 1-5
                    result = num1;
                    num1 = num2 * result;
                    break;
            }
        } while (result > 9 || result < 0);

        this.currentEquation = {
            num1, num2, operation, result,
            missingPosition: 1,  // Always make the second number missing initially
            missingValue: num2
        };

        // Update equation display
        document.getElementById('equation').textContent = 
            `${num1} ${operation} __ = ${result}`;
    }
    
    generateFood() {
        // Clear existing foods if no correct answer is present
        if (!this.foods.some(food => food.value === this.currentEquation.missingValue)) {
            this.foods = [];
        }

        // Always ensure one food has the correct answer
        if (this.foods.length === 0) {
            const pos = this.getRandomPosition();
            this.foods.push({
                x: pos.x,
                y: pos.y,
                value: this.currentEquation.missingValue
            });
        }

        // Generate additional foods up to maxFoods
        while (this.foods.length < this.maxFoods) {
            const value = Math.floor(Math.random() * 10); // 0-9 only
            let x, y;
            let validPosition = false;
            
            while (!validPosition) {
                validPosition = true;
                x = Math.floor(Math.random() * (this.canvas.width / this.gridSize));
                y = Math.floor(Math.random() * (this.canvas.height / this.gridSize));
                
                // Check position conflicts
                if (this.snake.some(segment => segment.x === x && segment.y === y) ||
                    this.foods.some(food => food.x === x && food.y === y) ||
                    this.specialItems.some(item => item.x === x && item.y === y)) {
                    validPosition = false;
                    continue;
                }
            }
            
            this.foods.push({ x, y, value });
        }
    }

    updateScore() {
        this.score = this.snake.length;
        document.getElementById('score').textContent = `Score: ${this.score}/${this.winScore}`;
    }

    update() {
        const head = { ...this.snake[0] };
        const width = this.canvas.width / this.gridSize;
        const height = this.canvas.height / this.gridSize;

        switch(this.direction) {
            case 'up': 
                head.y = (head.y - 1 + height) % height;
                break;
            case 'down': 
                head.y = (head.y + 1) % height;
                break;
            case 'left': 
                head.x = (head.x - 1 + width) % width;
                break;
            case 'right': 
                head.x = (head.x + 1) % width;
                break;
        }

        // Check collision with self only
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check food collisions
        let foodEaten = false;
        for (let i = this.foods.length - 1; i >= 0; i--) {
            if (head.x === this.foods[i].x && head.y === this.foods[i].y) {
                if (this.foods[i].value === this.currentEquation.missingValue) {
                    // Correct answer: increase length by 1
                    foodEaten = true;
                    this.snake.push({...this.snake[this.snake.length-1]});
                    this.updateScore(); // Score will match snake length
                    this.generateNewEquation();
                } else {
                    // Wrong answer: remove one segment if possible
                    if (this.snake.length > 1) {
                        this.snake.pop();
                        this.updateScore(); // Score will match snake length
                    }
                }
                this.foods.splice(i, 1);
                break;
            }
        }

        // Generate new food if needed
        if (!foodEaten) {
            this.snake.pop();
        }
        this.generateFood();

        // Check special items collisions
        this.specialItems = this.specialItems.filter(item => {
            if (head.x === item.x && head.y === item.y) {
                if (item.type === 'star') {
                    // Add 1 segment for star
                    this.snake.push({...this.snake[this.snake.length-1]});
                    this.updateScore(); // Score will match snake length
                    return false;
                } else if (item.type === 'portal') {
                    this.generateNewEquation();
                    return false;
                }
            }
            return true;
        });

        // Update difficulty and speed based on score
        this.difficultyLevel = Math.floor(this.score / 10) + 1;
        this.currentSpeed = Math.max(50, this.baseSpeed - (this.score * 5));

        // Check win condition
        if (this.score >= this.winScore) {
            this.win();
            return;
        }

        // Generate special items
        this.generateSpecialItems();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#2e7d32' : '#4caf50';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // Draw foods
        this.foods.forEach(food => {
            this.ctx.fillStyle = '#f44336';
            this.ctx.fillRect(
                food.x * this.gridSize,
                food.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );

            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                food.value,
                (food.x * this.gridSize) + (this.gridSize / 2),
                (food.y * this.gridSize) + (this.gridSize / 2)
            );
        });

        // Draw special items
        this.specialItems.forEach(item => {
            this.ctx.fillStyle = item.type === 'star' ? '#FFD700' : '#8A2BE2';
            this.ctx.beginPath();
            if (item.type === 'star') {
                this.drawStar(item.x * this.gridSize + this.gridSize/2, 
                            item.y * this.gridSize + this.gridSize/2);
            } else {
                this.ctx.arc(item.x * this.gridSize + this.gridSize/2,
                            item.y * this.gridSize + this.gridSize/2,
                            this.gridSize/2, 0, Math.PI * 2);
            }
            this.ctx.fill();
        });
    }

    drawStar(cx, cy) {
        const spikes = 5;
        const outerRadius = this.gridSize/2;
        const innerRadius = outerRadius/2;
        
        this.ctx.beginPath();
        for(let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if(i === 0) this.ctx.moveTo(x, y);
            else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
    }

    gameOver() {
        clearInterval(this.gameInterval);
        this.isGameOver = true;
        this.playTime = (Date.now() - this.startTime) / 1000; // 計算遊戲時間（秒）
        
        const gameOverElement = document.getElementById('gameOver');
        const finalScoreElement = gameOverElement.querySelector('.final-score');
        finalScoreElement.textContent = `Final Score: ${this.score}`;
        gameOverElement.classList.remove('hidden');
    }

    win() {
        clearInterval(this.gameInterval);
        this.isGameOver = true;
        const gameOver = document.getElementById('gameOver');
        gameOver.querySelector('h2').textContent = 'You Win!';
        gameOver.classList.remove('hidden');
    }

    restart() {
        this.snake = [
            {x: 5, y: 5},
            {x: 4, y: 5},
            {x: 3, y: 5}
        ];
        this.direction = 'right';
        this.isGameOver = false;
        this.foods = [];  // Clear all foods
        document.getElementById('gameOver').classList.add('hidden');
        this.generateNewEquation();
        this.generateFood();
        this.score = 3;  // Reset score to initial snake length
        this.updateScore();
        this.lastStarTime = 0;  // Reset star timer
        this.currentSpeed = this.baseSpeed; // Reset speed to base speed
        this.startTime = Date.now(); // 重置開始時間
        this.playTime = 0;
        document.getElementById('playerName').value = ''; // 清空玩家名稱輸入
        this.start();
    }

    start() {
        if (this.gameInterval) {
            clearInterval(this.gameInterval);
        }
        this.gameInterval = setInterval(() => {
            this.update();
            this.draw();
        }, this.currentSpeed);
    }
}

// Start the game when the page loads
window.onload = () => new SnakeGame();
