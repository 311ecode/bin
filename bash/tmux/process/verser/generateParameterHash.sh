#!/bin/bash
generateParameterHash() {
    local args="$*"
    echo -n "$args" | md5sum | awk '{print $1}'
}

