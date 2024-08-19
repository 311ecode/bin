#!/bin/bash


# Function to generate a hash from parameters
# @param {...string} args - Any number of string arguments
# @return A hash string based on the input arguments
generateParameterHash() {
    local args="$*"
    echo -n "$args" | md5sum | awk '{print $1}'
}


# Function to write PID to a file
# @param {string} identifier - Unique identifier for the process
# @param {number} pid - Process ID to write
writePid() {
    local identifier=$1
    local pid=$2
    echo $pid > "/tmp/${identifier}_pid"
}

# Function to read PID from a file
# @param {string} identifier - Unique identifier for the process
# @return {number} The stored PID, or empty if file doesn't exist
readPid() {
    local identifier=$1
    local pidFile="/tmp/${identifier}_pid"
    if [[ -f $pidFile ]]; then
        cat $pidFile
    fi
}


# Function to start a process in a tmux session
# @param {string} kind - Kind of process (e.g., "verser")
# @param {string} name - Name of the process
# @param {string} command - The command to run
startProcess() {
    local kind=$1
    local name=$2
    local command=$3
    local sessionName="${kind}_${name}"

    echo "Starting $kind process '$name' in tmux..."
    tmux new-session -d -s "$sessionName" "$command"
    local pid=$(tmux list-panes -t "$sessionName" -F '#{pane_pid}')
    
    writePid "$sessionName" $pid
    echo "$kind process '$name' started in tmux session '$sessionName' with PID: $pid"
    echo "To attach to this session, run: tmux attach-session -t $sessionName"
}

# Function to stop a process
# @param {string} kind - Kind of process (e.g., "verser")
# @param {string} name - Name of the process
stopProcess() {
    local kind=$1
    local name=$2
    local sessionName="${kind}_${name}"
    local pidFile="/tmp/${sessionName}_pid"
    
    if tmux has-session -t "$sessionName" 2>/dev/null; then
        echo "Stopping $kind process '$name'..."
        tmux kill-session -t "$sessionName"
        rm "$pidFile"
        echo "$kind process '$name' stopped."
    else
        echo "No tmux session found for $kind process '$name'."
    fi
}

# Function to stop all tmux sessions of a specific kind
# @param {string} kind - Kind of process (e.g., "verser")
stopKindTmuxSessions() {
    local kind=$1
    echo "Stopping all $kind tmux sessions..."
    tmux list-sessions -F '#{session_name}' | grep "^${kind}_" | while read -r session_name; do
        tmux kill-session -t "$session_name"
        rm "/tmp/${session_name}_pid"
        echo "Stopped session: $session_name"
    done
}

# Function to list all tmux sessions of a specific kind
# @param {string} kind - Kind of process (e.g., "verser")
listKindTmuxSessions() {
    local kind=$1
    echo "Active $kind tmux sessions:"
    echo "--------------------------"
    tmux list-sessions | grep "^${kind}_" | while read -r line; do
        session_name=$(echo "$line" | cut -d ':' -f 1)
        echo "Session: $session_name"
        echo "  To attach: tmux attach-session -t $session_name"
        echo "  To stop: stopProcess $kind ${session_name#${kind}_}"
        echo
    done
    
    if [ -z "$(tmux list-sessions | grep "^${kind}_")" ]; then
        echo "No active $kind tmux sessions found."
    fi
}

# Function to list all tmux sessions
listTmuxSessions() {
    echo "Active tmux sessions:"
    echo "---------------------"
    tmux list-sessions | while read -r line; do
        session_name=$(echo "$line" | cut -d ':' -f 1)
        echo "Session: $session_name"
        echo "  To attach: tmux attach-session -t $session_name"
        echo "  To stop: tmux kill-session -t $session_name"
        echo
    done
    
    if [ -z "$(tmux list-sessions)" ]; then
        echo "No active tmux sessions found."
    fi
}

# Function to stop all tmux sessions
stopAllTmuxSessions() {
    tmux list-sessions -F '#{session_name}' | while read -r session_name; do
        tmux kill-session -t "$session_name"
        echo "Stopped session: $session_name"
    done
}

# Function to start a process in a tmux session
# @param {string} sessionName - Name for the tmux session
# @param {string} command - The command to run in the tmux session
startTmuxSession() {
    local sessionName=$1
    local command=$2

    echo "Starting process in tmux session '$sessionName'..."
    tmux new-session -d -s "$sessionName" "$command"
    local pid=$(tmux list-panes -t "$sessionName" -F '#{pane_pid}')
    echo "Process started in tmux session '$sessionName' with PID: $pid"
    echo "To attach to this session, run: tmux attach-session -t $sessionName"
    return $pid
}

# Function to stop a tmux session
# @param {string} sessionName - Name of the session to stop
stopTmuxSession() {
    local sessionName=$1

    if tmux has-session -t "$sessionName" 2>/dev/null; then
        echo "Stopping tmux session '$sessionName'..."
        tmux kill-session -t "$sessionName"
        echo "Session '$sessionName' stopped."
    else
        echo "No tmux session found with name '$sessionName'."
    fi
}

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
