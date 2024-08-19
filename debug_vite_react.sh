#!/bin/bash

# Get the directory where this script is located
meDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VSCODE_DEBUG="true"
source "$meDir/verser.sh"

startVerserFrontend