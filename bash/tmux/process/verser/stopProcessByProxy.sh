#!/bin/bash
stopProcessByProxy() {
    local prepareFn=$1
    shift  # Remove prepareFn from the argument list
    
    IFS=':::' read -r identifier command <<< $($prepareFn "$@")
    
    # Remove "verser_" prefix if it exists
    identifier=${identifier#verser_}
    
    stopProcess "verser" "$identifier"
}

