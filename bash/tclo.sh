#!/bin/bash

# Define arrays for different sets of paths
verser_paths=(
  "verser.mjs"
  "processFiles.mjs"
  "jsconfig.json"
  "eslint.config.mjs"
  "translation"
  "lib"
)

verser_test_paths=(
  "test"
)

bash_paths=(
  "verser.sh"
  "bash"
)

frontend_paths=(
  "frontend/vite-react/src"
  "frontend/vite-react/package.json"
  "frontend/vite-react/index.html"
  "frontend/vite-react/vite.config.js"
  "frontend/vite-react/index.html"
)

# Function to change to the directory of the script and run tclo
tcloVerser() {
  local paths=("$@")
  scwd
  cd "$verserDir"
  tclo "${paths[@]}"
  btcwd
}

tcloVerserAll() {
  tcloVerser "${verser_paths[@]}" "${verser_test_paths[@]}" "${frontend_paths[@]}" "${bash_paths[@]}" 
}

tcloVerserAllNoTests() {
  tcloVerser "${verser_paths[@]}" "${frontend_paths[@]}" "${bash_paths[@]}"
}

tcloVerserTest() {
  tcloVerser "${verser_test_paths[@]}"
}

# Function to run tclo with only bash paths
tcloVerserBash() {
  tcloVerser "${bash_paths[@]}"
}
