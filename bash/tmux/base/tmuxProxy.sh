
# Proxy function to start a process
startProcessByProxy() {
    local prepareFn=$1
    shift  # Remove prepareFn from the argument list
    
    IFS=':::' read -r identifier command <<< $($prepareFn "$@")
    
    # Remove "verser_" prefix if it exists
    identifier=${identifier#verser_}
    
    # Remove leading "::" from the command if it exists
    command=${command#::}
        
    startProcess "verser" "$identifier" "$command"
}

# Proxy function to stop a process
stopProcessByProxy() {
    local prepareFn=$1
    shift  # Remove prepareFn from the argument list
    
    IFS=':::' read -r identifier command <<< $($prepareFn "$@")
    
    # Remove "verser_" prefix if it exists
    identifier=${identifier#verser_}
    
    stopProcess "verser" "$identifier"
}

# Proxy function to restart a process
restartProcessByProxy() {
    local prepareFn=$1
    shift  # Remove prepareFn from the argument list
    
    IFS=':::' read -r identifier command <<< $($prepareFn "$@")
    
    # Remove "verser_" prefix if it exists
    identifier=${identifier#verser_}
    
    # Remove leading "::" from the command if it exists
    command=${command#::}
    
    restartProcess "verser" "$identifier" "$command"
}
