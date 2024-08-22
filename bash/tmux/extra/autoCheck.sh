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

