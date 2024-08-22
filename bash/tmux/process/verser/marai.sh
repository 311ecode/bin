#!/bin/bash

# Márai-specific configuration
MARAI_CONFIG_PATH='/home/imre/Documents/obsidian-docs/Language/Dutch/translations/Márai/Napló/1945-1957/verses/configNewStructure.yml'

## api start, stop, restart, attach ##
startVerserApiForMarai() {
  startVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

stopVerserApiForMarai() {
  stopVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

restartVerserApiForMarai() {
  restartVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

attachVerserApiForMarai() {
  attachVerserTmuxSession "api" "$MARAI_CONFIG_PATH" "--api"
}
## ********************************************************* ##

## calculations start, stop, restart, attach ##
startVerserCalculationsForMarai() {
  startVerserProcess "calculations" "$MARAI_CONFIG_PATH"
}

stopVerserCalculationsForMarai() {
  stopVerserProcess "calculations" "$MARAI_CONFIG_PATH"
}

restartVerserCalculationsForMarai() {
  restartVerserProcess "calculations" "$MARAI_CONFIG_PATH"
}

attachVerserCalculationsForMarai() {
  attachVerserTmuxSession "calculations" "$MARAI_CONFIG_PATH"
}
## ********************************************************* ##

stopAllMaraiVerserProcesses() {
  stopVerserApiForMarai
  stopVerserCalculationsForMarai
}
