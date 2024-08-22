
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
