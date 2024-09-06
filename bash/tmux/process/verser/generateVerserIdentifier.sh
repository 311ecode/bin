#!/bin/bash
generateVerserIdentifier() {
    local processName=$1
    shift
    echo "verser_${processName}_$(generateParameterHash "$@")"
}

