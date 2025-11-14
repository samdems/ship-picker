const socket = io();

let gameState = null;
let playerName = null;
let currentSelection = null;

// DOM elements
const loginForm = document.getElementById('loginForm');
const playerStatus = document.getElementById('playerStatus');
const playerNameInput = document.getElementById('playerName');
const joinBtn = document.getElementById('joinBtn');
const displayName = document.getElementById('displayName');
const selectionStatus = document.getElementById('selectionStatus');
const shipGrid = document.getElementById('shipGrid');
const errorMessage = document.getElementById('errorMessage');

// Load saved name from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('artemisPlayerName');
    if (savedName) {
        playerNameInput.value = savedName;
        // Auto-join if name exists
        playerName = savedName;
        displayName.textContent = savedName;
        loginForm.style.display = 'none';
        playerStatus.style.display = 'block';
        updateSelectionStatus();
        renderShips();
        // Notify server of reconnection
        socket.emit('reconnectPlayer', savedName);
    }
});

// Join button handler
joinBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (name) {
        playerName = name;
        // Save to localStorage
        localStorage.setItem('artemisPlayerName', name);
        displayName.textContent = name;
        loginForm.style.display = 'none';
        playerStatus.style.display = 'block';
        updateSelectionStatus();
        renderShips(); // Re-render ships to enable position selection
    }
});

// Allow Enter key to join
playerNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinBtn.click();
    }
});

// Receive game state updates
socket.on('gameState', (state) => {
    gameState = state;
    
    // Check if current player still has their selection (by player name)
    const mySelection = playerName ? state.selections[playerName] : null;
    currentSelection = mySelection || null;
    
    updateSelectionStatus();
    renderShips();
});

// Handle selection errors
socket.on('selectionError', (data) => {
    showError(data.message);
});

function updateSelectionStatus() {
    if (!playerName) return;
    
    if (currentSelection) {
        const ship = gameState.ships.find(s => s.id === currentSelection.shipId);
        selectionStatus.innerHTML = `
            You are assigned to: <strong>${ship.name}</strong> - <strong>${currentSelection.position}</strong>
            <button id="deselectBtn" class="btn btn-small btn-warning">Change Position</button>
        `;
        
        const deselectBtn = document.getElementById('deselectBtn');
        deselectBtn.addEventListener('click', () => {
            socket.emit('deselectPosition', playerName);
            currentSelection = null;
        });
    } else {
        selectionStatus.textContent = 'Select a ship and position below';
    }
}

function renderShips() {
    if (!gameState) return;
    
    shipGrid.innerHTML = '';
    
    gameState.ships.forEach(ship => {
        const shipCard = document.createElement('div');
        shipCard.className = 'ship-card';
        
        const shipHeader = document.createElement('h2');
        shipHeader.textContent = ship.name;
        shipCard.appendChild(shipHeader);
        
        const positionsContainer = document.createElement('div');
        positionsContainer.className = 'positions-container';
        
        ship.positions.forEach(position => {
            const positionBtn = document.createElement('button');
            positionBtn.className = 'position-btn';
            
            // Check if position is taken
            const takenBy = Object.values(gameState.selections).find(
                s => s.shipId === ship.id && s.position === position
            );
            
            if (takenBy) {
                positionBtn.classList.add('taken');
                if (takenBy.playerName === playerName) {
                    positionBtn.classList.add('my-selection');
                    positionBtn.textContent = `${position} (You)`;
                } else {
                    positionBtn.textContent = `${position} (${takenBy.playerName})`;
                    positionBtn.disabled = true;
                }
            } else {
                positionBtn.classList.add('available');
                positionBtn.textContent = position;
            }
            
            // Only allow selection if player has joined
            if (playerName && !takenBy) {
                positionBtn.addEventListener('click', () => {
                    socket.emit('selectPosition', {
                        playerName,
                        shipId: ship.id,
                        position
                    });
                });
            } else if (!playerName && !takenBy) {
                positionBtn.disabled = true;
                positionBtn.title = 'Please enter your name first';
            }
            
            positionsContainer.appendChild(positionBtn);
        });
        
        shipCard.appendChild(positionsContainer);
        shipGrid.appendChild(shipCard);
    });
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Initial render
renderShips();
