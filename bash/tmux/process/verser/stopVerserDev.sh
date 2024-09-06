#!/bin/bash
stopVerserDev() {
    stopVerserFrontend
    stopVerserApiForMarai

    listTmuxSessions
}

