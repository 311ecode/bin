#!/bin/bash

generateVerserIdentifier() {
    local processName=$1
    shift
    echo "verser_${processName}_$(generateParameterHash "$@")"
}

startVerserProcess() {
    local processName=$1
    local configPath=$2
    local mode=$3
    
    local command="node \"$verserDir/configutationProcessor.mjs\" -c \"$configPath\" $mode"
    local identifier=$(generateVerserIdentifier "$processName" "$configPath" "$mode")
    startProcess "verser" "$identifier" "$command"
}

stopVerserProcess() {
    local processName=$1
    shift
    local identifier=$(generateVerserIdentifier "$processName" "$@")
    stopProcess "verser" "$identifier"
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