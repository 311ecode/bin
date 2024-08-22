#!/bin/bash

# Function to write PID to a file
# @param {string} identifier - Unique identifier for the process
# @param {number} pid - Process ID to write
writePid() {
    local identifier=$1
    local pid=$2
    echo $pid > "/tmp/${identifier}_pid"
}

# Function to read PID from a file
# @param {string} identifier - Unique identifier for the process
# @return {number} The stored PID, or empty if file doesn't exist
readPid() {
    local identifier=$1
    local pidFile="/tmp/${identifier}_pid"
    if [[ -f $pidFile ]]; then
        cat $pidFile
    fi
}
