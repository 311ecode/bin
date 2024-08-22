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