#!/bin/bash
verserDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get the directory where this script is located

# loadFilesInDirectory development captureState;
# before "$verserDir"
# beforeStateLoaded aaa

loadVerse() {
    bashDir="$verserDir/bash"
    processDir="$bashDir"

    source $RC_LOADER
    if [ -z "$VERSER_LOAD_EXECUTED" ]; then
        loadAllRcFiles addPath development

        echo "Current directory is within $verserDir"
        createStateEngine $verserDir  "" "Verser"
        addStateVerser fuu faa
        # Add your commands here for when the condition is true
        VERSER_LOAD_EXECUTED=1

        while IFS= read -r -d '' script; do
          echo "$script" > /dev/null
          source "$script"
        done < <(find "$processDir" -type f -name "*.sh" -print0 | sort -z)

        frontendDirReact="$verserDir/frontend/vite-react"

        createSymlinkFunction "$verserDir" "./frontend/vite-react/api" "linkToFrontendFromVerser"

        currentFile="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
        ensureInBashrc "${currentFile}"

        # after
        echo "Verser functions loaded."
        # afterStateLoaded aaa
    fi
}
# loadAllRcFiles  
loadFilesInDirectory development "setupDirectoryHook, bindCtrlCombo";
setupDirectoryHook "$verserDir" loadVerse


verserJzf() {
  cd $verserDir
  jzf
}
bindCtrlCombo x x v verserJzf

everser() {
  e $verserDir
}

addPath "$verserDir/bin"  
