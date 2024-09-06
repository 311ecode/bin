#!/bin/bash
attachVerserTmuxSession() {
    local processName=$1
    shift
    local identifier=$(generateVerserIdentifier "$processName" "$@")
    attachTmuxSession "$identifier"
}

