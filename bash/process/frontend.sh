#!/bin/bash

# Function to start the frontend server in a tmux session
# @description Starts the frontend server using npm run dev in a tmux session
startVerserFrontend() {
    scwd
    cd "$frontendDirReact"
    
    if [ "$VSCODE_DEBUG" = "true" ]; then
    # If running in debug mode, use 'exec' to replace the shell process with npm
    exec npm run dev
    else
        # Otherwise, run as normal
      startProcess "frontend" "frontendVite" "npm run dev" "$frontendDirReact"
    fi

    startProcess "frontend" "frontendVite" "npm run dev" "$frontendDirReact"
    btcwd
}

# Function to stop the frontend server
# @description Stops the frontend server tmux session
stopVerserFrontend() {
  stopProcess "frontend" "$frontendDirReact"
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
