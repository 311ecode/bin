#!/bin/bash

# Function to change to the directory of the script and run tclo
tcloVerser() {
  local paths=("$@")
  scwd
  cd "$verserDir"
  tclo "${paths[@]}"
  btcwd
}

tcloVFrontend() {
  tcloVerser "${tclo_frontend_paths[@]}"
}

tcloVBackendAll() {
  tcloVerser "${tclo_verser_paths[@]}" "${tclo_verser_test_paths[@]}" 
}

tcloVAll() {
  tcloVerser "${tclo_verser_paths[@]}" "${tclo_verser_test_paths[@]}" "${tclo_frontend_paths[@]}" "${tclo_bash_paths[@]}" 
}

tcloVAllNoTests() {
  tcloVerser "${tclo_verser_paths[@]}" "${tclo_frontend_paths[@]}" "${tclo_bash_paths[@]}"
}

# Function to run tclo with only bash paths
tcloVBash() {
  tcloVerser "${tclo_bash_paths[@]}"
}

tclo_api_paths=(
  "configutationProcessor.mjs"
  "configurationProcessor"
  "lib/verseManipulation/enrichVerseJson.mjs"
  "lib/verseManipulation/addDataToExtradata.mjs"
  "test/enrichVerseJson.test.js"
  "test/addDataToExtradata.test.js"
)

tcloVApi() {
  tcloVerser "${tclo_api_paths[@]}"
}