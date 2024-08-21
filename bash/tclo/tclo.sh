#!/bin/bash

# Function to change to the directory of the script and run tclo
tcloVerser() {
  local paths=("$@")
  scwd
  cd "$verserDir"
  tclo "${paths[@]}"
  btcwd
}

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

tcloVFrontend() {
  tcloArrays tclo_frontend_paths
}

tcloVBackendAll() {
  tcloArrays tclo_verser_paths tclo_verser_test_paths 
}

tcloVAll() {
  tcloArrays tclo_verser_paths tclo_verser_test_paths tclo_frontend_paths tclo_bash_paths 
}

tcloVAllNoTests() {
  tcloArrays tclo_verser_paths tclo_frontend_paths tclo_bash_paths
}

# Function to run tclo with only bash paths
tcloVBash() {
  tcloArrays tclo_bash_paths
}

tclo_api_paths=(
  "configutationProcessor.mjs"
  "configurationProcessor"
  "lib/verseManipulation/enrichVerseJson.mjs"
  "lib/verseManipulation/.mjs"
  "test/enrichVerseJson.test.js"
  "test/addDataToExtradata.test.js"
)

tcloVApi() {
  tcloArrays tclo_api_paths
}