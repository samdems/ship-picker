# Artemis Bridge Simulator - Ship Picker

A real-time web application for Artemis Bridge Simulator that allows players to select ships and crew positions. Built with Node.js, Express, and Socket.IO for synchronized multiplayer selection.

## Features

- **Player Interface**: Players can enter their name and select a ship and position
- **Admin Interface**: Configure ships, positions, and manage player selections
- **Real-time Sync**: All changes are synchronized instantly across all connected clients
- **Conflict Prevention**: Positions can't be double-booked
- **Auto-cleanup**: Player selections are removed when they disconnect

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Or use nodemon for development:

```bash
npm run dev
```

The server will start on port 3000 (or the PORT environment variable if set).

## Interfaces

- **Player Interface**: http://localhost:3000/
- **Admin Interface**: http://localhost:3000/admin

## How It Works

### For Players:
1. Open the player interface
2. Enter your name
3. Select an available ship and position
4. Your selection will be visible to all other players
5. You can change your position by clicking "Change Position"

### For Admins:
1. Open the admin interface
2. Configure ships and their available positions
3. View all current player selections in real-time
4. Reset all selections or update ship configurations as needed

## Technology Stack

- **Backend**: Node.js, Express
- **WebSockets**: Socket.IO for real-time bidirectional communication
- **Frontend**: Vanilla JavaScript, HTML5, CSS3