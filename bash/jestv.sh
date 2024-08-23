#!/bin/bash

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
