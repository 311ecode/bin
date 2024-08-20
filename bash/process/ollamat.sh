OLLAMA_QUEUE_FILE="/tmp/ollamat.queue"

ollamaT() {
    local kind="ollama"
    local prefix="session_"
    local args="$*"

    # Function to get the next available session number
    get_next_session_number() {
        local max_num=0
        while read -r session; do
            if [[ $session =~ ${kind}_${prefix}([0-9]{3})$ ]]; then
                num=${BASH_REMATCH[1]}
                if ((num > max_num)); then
                    max_num=$num
                fi
            fi
        done < <(tmux list-sessions -F '#{session_name}' 2>/dev/null)
        printf "%03d" $((max_num + 1))
    }

    local name="${prefix}$(get_next_session_number)"
    local full_name="${kind}_${name}"

    # Add this request to the queue
    echo "$full_name $args" >> "$OLLAMA_QUEUE_FILE"

    # Function to process the queue
    process_queue() {
        while true; do
            # Read the first line of the queue without removing it
            local line=$(head -n 1 "$OLLAMA_QUEUE_FILE")
            if [[ -z "$line" ]]; then
                # Queue is empty, exit the loop
                break
            fi

            local current_session=${line%% *}
            local current_args=${line#* }

            # Start the process
            echo "Starting session $current_session..."
            tmux new-session -d -s "$current_session" bash
            
            # Check if we have at least 2 parameters
            if [[ $(echo "$current_args" | wc -w) -ge 2 ]]; then
                # Non-interactive mode
                tmux send-keys -t "$current_session" "source ~/.bashrc && ollamaC $current_args; tmux wait-for -S ${current_session}_done" C-m
                
                local pid=$(tmux list-panes -t "$current_session" -F '#{pane_pid}' 2>/dev/null)
                if [[ -n "$pid" ]]; then
                    echo "Session $current_session started with PID: $pid"
                    echo "To attach to this session, run: tmux attach-session -t $current_session"
                    echo "To stop this session, run: stopProcess $kind ${current_session#${kind}_}"
                else
                    echo "Failed to start session $current_session"
                fi

                # Wait for the process to finish
                tmux wait-for "${current_session}_done"
            else
                # Interactive mode
                tmux send-keys -t "$current_session" "source ~/.bashrc && ollamaC $current_args" C-m
                echo "Session $current_session started in interactive mode."
                echo "Attaching to the session now. Use 'Ctrl-b d' to detach when done."
                tmux attach-session -t "$current_session"
                
                # After detaching, mark the session as done
                tmux wait-for -S "${current_session}_done"
            fi
            
            # Remove this session from the queue
            sed -i '1d' "$OLLAMA_QUEUE_FILE"
        done
    }

    # Start processing the queue if it's not already running
    if ! pgrep -f "bash.*process_queue" > /dev/null; then
        process_queue &
    fi

    echo "Request queued as $full_name. It will start when it's at the front of the queue."
}