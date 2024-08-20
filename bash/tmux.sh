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

tmuxUtils() {
    local content="
TMUX UTILITIES

NAME
    tmuxUtils - A collection of utility functions for managing tmux sessions

DESCRIPTION
    This set of functions provides a convenient interface for starting, stopping,
    and managing tmux sessions, particularly useful for running background processes.

FUNCTIONS

    startProcess KIND NAME COMMAND
        Start a process in a new tmux session.
        Arguments:
            KIND - Type of process (e.g., 'verser')
            NAME - Name of the process
            COMMAND - The command to run in the session

    stopProcess KIND NAME
        Stop a specific tmux session.
        Arguments:
            KIND - Type of process
            NAME - Name of the process

    stopKindTmuxSessions KIND
        Stop all tmux sessions of a specific kind.
        Arguments:
            KIND - Type of process to stop

    listKindTmuxSessions KIND
        List all tmux sessions of a specific kind.
        Arguments:
            KIND - Type of process to list

    listTmuxSessions
        List all active tmux sessions.

    stopAllTmuxSessions
        Stop all active tmux sessions.

    startTmuxSession SESSION_NAME COMMAND
        Start a new tmux session with a given name and command.
        Arguments:
            SESSION_NAME - Name for the new session
            COMMAND - The command to run in the session

    stopTmuxSession SESSION_NAME
        Stop a specific tmux session by name.
        Arguments:
            SESSION_NAME - Name of the session to stop

    attachTmuxSession SESSION_NAME
        Attach to an existing tmux session.
        Arguments:
            SESSION_NAME - Name of the session to attach to

    displayTmuxHelp
        Display helpful information about tmux commands.

    setup_tmux_config
        Set up a basic tmux configuration file (~/.tmux.conf) with mouse support.

USAGE EXAMPLES

    Start a new process:
        startProcess verser my_process 'python my_script.py'

    Stop a specific process:
        stopProcess verser my_process

    List all 'verser' sessions:
        listKindTmuxSessions verser

    Stop all 'verser' sessions:
        stopKindTmuxSessions verser

    List all tmux sessions:
        listTmuxSessions

    Stop all tmux sessions:
        stopAllTmuxSessions

    Start a custom tmux session:
        startTmuxSession my_session 'top'

    Stop a custom tmux session:
        stopTmuxSession my_session

    Attach to a tmux session:
        attachTmuxSession my_session

    Display tmux help:
        displayTmuxHelp

    Set up tmux configuration:
        setup_tmux_config

NOTES
    - Make sure tmux is installed on your system before using these functions.
    - Use 'Ctrl-b, d' to detach from a tmux session without stopping it.
    - The setup_tmux_config function creates a basic ~/.tmux.conf file with mouse support.

SEE ALSO
    tmux(1), bash(1)
"

    echo "$content" | less
}

setupTmuxConfig() {
    local tmux_conf="$HOME/.tmux.conf"
    
    if [ -f "$tmux_conf" ]; then
        echo "~/.tmux.conf already exists. No changes made." > /dev/null
    else
        echo "Creating ~/.tmux.conf with mouse scrolling configuration..."
        cat << EOF > "$tmux_conf"
# Enable mouse support
set -g mouse on

# Increase scrollback buffer size
set -g history-limit 50000

# Enable terminal overrides for better mouse support
set -ga terminal-overrides ',xterm*:smcup@:rmcup@'

# Optional: Set more intuitive split pane commands
bind | split-window -h
bind - split-window -v

# Optional: Enable vi mode for scrolling
setw -g mode-keys vi
EOF
        echo "~/.tmux.conf has been created with mouse scrolling configuration."
        echo "To apply changes to existing tmux sessions, run: tmux source-file ~/.tmux.conf"
        echo "Or start a new tmux session to use the new configuration."
    fi
}
setupTmuxConfig
