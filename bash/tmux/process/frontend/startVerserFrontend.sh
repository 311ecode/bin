#!/bin/bash
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

    # startProcess "frontend" "frontendVite" "npm run dev" "$frontendDirReact"
    btcwd
}

