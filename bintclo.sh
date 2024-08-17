#!/bin/bash
source ~/.bashrc

# Get the directory where this script is located
verserDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"


# Function to change to the directory of the script and run tclo
verserTclo() {
  cwd=$(pwd)
  cd "$verserDir" || return
  tclo verser.mjs processFiles.mjs jsconfig.json eslint.config.mjs translation/ lib
  cd "$cwd" || return
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

ensureInBashrc
