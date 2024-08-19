#!/bin/bash

# Márai-specific configuration
MARAI_CONFIG_PATH='/home/imre/Documents/obsidian-docs/Language/Dutch/translations/Márai/Napló/1945-1957/verses/configNewStructure.yml'

# Márai-specific functions
startVerserApiForMarai() {
    startVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

startVerserCalculationsForMarai() {
    startVerserProcess "calculations" "$MARAI_CONFIG_PATH"
}

stopVerserApiForMarai() {
    stopVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

stopVerserCalculationsForMarai() {
    stopVerserProcess "calculations" "$MARAI_CONFIG_PATH"
}

attachVerserApiForMarai() {
    attachVerserTmuxSession "api" "$MARAI_CONFIG_PATH" "--api"
}

attachVerserCalculationsForMarai() {
    attachVerserTmuxSession "calculations" "$MARAI_CONFIG_PATH"
}

stopAllMaraiVerserProcesses() {
    stopVerserApiForMarai
    stopVerserCalculationsForMarai
}

attachAllMaraiVerserProcesses() {
    echo "Attaching to Márai API process..."
    attachVerserApiForMarai
    echo "Attaching to Márai calculations process..."
    attachVerserCalculationsForMarai
}