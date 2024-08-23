#!/bin/bash

# Function to conditionally print a message based on current working directory
printIfWithinDirectory() {
    if [ "$#" -lt 2 ]; then
        echo "Error: At least two parameters are required." >&2
        echo "Usage: print_if_in_directory <base_dir_or_message> <message> [additional_message_parts...]" >&2
        return 1
    fi

    local first_arg="$1"
    shift
    local message="$*"

    if [[ "$first_arg" == /* ]]; then
        # First argument is an absolute path, treat it as base_dir
        local base_dir="$first_arg"
        local cwd=$(pwd)
        if [[ "$cwd" == "$base_dir"* || "$cwd" == "$base_dir" ]]; then
            echo "$message"
        fi
    else
        # First argument is part of the message
        local cwd=$(pwd)
        if [[ "$cwd" == "$verserDir"* || "$cwd" == "$verserDir" ]]; then
            echo "$first_arg $message"
        fi
    fi
}
