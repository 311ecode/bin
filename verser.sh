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


link_to_api() {
    local frontend_api_dir="$verserDir/frontend/vite-react/api"
    
    # Ensure the frontend/api directory exists
    mkdir -p "$frontend_api_dir"
    
    # Loop through all arguments
    for arg in "$@"; do
        local source_path="$verserDir/$arg"
        local target_path="$frontend_api_dir/$arg"
        
        # Check if the source path exists
        if [ ! -e "$source_path" ]; then
            echo "Error: $source_path does not exist" >&2
            continue
        fi
        
        # Create necessary parent directories for the symlink
        mkdir -p "$(dirname "$target_path")"
        
        # Create the symlink
        ln -s "$source_path" "$target_path"
        echo "Created symlink: $target_path -> $source_path"
    done
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

createSymlinkFunction "$verserDir" "./frontend/vite-react/api" "linkToFrontendFromVerser"

currentFile="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
ensureInBashrc "${currentFile}"

echo "Verser functions loaded."