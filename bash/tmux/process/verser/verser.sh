#!/bin/bash

# Function to generate a hash from parameters
# @param {...string} args - Any number of string arguments
# @return A hash string based on the input arguments
generateParameterHash() {
    local args="$*"
    echo -n "$args" | md5sum | awk '{print $1}'
}

generateVerserIdentifier() {
    local processName=$1
    shift
    echo "verser_${processName}_$(generateParameterHash "$@")"
}

prepareVerserProcessInfo() {
    local processName=$1
    local configPath=$2
    local mode=$3
    
    local command="node \"$verserDir/configutationProcessor.mjs\" -c \"$configPath\" $mode"
    local identifier=$(generateVerserIdentifier "$processName" "$configPath" "$mode")
    
    echo "$identifier:::$command"
}

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

# Verser-specific wrapper functions
startVerserProcess() {
    startProcessByProxy prepareVerserProcessInfo "$@"
}

stopVerserProcess() {
    stopProcessByProxy prepareVerserProcessInfo "$@"
}

restartVerserProcess() {
    restartProcessByProxy prepareVerserProcessInfo "$@"
}







listVerserTmuxSessions() {
    listKindTmuxSessions "verser"
}

stopAllVerserProcesses() {
    stopKindTmuxSessions "verser"
}

attachVerserTmuxSession() {
    local processName=$1
    shift
    local identifier=$(generateVerserIdentifier "$processName" "$@")
    attachTmuxSession "$identifier"
}