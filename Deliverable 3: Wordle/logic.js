/*
 * Eco-Wordle Battle Game with Advanced AI Algorithms
 * Features:
 * - Sustainability-themed word list
 * - Player vs AI gameplay
 * - AI powered by Minimax with Alpha-Beta Pruning
 * - Different difficulty levels adjusting search depth and heuristics
 * - Interactive UI with feedback
 */

// List of 5-letter sustainability and eco-themed words for the game
const wordList = [
    "EARTH", "GREEN", "PLANT", "SOLAR", "WATER", "OCEAN", "CLEAN", "REUSE", 
    "WASTE", "PAPER", "TREES", "FLORA", "FAUNA", "BIOME", "SEEDS", "FRUIT",
    "JUICE", "GRAIN", "BEANS", "GRASS", "WOODS", "LEAFY", "FRESH", "RIVER",
    "LAKES", "PARKS", "BEACH", "CORAL", "WHALE", "SHARK", "EAGLE", "HAWKS",
    "CARBON", "CLIMATE", "CYCLE", "COMPOST", "FARMS", "FUNGI", "INSECT", "BIRDS",
    "RECYCLE", "RENEW", "REUSE", "POWER", "ENERGY", "OZONE", "LIGHT", "COAST", 
    "CRUDE", "SMOGY", "SMOKE", "STEAM", "CLOTH", "COTTON", "JUTE", "DENIM", 
    "PANEL", "POLAR", "TERRA", "URBAN", "RURAL", "LOCAL", "GLOBE", "WORLD"
];

// Filter to only include 5-letter words
const fiveLetterWords = wordList.filter(word => word.length === 5);

// Initialize game state
let playerWord = "";
let aiWord = "";
let playerAttempts = 0;
let aiAttempts = 0;
let maxAttempts = 6;
let playerGuesses = [];
let aiGuesses = [];
let gameState = {
    playerSolved: false,
    aiSolved: false,
    gameOver: false
};

// AI difficulty setting
let aiDifficulty = 'medium'; // Default difficulty: 'easy', 'medium', 'hard', 'expert'

// AI knowledge base for tracking what it knows about the target word
let aiKnowledge = {
    mustContain: [],
    positionalInfo: [[], [], [], [], []],
    notInWord: []
};

// Word pool for AI to select from
let aiWordPool = [...fiveLetterWords];

// DOM elements
const playerGrid = document.getElementById('player-grid');
const aiGrid = document.getElementById('ai-grid');
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-guess');
const playerStatus = document.getElementById('player-status');
const aiStatus = document.getElementById('ai-status');
const aiThinking = document.getElementById('ai-thinking');
const resultArea = document.getElementById('result-area');
const newGameButton = document.getElementById('new-game');
const keyboard = document.getElementById('player-keyboard');
const wordBank = document.getElementById('word-bank');

// Add difficulty selector to the HTML
function addDifficultySelector() {
    const difficultyContainer = document.createElement('div');
    difficultyContainer.className = 'difficulty-container';
    difficultyContainer.innerHTML = `
        <label for="difficulty-select">AI Difficulty: </label>
        <select id="difficulty-select">
            <option value="easy">Easy (Greedy Search)</option>
            <option value="medium" selected>Medium (Minimax)</option>
            <option value="hard">Hard (Minimax + Alpha-Beta)</option>
            <option value="expert">Expert (Deep Minimax + Alpha-Beta)</option>
        </select>
    `;
    
    // Insert before the game container
    const gameContainer = document.querySelector('.game-container');
    document.body.insertBefore(difficultyContainer, gameContainer);
    
    // Add event listener
    const difficultySelect = document.getElementById('difficulty-select');
    difficultySelect.addEventListener('change', function() {
        aiDifficulty = this.value;
        // Restart game if changing difficulty mid-game
        if (!gameState.gameOver && (playerAttempts > 0 || aiAttempts > 0)) {
            if (confirm('Changing difficulty will restart the game. Continue?')) {
                initGame();
            } else {
                // Reset selection to current difficulty
                this.value = aiDifficulty;
            }
        }
    });
}

// Add CSS for difficulty selector
function addDifficultyStyles() {
    const difficultyStyles = `
        .difficulty-container {
            background-color: white;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        #difficulty-select {
            padding: 8px;
            border: 2px solid #a7cca5;
            border-radius: 4px;
            background-color: white;
            color: #2c5834;
            font-weight: bold;
            cursor: pointer;
            margin-left: 10px;
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = difficultyStyles;
    document.head.appendChild(styleElement);
}

// Initialize the word bank with clickable eco-words
function initWordBank() {
    wordBank.innerHTML = '';
    
    fiveLetterWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.classList.add('eco-word');
        wordElement.textContent = word;
        wordElement.addEventListener('click', () => {
            guessInput.value = word;
            guessInput.focus();
        });
        wordBank.appendChild(wordElement);
    });
}

// Initialize the game
function initGame() {
    // Reset game state but preserve difficulty setting
    playerWord = selectRandomWord();
    aiWord = selectRandomWord();
    while (aiWord === playerWord) {
        aiWord = selectRandomWord();
    }
    
    playerAttempts = 0;
    aiAttempts = 0;
    playerGuesses = [];
    aiGuesses = [];
    gameState = {
        playerSolved: false,
        aiSolved: false,
        gameOver: false
    };
    aiWordPool = [...fiveLetterWords];
    aiKnowledge = {
        mustContain: [],
        positionalInfo: [[], [], [], [], []],
        notInWord: []
    };

    // Clear UI
    playerGrid.innerHTML = '';
    aiGrid.innerHTML = '';
    playerStatus.textContent = '';
    aiStatus.textContent = '';
    aiThinking.textContent = '';
    resultArea.innerHTML = '';
    newGameButton.style.display = 'none';
    
    // Reset keyboard
    resetKeyboard();

    // Create empty grids
    createEmptyGrid(playerGrid);
    createEmptyGrid(aiGrid);

    // Enable input
    guessInput.disabled = false;
    submitButton.disabled = false;
    guessInput.value = '';
    guessInput.focus();
    
    console.log("Player's word:", playerWord);
    console.log("AI's word:", aiWord);
    console.log("AI difficulty:", aiDifficulty);
}

// Reset keyboard colors
function resetKeyboard() {
    const keys = keyboard.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}

// Select a random word from the list
function selectRandomWord() {
    return fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)];
}

// Create empty grid for guesses
function createEmptyGrid(gridElement) {
    for (let i = 0; i < maxAttempts; i++) {
        const row = document.createElement('div');
        row.classList.add('guess-row');
        
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement('div');
            cell.classList.add('guess-cell');
            row.appendChild(cell);
        }
        
        gridElement.appendChild(row);
    }
}

// Check a guess against a target word and return colored results
function checkGuess(guess, targetWord) {
    const result = Array(5).fill('absent');
    const targetLetters = targetWord.split('');
    
    // First check for correct positions
    for (let i = 0; i < 5; i++) {
        if (guess[i] === targetLetters[i]) {
            result[i] = 'correct';
            targetLetters[i] = null;
        }
    }
    
    // Then check for present letters
    for (let i = 0; i < 5; i++) {
        if (result[i] === 'absent') {
            const letterIndex = targetLetters.indexOf(guess[i]);
            if (letterIndex !== -1) {
                result[i] = 'present';
                targetLetters[letterIndex] = null;
            }
        }
    }
    
    return result;
}

// Display a guess on the grid
function displayGuess(gridElement, guess, result, attempt) {
    const rows = gridElement.querySelectorAll('.guess-row');
    const row = rows[attempt];
    const cells = row.querySelectorAll('.guess-cell');
    
    for (let i = 0; i < 5; i++) {
        cells[i].textContent = guess[i];
        cells[i].classList.add(result[i]);
    }
}

// AI makes a guess based on previous feedback using Minimax algorithm
function aiMakeGuess() {
    if (gameState.aiSolved || aiAttempts >= maxAttempts) return null;
    
    aiThinking.textContent = "AI is analyzing eco-friendly possibilities...";
    
    // AI selects a word using algorithm based on difficulty
    setTimeout(() => {
        // Filter word pool based on knowledge
        filterWordPool();
        
        // Choose a word using the configured AI algorithm
        let guess = selectAIWord();
        
        // If pool is empty (unlikely with our word list), just pick a random word
        if (!guess) {
            guess = fiveLetterWords[Math.floor(Math.random() * fiveLetterWords.length)];
        }
        
        aiGuesses.push(guess);
        aiAttempts++;
        
        // Check the guess
        const result = checkGuess(guess, aiWord);
        displayGuess(aiGrid, guess, result, aiAttempts - 1);
        
        // Update AI knowledge based on feedback
        updateAiKnowledge(guess, result);
        
        // Check if AI solved the word
        if (guess === aiWord) {
            gameState.aiSolved = true;
            aiStatus.textContent = `AI solved it in ${aiAttempts} ${aiAttempts === 1 ? 'attempt' : 'attempts'}!`;
            checkGameOver();
        } else if (aiAttempts >= maxAttempts) {
            aiStatus.textContent = 'AI failed to solve the eco-word!';
            checkGameOver();
        }
        
        aiThinking.textContent = "";
        
        // Enable player input after AI's turn
        if (!gameState.gameOver) {
            guessInput.disabled = false;
            submitButton.disabled = false;
            guessInput.focus();
        }
    }, getAIThinkingTime());
}

// Get AI thinking time based on difficulty
function getAIThinkingTime() {
    switch(aiDifficulty) {
        case 'easy':
            return 800; // Fast, simple calculations
        case 'medium':
            return 1200; // Regular minimax
        case 'hard':
            return 1800; // More complex alpha-beta
        case 'expert':
            return 2500; // Deep search, feels like "thinking" more
        default:
            return 1500;
    }
}

// Select a word using appropriate algorithm based on difficulty
function selectAIWord() {
    if (aiWordPool.length === 0) return null;
    
    // Small pool, just pick randomly
    if (aiWordPool.length <= 2) {
        return aiWordPool[Math.floor(Math.random() * aiWordPool.length)];
    }
    
    switch(aiDifficulty) {
        case 'easy':
            return greedySearch();
        case 'medium':
            return minimaxSearch(false, 1); // Minimax without alpha-beta, depth 1
        case 'hard':
            return minimaxSearch(true, 2); // Minimax with alpha-beta, depth 2
        case 'expert':
            return minimaxSearch(true, 3); // Deeper minimax with alpha-beta
        default:
            return minimaxSearch(false, 1);
    }
}

// Easy AI - Greedy search algorithm
function greedySearch() {
    // Create letter frequency map from remaining possible words
    const letterFrequency = {};
    for (const word of aiWordPool) {
        const uniqueLetters = [...new Set(word.split(''))];
        for (const letter of uniqueLetters) {
            letterFrequency[letter] = (letterFrequency[letter] || 0) + 1;
        }
    }
    
    // Score each word based on unique letter frequency
    let bestWords = [];
    let bestScore = -1;
    
    for (const word of aiWordPool) {
        const uniqueLetters = [...new Set(word.split(''))];
        let score = 0;
        
        // Sum the frequency of each unique letter
        for (const letter of uniqueLetters) {
            score += letterFrequency[letter];
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestWords = [word];
        } else if (score === bestScore) {
            bestWords.push(word);
        }
    }
    
    // Pick randomly from the best scoring words
    return bestWords[Math.floor(Math.random() * bestWords.length)];
}

// Minimax search algorithm with optional alpha-beta pruning
function minimaxSearch(useAlphaBeta = false, maxDepth = 2) {
    // If this is the first guess and we're on expert, use a strategic first word
    if (aiAttempts === 0 && aiDifficulty === 'expert') {
        const strategicFirstWords = ['EARTH', 'SOLAR', 'WATER', 'CLEAN'];
        return strategicFirstWords[Math.floor(Math.random() * strategicFirstWords.length)];
    }
    
    // For smaller pools, just pick randomly from the valid options
    if (aiWordPool.length <= maxDepth) {
        return aiWordPool[Math.floor(Math.random() * aiWordPool.length)];
    }
    
    let bestWord = null;
    let bestValue = -Infinity;
    
    // Consider all words as possible guesses
    const possibleGuesses = aiWordPool.slice(0, Math.min(aiWordPool.length, 10)); // Limit for performance
    
    for (const guessWord of possibleGuesses) {
        let value;
        if (useAlphaBeta) {
            value = minimaxValue(guessWord, 1, maxDepth, -Infinity, Infinity, false);
        } else {
            value = minimaxValue(guessWord, 1, maxDepth, null, null, false);
        }
        
        if (value > bestValue) {
            bestValue = value;
            bestWord = guessWord;
        }
    }
    
    return bestWord || aiWordPool[Math.floor(Math.random() * aiWordPool.length)];
}

// Recursive minimax function
function minimaxValue(guessWord, depth, maxDepth, alpha, beta, isMaximizing) {
    // Terminal condition
    if (depth >= maxDepth) {
        return evaluateGuess(guessWord);
    }
    
    // Get potential feedback patterns
    const potentialFeedbacks = simulateFeedbackPatterns(guessWord);
    
    if (isMaximizing) {
        let maxValue = -Infinity;
        for (const pattern in potentialFeedbacks) {
            // Simulate remaining words after this feedback
            const remainingWords = potentialFeedbacks[pattern];
            
            // If no words remain or all words remain, evaluate directly
            if (remainingWords.length === 0 || remainingWords.length === aiWordPool.length) {
                const value = evaluateGuess(guessWord);
                maxValue = Math.max(maxValue, value);
                
                // Alpha-beta pruning
                if (alpha !== null && beta !== null) {
                    alpha = Math.max(alpha, value);
                    if (beta <= alpha) break; // Beta cutoff
                }
                continue;
            }
            
            // Choose a representative word from remaining words
            const nextWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
            const value = minimaxValue(nextWord, depth + 1, maxDepth, alpha, beta, false);
            maxValue = Math.max(maxValue, value);
            
            // Alpha-beta pruning
            if (alpha !== null && beta !== null) {
                alpha = Math.max(alpha, value);
                if (beta <= alpha) break; // Beta cutoff
            }
        }
        return maxValue;
    } else {
        let minValue = Infinity;
        for (const pattern in potentialFeedbacks) {
            // Simulate remaining words after this feedback
            const remainingWords = potentialFeedbacks[pattern];
            
            // If no words remain or all words remain, evaluate directly
            if (remainingWords.length === 0 || remainingWords.length === aiWordPool.length) {
                const value = evaluateGuess(guessWord);
                minValue = Math.min(minValue, value);
                
                // Alpha-beta pruning
                if (alpha !== null && beta !== null) {
                    beta = Math.min(beta, value);
                    if (beta <= alpha) break; // Alpha cutoff
                }
                continue;
            }
            
            // Choose a representative word from remaining words
            const nextWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
            const value = minimaxValue(nextWord, depth + 1, maxDepth, alpha, beta, true);
            minValue = Math.min(minValue, value);
            
            // Alpha-beta pruning
            if (alpha !== null && beta !== null) {
                beta = Math.min(beta, value);
                if (beta <= alpha) break; // Alpha cutoff
            }
        }
        return minValue;
    }
}

// Simulate possible feedback patterns for a guess
function simulateFeedbackPatterns(guessWord) {
    const patterns = {};
    
    // For each possible target word, calculate what pattern would result
    for (const targetWord of aiWordPool) {
        const result = checkGuess(guessWord, targetWord);
        const patternKey = result.join('');
        
        if (!patterns[patternKey]) {
            patterns[patternKey] = [];
        }
        patterns[patternKey].push(targetWord);
    }
    
    return patterns;
}

// Evaluate how good a guess is
function evaluateGuess(guessWord) {
    // Calculate expected information gain
    const patterns = simulateFeedbackPatterns(guessWord);
    const totalWords = aiWordPool.length;
    
    let infoGain = 0;
    for (const pattern in patterns) {
        const remainingCount = patterns[pattern].length;
        const probability = remainingCount / totalWords;
        
        if (probability > 0) {
            // Calculate information gain using entropy formula
            const bitReduction = -Math.log2(probability);
            infoGain += probability * bitReduction;
        }
    }
    
    // Bonus for words that could be the answer
    const couldBeAnswer = aiWordPool.includes(guessWord) ? 0.1 : 0;
    
    // Letter diversity score (prefer words with diverse letters)
    const uniqueLetters = new Set(guessWord.split('')).size;
    const letterDiversityScore = uniqueLetters / 5;
    
    // Combine scores with weights
    return infoGain * 0.7 + couldBeAnswer * 0.1 + letterDiversityScore * 0.2;
}

// Filter AI's word pool based on feedback knowledge
function filterWordPool() {
    aiWordPool = aiWordPool.filter(word => {
        // Check must-contain letters
        for (const letter of aiKnowledge.mustContain) {
            if (!word.includes(letter)) {
                return false;
            }
        }
        
        // Check positional info
        for (let i = 0; i < 5; i++) {
            // Letters that must be at this position
            const mustBeHere = aiKnowledge.positionalInfo[i].filter(info => info.status === 'correct');
            if (mustBeHere.length > 0 && word[i] !== mustBeHere[0].letter) {
                return false;
            }
            
            // Letters that cannot be at this position
            const cannotBeHere = aiKnowledge.positionalInfo[i].filter(info => info.status === 'present');
            for (const info of cannotBeHere) {
                if (word[i] === info.letter) {
                    return false;
                }
            }
        }
        
        // Check letters not in word
        for (const letter of aiKnowledge.notInWord) {
            if (word.includes(letter)) {
                return false;
            }
        }
        
        return true;
    });
}

// Update AI's knowledge based on feedback
function updateAiKnowledge(guess, result) {
    for (let i = 0; i < 5; i++) {
        const letter = guess[i];
        
        if (result[i] === 'correct') {
            // Add to must contain if not already there
            if (!aiKnowledge.mustContain.includes(letter)) {
                aiKnowledge.mustContain.push(letter);
            }
            
            // Update positional info
            aiKnowledge.positionalInfo[i].push({
                letter: letter,
                status: 'correct'
            });
        } else if (result[i] === 'present') {
            // Add to must contain if not already there
            if (!aiKnowledge.mustContain.includes(letter)) {
                aiKnowledge.mustContain.push(letter);
            }
            
            // Update positional info
            aiKnowledge.positionalInfo[i].push({
                letter: letter,
                status: 'present'
            });
        } else if (result[i] === 'absent') {
            // Check if the letter appears elsewhere in the guess with a different result
            // This handles duplicate letters where some instances are correct/present and others are absent
            let appearsElsewhere = false;
            for (let j = 0; j < 5; j++) {
                if (i !== j && guess[j] === letter && (result[j] === 'correct' || result[j] === 'present')) {
                    appearsElsewhere = true;
                    break;
                }
            }
            
            if (!appearsElsewhere && !aiKnowledge.notInWord.includes(letter)) {
                aiKnowledge.notInWord.push(letter);
            }
        }
    }
}

// Update keyboard colors based on guess results
function updateKeyboard(guess, result) {
    for (let i = 0; i < 5; i++) {
        const letter = guess[i].toLowerCase();
        const status = result[i];
        const keyElement = keyboard.querySelector(`[data-key="${letter}"]`);
        
        if (keyElement) {
            // Only update if current status is higher priority
            // Priority: correct > present > absent
            if (status === 'correct') {
                keyElement.classList.remove('present', 'absent');
                keyElement.classList.add('correct');
            } else if (status === 'present' && !keyElement.classList.contains('correct')) {
                keyElement.classList.remove('absent');
                keyElement.classList.add('present');
            } else if (!keyElement.classList.contains('correct') && !keyElement.classList.contains('present')) {
                keyElement.classList.add('absent');
            }
        }
    }
}

// Check if the game is over
function checkGameOver() {
    if ((gameState.playerSolved || playerAttempts >= maxAttempts) && 
        (gameState.aiSolved || aiAttempts >= maxAttempts)) {
        gameState.gameOver = true;
        
        // Disable input
        guessInput.disabled = true;
        submitButton.disabled = true;
        
        // Show the new game button
        newGameButton.style.display = 'block';
        
        // Display result banner
        let resultMessage = '';
        let resultClass = '';
        
        // Show the target words
        const playerWordReveal = document.createElement('div');
        playerWordReveal.classList.add('word-reveal');
        playerWordReveal.textContent = `Your eco-word was: ${playerWord}`;
        
        const aiWordReveal = document.createElement('div');
        aiWordReveal.classList.add('word-reveal');
        aiWordReveal.textContent = `AI's eco-word was: ${aiWord}`;
        
        // Determine winner
        if (gameState.playerSolved && gameState.aiSolved) {
            if (playerAttempts < aiAttempts) {
                resultMessage = `You win! You solved it in ${playerAttempts} attempts, AI took ${aiAttempts}.`;
                resultClass = 'win';
            } else if (aiAttempts < playerAttempts) {
                resultMessage = `AI wins! AI solved it in ${aiAttempts} attempts, you took ${playerAttempts}.`;
                resultClass = 'lose';
            } else {
                resultMessage = `It's a draw! Both solved in ${playerAttempts} attempts.`;
                resultClass = 'draw';
            }
        } else if (gameState.playerSolved) {
            resultMessage = `You win! You solved it in ${playerAttempts} attempts, AI failed.`;
            resultClass = 'win';
        } else if (gameState.aiSolved) {
            resultMessage = `AI wins! AI solved it in ${aiAttempts} attempts, you failed.`;
            resultClass = 'lose';
        } else {
            resultMessage = `It's a draw! Neither solved the eco-word.`;
            resultClass = 'draw';
        }
        
        // Create and display banner
        const banner = document.createElement('div');
        banner.classList.add('result-banner', resultClass);
        banner.textContent = resultMessage;
        
        resultArea.appendChild(banner);
        resultArea.appendChild(playerWordReveal);
        resultArea.appendChild(aiWordReveal);
    }
}

// Handle player guess submission
function handlePlayerGuess() {
    if (gameState.gameOver || gameState.playerSolved) return;
    
    const guess = guessInput.value.toUpperCase();
    
    // Validate the guess
    if (guess.length !== 5 || !/^[A-Z]+$/.test(guess)) {
        playerStatus.textContent = 'Please enter a valid 5-letter word';
        return;
    }
    
    // Process valid guess
    playerStatus.textContent = '';
    playerGuesses.push(guess);
    playerAttempts++;
    
    // Check the guess
    const result = checkGuess(guess, playerWord);
    displayGuess(playerGrid, guess, result, playerAttempts - 1);
    
    // Update keyboard
    updateKeyboard(guess, result);
    
    // Clear input
    guessInput.value = '';
    
    // Check if player solved the word
    if (guess === playerWord) {
        gameState.playerSolved = true;
        playerStatus.textContent = `You solved the eco-word in ${playerAttempts} ${playerAttempts === 1 ? 'attempt' : 'attempts'}!`;
        checkGameOver();
    } else if (playerAttempts >= maxAttempts) {
        playerStatus.textContent = 'You failed to solve the eco-word!';
        checkGameOver();
    }
    
    // Disable input while AI is thinking
    guessInput.disabled = true;
    submitButton.disabled = true;
    
    // AI's turn
    if (!gameState.gameOver) {
        aiMakeGuess();
    }
}

// Event listeners
submitButton.addEventListener('click', handlePlayerGuess);
guessInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handlePlayerGuess();
    }
});

newGameButton.addEventListener('click', initGame);

// Add keyboard click events
keyboard.addEventListener('click', function(e) {
    if (e.target.classList.contains('key') && !guessInput.disabled) {
        const key = e.target.getAttribute('data-key');
        if (key) {
            guessInput.value += key;
            if (guessInput.value.length > 5) {
                guessInput.value = guessInput.value.substring(0, 5);
            }
            guessInput.focus();
        }
    }
});

// Initialize game on document load
document.addEventListener('DOMContentLoaded', function() {
    addDifficultyStyles();
    addDifficultySelector();
    initWordBank();
    initGame();
});