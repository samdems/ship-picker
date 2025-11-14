const socket = io();

let gameState = null;
let editingShips = [];

// DOM elements
const shipConfigContainer = document.getElementById('shipConfigContainer');
const addShipBtn = document.getElementById('addShipBtn');
const saveShipsBtn = document.getElementById('saveShipsBtn');
const resetSelectionsBtn = document.getElementById('resetSelectionsBtn');
const selectionsDisplay = document.getElementById('selectionsDisplay');
const shipGrid = document.getElementById('shipGrid');

// Receive game state updates
socket.on('gameState', (state) => {
    gameState = state;
    editingShips = JSON.parse(JSON.stringify(state.ships)); // Deep copy
    renderShipConfig();
    renderSelections();
    renderShipGrid();
});

// Add ship button
addShipBtn.addEventListener('click', () => {
    const newId = editingShips.length > 0 ? Math.max(...editingShips.map(s => s.id)) + 1 : 1;
    editingShips.push({
        id: newId,
        name: `New Ship ${newId}`,
        positions: ['Helm', 'Weapons', 'Engineering', 'Science', 'Communications', 'Captain']
    });
    renderShipConfig();
});

// Save ships button
saveShipsBtn.addEventListener('click', () => {
    // Validate ships
    if (editingShips.length === 0) {
        alert('You must have at least one ship');
        return;
    }
    
    for (const ship of editingShips) {
        if (!ship.name.trim()) {
            alert('All ships must have a name');
            return;
        }
        if (ship.positions.length === 0) {
            alert(`Ship "${ship.name}" must have at least one position`);
            return;
        }
    }
    
    socket.emit('updateShips', editingShips);
    alert('Ships configuration saved! All player selections have been reset.');
});

// Reset selections button
resetSelectionsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all player selections?')) {
        socket.emit('resetSelections');
    }
});

function renderShipConfig() {
    shipConfigContainer.innerHTML = '';
    
    editingShips.forEach((ship, shipIndex) => {
        const shipConfig = document.createElement('div');
        shipConfig.className = 'ship-config';
        
        // Ship name input
        const nameContainer = document.createElement('div');
        nameContainer.className = 'config-row';
        
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Ship Name:';
        
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = ship.name;
        nameInput.className = 'ship-name-input';
        nameInput.addEventListener('input', (e) => {
            editingShips[shipIndex].name = e.target.value;
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Delete Ship';
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Delete ship "${ship.name}"?`)) {
                editingShips.splice(shipIndex, 1);
                renderShipConfig();
            }
        });
        
        nameContainer.appendChild(nameLabel);
        nameContainer.appendChild(nameInput);
        nameContainer.appendChild(deleteBtn);
        
        // Positions
        const positionsLabel = document.createElement('label');
        positionsLabel.textContent = 'Positions:';
        
        const positionsContainer = document.createElement('div');
        positionsContainer.className = 'positions-config';
        
        ship.positions.forEach((position, posIndex) => {
            const posDiv = document.createElement('div');
            posDiv.className = 'position-config-item';
            
            const posInput = document.createElement('input');
            posInput.type = 'text';
            posInput.value = position;
            posInput.addEventListener('input', (e) => {
                editingShips[shipIndex].positions[posIndex] = e.target.value;
            });
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.className = 'btn btn-small btn-danger';
            removeBtn.addEventListener('click', () => {
                editingShips[shipIndex].positions.splice(posIndex, 1);
                renderShipConfig();
            });
            
            posDiv.appendChild(posInput);
            posDiv.appendChild(removeBtn);
            positionsContainer.appendChild(posDiv);
        });
        
        const addPositionBtn = document.createElement('button');
        addPositionBtn.textContent = '+ Add Position';
        addPositionBtn.className = 'btn btn-small btn-secondary';
        addPositionBtn.addEventListener('click', () => {
            editingShips[shipIndex].positions.push('New Position');
            renderShipConfig();
        });
        
        shipConfig.appendChild(nameContainer);
        shipConfig.appendChild(positionsLabel);
        shipConfig.appendChild(positionsContainer);
        shipConfig.appendChild(addPositionBtn);
        
        shipConfigContainer.appendChild(shipConfig);
    });
}

function renderSelections() {
    if (!gameState) return;
    
    const selections = Object.values(gameState.selections);
    
    if (selections.length === 0) {
        selectionsDisplay.innerHTML = '<p class="no-selections">No players have selected positions yet.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'selections-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Player Name</th>
            <th>Ship</th>
            <th>Position</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    selections.forEach(selection => {
        const ship = gameState.ships.find(s => s.id === selection.shipId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${selection.playerName}</td>
            <td>${ship ? ship.name : 'Unknown'}</td>
            <td>${selection.position}</td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    selectionsDisplay.innerHTML = '';
    selectionsDisplay.appendChild(table);
}

function renderShipGrid() {
    if (!gameState) return;
    
    shipGrid.innerHTML = '<h2>Ship Overview</h2>';
    
    gameState.ships.forEach(ship => {
        const shipCard = document.createElement('div');
        shipCard.className = 'ship-card';
        
        const shipHeader = document.createElement('h3');
        shipHeader.textContent = ship.name;
        shipCard.appendChild(shipHeader);
        
        const positionsContainer = document.createElement('div');
        positionsContainer.className = 'positions-container';
        
        ship.positions.forEach(position => {
            const positionBtn = document.createElement('div');
            positionBtn.className = 'position-display';
            
            const takenBy = Object.values(gameState.selections).find(
                s => s.shipId === ship.id && s.position === position
            );
            
            if (takenBy) {
                positionBtn.classList.add('taken');
                positionBtn.textContent = `${position}: ${takenBy.playerName}`;
            } else {
                positionBtn.classList.add('available');
                positionBtn.textContent = `${position}: Available`;
            }
            
            positionsContainer.appendChild(positionBtn);
        });
        
        shipCard.appendChild(positionsContainer);
        shipGrid.appendChild(shipCard);
    });
}

// Initial render
if (gameState) {
    renderShipConfig();
    renderSelections();
    renderShipGrid();
}
