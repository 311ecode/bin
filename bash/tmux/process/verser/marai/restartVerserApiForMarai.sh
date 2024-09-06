#!/bin/bash
restartVerserApiForMarai() {
  restartVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

