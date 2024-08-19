#!/bin/bash


# Function to start the frontend server in a tmux session
# @description Starts the frontend server using npm run dev in a tmux session
startVerserFrontend() {
    scwd
    cd "$frontendDirReact"
    startVerserTmuxSession "frontend" "npm run dev" "$frontendDirReact"
    btcwd
}

# Function to stop the frontend server
# @description Stops the frontend server tmux session
stopVerserFrontend() {
  stopVerserTmuxSession "frontend" "$frontendDirReact"
}

# Function to restart the frontend server
# @description Stops and then starts the frontend server tmux session
restartVerserFrontend() {
  stopVerserFrontend
  startVerserFrontend
}


# Update attachVerserFrontend function to show tmux help
attachVerserFrontend() {
  attachVerserTmuxSession "frontend" "$frontendDirReact"
}
