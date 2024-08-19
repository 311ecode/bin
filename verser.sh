#!/bin/bash

# Get the directory where this script is located
verserDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bashDir="$verserDir/bash"
processDir="$bashDir/process"
source "$processDir/tmux.sh"
source "$processDir/verser.sh"
source "$processDir/marai.sh"
source "$processDir/frontend.sh"

frontendDirReact="$verserDir/frontend/vite-react"


# Function to change to the directory of the script and run tclo
verserTclo() {
  scwd
  cd "$verserDir" 
  tclo verser.mjs processFiles.mjs jsconfig.json eslint.config.mjs translation lib test frontend/vite-react/src  frontend/vite-react/package.json frontend/vite-react/vite.config.js frontend/vite-react/index.html
  btcwd
}

# getCurrentDirectory
# Stores the current working directory in a global variable `scwdv`.
scwd() {
  scwdv="$(pwd)"
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

# Function to interact with the Ollama API
chat_with_ollama() {
  local model="$1"
  local message="$2"
  local endpoint="${3:-http://localhost:11434}"
  local url="${endpoint}/api/generate"

  payload=$(cat <<EOF
{
    "model": "$model",
    "prompt": "$message",
    "seed": 42
}
EOF
)

  response=$(curl -s -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$payload")

  full_response=""
  while IFS= read -r line; do
      if [[ -n "$line" ]]; then
          json_response=$(echo "$line" | jq -r '.response // empty')
          full_response+="$json_response"
          
          if [[ $(echo "$line" | jq -r '.done // false') == "true" ]]; then
              break
          fi
      fi
  done <<< "$response"

  echo "$full_response"
}

#!/bin/bash

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