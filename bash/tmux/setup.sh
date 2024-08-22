
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