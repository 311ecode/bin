#!/bin/bash
prepareVerserProcessInfo() {
    local processName=$1
    local configPath=$2
    local mode=$3
    
    local command="node \"$verserDir/configutationProcessor.mjs\" -c \"$configPath\" $mode"
    local identifier=$(generateVerserIdentifier "$processName" "$configPath" "$mode")
    
    echo "$identifier:::$command"
}

