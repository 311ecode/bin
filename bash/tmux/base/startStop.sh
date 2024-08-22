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

    # echo "DEBUG: In startProcess:"
    # echo "  kind: $kind"
    # echo "  name: $name"
    # echo "  sessionName: $sessionName"
    # echo "  command: $command"

    echo "Starting $kind process '$name' in tmux..."
    tmux new-session -d -s "$sessionName" "($command) 2>&1 | tee $logFile"
    local pid=$(tmux list-panes -t "$sessionName" -F '#{pane_pid}')
    
    writePid "$sessionName" $pid
    echo "$kind process '$name' started in tmux session '$sessionName' with PID: $pid"
    echo "Log file: $logFile"
    echo "To attach to this session, run: tmux attach-session -t $sessionName"
    echo "To view logs in real-time, run: tail -f $logFile"
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

# Function to restart a process
# @param {string} kind - Kind of process (e.g., "verser")
# @param {string} name - Name of the process
# @param {string} command - The command to run
restartProcess() {
    local kind=$1
    local name=$2
    local command=$3
    
    echo "Restarting $kind process '$name'..."
    stopProcess "$kind" "$name"
    sleep 2  # Wait for 2 seconds to ensure the process has fully stopped
    startProcess "$kind" "$name" "$command"
    echo "$kind process '$name' restarted."
}

