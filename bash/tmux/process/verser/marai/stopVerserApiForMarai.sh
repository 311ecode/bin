#!/bin/bash
stopVerserApiForMarai() {
  stopVerserProcess "api" "$MARAI_CONFIG_PATH" "--api"
}

