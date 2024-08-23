#!/bin/bash

# Get the directory where this script is located
verserDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bashDir="$verserDir/bash"
processDir="$bashDir"

while IFS= read -r -d '' script; do
  echo "$script" > /dev/null
  source "$script"
done < <(find "$processDir" -type f -name "*.sh" -print0 | sort -z)


frontendDirReact="$verserDir/frontend/vite-react"


# getCurrentDirectory
# Stores the current working directory in a global variable `scwdv`.
scwd() {
  scwdv="$(pwd)"
  cd "$verserDir" || return 1
}

# btcwd
# Changes the current working directory back to the value stored in `scwdv`.
# If `scwdv` is not set, it will print an error message and return 1.
btcwd() {
  if [ -z "$scwdv" ]; then
    echo "Error: scwdv is not set. Use scwd first." >&2
    return 1
  fi
  cd "$scwdv" || return 1
}

bintclo() {
  scwd
  verserTclo
  btcwd
}

# Function: jestV
# Description: Run Jest tests with configurable options including repeat count, delay between runs, and exec mode.
#
# Usage: jestV [options] [test_name]
#
# Options:
#   <number>        Number of times to repeat the test(s)
#   delay:<seconds> Delay in seconds between test runs (can be fractional)
#   exec:true       Use exec command to run tests (resets repeat count to 1)
#   <test_name>     Name of a specific test to run (optional)
#
# Examples:
#   jestV 3                     # Run all tests 3 times
#   jestV "my test"             # Run "my test" once
#   jestV 5 "my test"           # Run "my test" 5 times
#   jestV delay:2 "my test"     # Run "my test" once with 2 second delay
#   jestV 3 delay:0.5 "my test" # Run "my test" 3 times with 0.5 second delay
#   jestV exec:true "my test"   # Run "my test" once using exec command
#
# Notes:
#   - Options can be provided in any order
#   - If no repeat count is specified, tests run once
#   - If no delay is specified, there is no delay between runs
#   - If no test name is provided, all tests are run
#   - exec:true overrides repeat count and sets it to 1
jestV() {
    local repeat_count=1
    local test_name=""
    local delay=0
    local use_exec=false
    local total_duration=0
    local total_duration_with_delays=0
    local successful_runs=0
    local min_duration=""
    local max_duration=0

    # Parse arguments
    for arg in "$@"; do
        if [[ "$arg" =~ ^[0-9]+$ ]]; then
            repeat_count=$arg
        elif [[ "$arg" =~ ^delay:[0-9]+(\.[0-9]+)?$ ]]; then
            delay=${arg#delay:}
        elif [[ "$arg" == "exec:true" ]]; then
            use_exec=true
            repeat_count=1
        else
            test_name="$arg"
        fi
    done

    local overall_start_time=$(date +%s%N)
    for ((i=1; i<=repeat_count; i++)); do
        local start_time=$(date +%s%N)
        local command

        if [ -n "$test_name" ]; then
            command="node --experimental-vm-modules node_modules/jest/bin/jest.js -c ./jest.config.mjs -t \"$test_name\""
        else
            command="node --experimental-vm-modules node_modules/jest/bin/jest.js -c ./jest.config.mjs"
        fi

        if $use_exec; then
            exec $command
            # Note: The script will end here if exec is used
        else
            if ! eval $command; then
                echo "Test failed on run $i"
                break
            fi
        fi

        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        ((successful_runs++))
        total_duration=$((total_duration + duration))
        echo "Run $i: $duration ms"

        # Update min and max durations
        if [ -z "$min_duration" ] || [ "$duration" -lt "$min_duration" ]; then
            min_duration=$duration
        fi
        if [ "$duration" -gt "$max_duration" ]; then
            max_duration=$duration
        fi

        # Apply delay if not the last run
        if [ "$i" -lt "$repeat_count" ] && [ "$delay" != "0" ]; then
            echo "Waiting for $delay seconds before next run..."
            sleep "$delay"
        fi
    done

    local overall_end_time=$(date +%s%N)
    total_duration_with_delays=$(( (overall_end_time - overall_start_time) / 1000000 ))

    local test_description="all tests"
    if [ -n "$test_name" ]; then
        test_description="test '$test_name'"
    fi

    echo "Executed $successful_runs/$repeat_count runs of $test_description"
    
    if [ "$successful_runs" -gt 0 ]; then
        local average_duration=$((total_duration / successful_runs))
        echo "Successful runs: $successful_runs"
        echo "Average duration: $average_duration ms"
        echo "Minimum duration: $min_duration ms"
        echo "Maximum duration: $max_duration ms"
        echo "Total duration (without delays): $total_duration ms"
        echo "Total duration (including delays): $total_duration_with_delays ms"
        if [ "$delay" != "0" ]; then
            echo "Delay between runs: $delay seconds"
        fi
    else
        echo "No successful runs"
    fi
}

# Function to display help message
# @description Displays usage information for Verser functions
displayVerserHelp() {
    echo "Usage:"
    echo "  startVerserApi <verserDir> <configPath>"
    echo "  startVerserCalculations <verserDir> <configPath>"
    echo
    echo "Parameters:"
    echo "  verserDir   : Path to the Verser directory"
    echo "  configPath  : Path to the configuration file"
    echo
    echo "Use -h or --help with any function to display this help message."
}

# Function to check if help is requested
# @param {string} arg - The argument to check for help flag
# @return 0 if help is not requested, 1 if help is requested
checkVerserHelp() {
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        displayVerserHelp
        return 1
    fi
    return 0
}

# Function to check the number of parameters
# @param {number} provided - The number of provided parameters
# @param {number} required - The number of required parameters
# @return 0 if the parameter count is correct, 1 otherwise
checkVerserParams() {
    if [ $1 -ne $2 ]; then
        echo "Error: Incorrect number of parameters." >&2
        displayVerserHelp
        return 1
    fi
    return 0
}

everser() {
  e $verserDir
}

# end of effecive real functionality 
# this script makes sure it is sourced in .bashrc once it is run
ensureInBashrc() {
  local scriptPath
  
  if [ -n "$1" ]; then
    scriptPath="$1"
  else
    scriptPath="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  fi

  local bashrc="$HOME/.bashrc"
  
  # Check if the script is already sourced in .bashrc
  if ! grep -q "source $scriptPath" "$bashrc"; then
    echo "Sourcing script in .bashrc..."
    echo "source $scriptPath" >> "$bashrc"
  fi
}

currentFile="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
ensureInBashrc "${currentFile}"

echo "Verser functions loaded."