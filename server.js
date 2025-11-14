const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
  ships: [
    { id: 1, name: 'USS Artemis', positions: ['Helm', 'Weapons', 'Engineering', 'Science', 'Communications', 'Captain'] },
    { id: 2, name: 'USS Phoenix', positions: ['Helm', 'Weapons', 'Engineering', 'Science', 'Communications', 'Captain'] }
  ],
  selections: {}
  // Format: { playerName: { playerName: 'John', shipId: 1, position: 'Helm', socketId: socket.id } }
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Send current game state to newly connected client
  socket.emit('gameState', gameState);

  // Player reconnects with their saved name
  socket.on('reconnectPlayer', (playerName) => {
    if (gameState.selections[playerName]) {
      // Update socket ID for this player
      gameState.selections[playerName].socketId = socket.id;
      io.emit('gameState', gameState);
      console.log(`Player ${playerName} reconnected with new socket ${socket.id}`);
    }
  });

  // Player selects a ship and position
  socket.on('selectPosition', (data) => {
    const { playerName, shipId, position } = data;
    
    // Check if position is already taken by someone else
    const isPositionTaken = Object.values(gameState.selections).some(
      selection => selection.shipId === shipId && selection.position === position && selection.playerName !== playerName
    );

    if (isPositionTaken) {
      socket.emit('selectionError', { message: 'Position already taken' });
      return;
    }

    // Remove any previous selection by this player name
    delete gameState.selections[playerName];

    // Add new selection (keyed by player name, not socket ID)
    gameState.selections[playerName] = {
      playerName,
      shipId,
      position,
      socketId: socket.id
    };

    // Broadcast updated state to all clients
    io.emit('gameState', gameState);
    console.log(`Player ${playerName} selected ${position} on ship ${shipId}`);
  });

  // Player deselects their position
  socket.on('deselectPosition', (playerName) => {
    if (gameState.selections[playerName]) {
      const selection = gameState.selections[playerName];
      console.log(`Player ${selection.playerName} deselected ${selection.position}`);
      delete gameState.selections[playerName];
      io.emit('gameState', gameState);
    }
  });

  // Admin updates ships configuration
  socket.on('updateShips', (ships) => {
    gameState.ships = ships;
    // Clear all selections when ships are updated
    gameState.selections = {};
    io.emit('gameState', gameState);
    console.log('Ships configuration updated');
  });

  // Admin resets all selections
  socket.on('resetSelections', () => {
    gameState.selections = {};
    io.emit('gameState', gameState);
    console.log('All selections reset');
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Find selection by socket ID
    const playerName = Object.keys(gameState.selections).find(
      name => gameState.selections[name].socketId === socket.id
    );
    
    if (playerName) {
      console.log(`Player ${playerName} disconnected (selection preserved)`);
      // Don't remove the selection - keep it until admin resets or player manually deselects
    }
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Player interface: http://localhost:${PORT}/`);
  console.log(`Admin interface: http://localhost:${PORT}/admin`);
});
