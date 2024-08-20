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
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local logFile="/tmp/${sessionName}_${timestamp}.log"

    echo "Starting $kind process '$name' in tmux..."
    tmux new-session -d -s "$sessionName" "($command) 2>&1 | tee $logFile"
    local pid=$(tmux list-panes -t "$sessionName" -F '#{pane_pid}')
    
    writePid "$sessionName" $pid
    echo "$kind process '$name' started in tmux session '$sessionName' with PID: $pid"
    echo "Log file: $logFile"
    echo "To attach to this session, run: tmux attach-session -t $sessionName"
    echo "To view logs in real-time, run: tail -f $logFile"
}

selectKind() {
    local kinds=($(tmux list-sessions -F '#{session_name}' 2>/dev/null | cut -d'_' -f1 | sort -u))
    local logKinds=($(find /tmp -maxdepth 1 -name '*.log' -printf '%f\n' 2>/dev/null | cut -d'_' -f1 | sort -u))
    kinds+=(${logKinds[@]})
    kinds=($(printf "%s\n" "${kinds[@]}" | sort -u))
    kinds+=("all")

    if [ ${#kinds[@]} -eq 1 ]; then
        echo "No processes or logs found."
        return 1
    fi

    echo "Select a process kind:"
    select kind in "${kinds[@]}"; do
        if [ -n "$kind" ]; then
            echo "$kind"
            return 0
        else
            echo "Invalid selection. Please try again."
        fi
    done
}

# Updated checkProcessStatus function
checkProcessStatus() {
    local kind=$1
    local name=$2

    if [ -z "$kind" ]; then
        kind=$(selectKind)
        [ $? -ne 0 ] && return 1
    fi

    if [ -z "$name" ]; then
        local sessions=($(tmux list-sessions -F '#{session_name}' 2>/dev/null | grep "^${kind}_"))
        local logFiles=($(ls /tmp/${kind}_*.log 2>/dev/null))
        local allProcesses=($(printf "%s\n" "${sessions[@]}" "${logFiles[@]}" | sort -u))

        if [ ${#allProcesses[@]} -eq 0 ]; then
            echo "No $kind processes found (running or terminated)."
            return
        fi

        echo "Select a process to check:"
        select process in "${allProcesses[@]}"; do
            if [ -n "$process" ]; then
                if [[ $process == /tmp/* ]]; then
                    name=$(basename "$process" | cut -d'_' -f2)
                else
                    name=${process#${kind}_}
                fi
                break
            else
                echo "Invalid selection. Please try again."
            fi
        done
    fi

    local sessionName="${kind}_${name}"

    if tmux has-session -t "$sessionName" 2>/dev/null; then
        echo "$kind process '$name' is running."
        local pid=$(tmux list-panes -t "$sessionName" -F '#{pane_pid}')
        echo "PID: $pid"
        echo "To view logs, run: viewProcessLogs $kind $name"
    else
        echo "$kind process '$name' is not running."
        local latestLog=$(ls -t /tmp/${sessionName}_*.log 2>/dev/null | head -n1)
        if [ -n "$latestLog" ]; then
            echo "Process has terminated. Last 10 lines of log:"
            tail -n 10 "$latestLog"
            echo "To view full logs, run: viewProcessLogs $kind $name"
        else
            echo "No log file found."
        fi
    fi
}

# Updated listAllProcesses function
listAllProcesses() {
    echo "Running processes:"
    echo "-----------------"
    local runningFound=false
    while read -r session; do
        local pid=$(tmux list-panes -t "$session" -F '#{pane_pid}')
        echo "$session (PID: $pid)"
        runningFound=true
    done < <(tmux list-sessions -F '#{session_name}' 2>/dev/null)
    
    if [ "$runningFound" = false ]; then
        echo "No running processes found."
    fi

    echo
    echo "Log files:"
    echo "----------"
    local logFound=false
    while read -r logFile; do
        local baseName=$(basename "$logFile")
        local timestamp=$(echo "$baseName" | grep -oP '\d{8}_\d{6}')
        echo "$baseName (Timestamp: $timestamp)"
        logFound=true
    done < <(find /tmp -maxdepth 1 -name '*.log' 2>/dev/null | sort)
    
    if [ "$logFound" = false ]; then
        echo "No log files found."
    fi
}


# Updated viewProcessLogs function
viewProcessLogs() {
    local logFiles=($(find /tmp -maxdepth 1 -name '*.log' 2>/dev/null | sort))

    if [ ${#logFiles[@]} -eq 0 ]; then
        echo "No log files found."
        return
    fi

    echo "Select a log file to view:"
    select logFile in "${logFiles[@]}" "Exit"; do
        if [ "$logFile" = "Exit" ]; then
            return
        elif [ -n "$logFile" ]; then
            displayLogFile "$logFile"
            break
        else
            echo "Invalid selection. Please try again."
        fi
    done
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

displayLogFile() {
    local logFile=$1
    if [ ! -f "$logFile" ]; then
        echo "Log file not found: $logFile"
        return 1
    fi

    echo "Select viewing mode:"
    select mode in "View entire file" "Watch new entries" "Exit"; do
        case $mode in
            "View entire file")
                less "$logFile"
                break
                ;;
            "Watch new entries")
                tail -f "$logFile"
                break
                ;;
            "Exit")
                return 0
                ;;
            *) 
                echo "Invalid option. Please try again."
                ;;
        esac
    done
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
