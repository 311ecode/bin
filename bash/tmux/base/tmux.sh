#!/bin/bash

# Function to attach to a tmux session
# @param {string} sessionName - Name of the session to attach to
attachTmuxSession() {
    local sessionName=$1

    if tmux has-session -t "$sessionName" 2>/dev/null; then
        echo "Attaching to tmux session '$sessionName'..."
        echo "Use 'Ctrl-b, d' to detach from the session."
        tmux attach-session -t "$sessionName"
    else
        echo "No tmux session found with name '$sessionName'. Please start it first."
    fi
}

# Function to display common tmux information
# @description Displays common information about tmux usage for Verser
displayCommonTmuxInfo() {
    echo "Tmux Quick Reference:"
    echo "---------------------"
    echo "Ctrl-b, d    : Detach from tmux session (return to regular shell)"
    echo "Ctrl-d       : Exit and close tmux session"
    echo "Ctrl-b, c    : Create a new window"
    echo "Ctrl-b, n    : Move to next window"
    echo "Ctrl-b, p    : Move to previous window"
    echo "Ctrl-b, w    : List all windows"
    echo "Ctrl-b, ,    : Rename current window"
    echo "exit         : Close current window (or session if last window)"
}

# Function to display tmux help
# @description Displays helpful tmux commands
displayTmuxHelp() {
    displayCommonTmuxInfo
}


