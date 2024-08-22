#!/bin/env bash
tcloArrays() {
    local all_contents=()

    # Loop through all provided array names
    for array_name in "$@"; do
        # Use indirect reference to get the array
        local array_ref="${array_name}[@]"
        local array_contents=("${!array_ref}")

        # Append the contents of this array to all_contents
        all_contents+=("${array_contents[@]}")
    done

    # Call tcloVerser with all accumulated contents
    tcloVerser "${all_contents[@]}"
}

# Function to change to the directory of the script and run tclo
tcloVerser() {
  local paths=("$@")
  scwd
  cd "$verserDir"
  tclo "${paths[@]}"
  btcwd
}