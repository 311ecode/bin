#!/bin/bash
verserDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source $RC_LOADER

verserHookPostfix="verser"

createGitHookVariables verser "addSymlinksToGitExclude" "removeSymlinksFromGitExclude"

verserDebug(){
  createConditionalFunction  "echo" "DEBUG_VERSER" "debuggerVerser"  
  debuggerVerser "$@"  
}

loadVerser() {
    GIT_PROJECT_HOOK_NAME="$verserHookPostfix"
    bashDir="$verserDir/bash"
    processDir="$bashDir"

    source $RC_LOADER
    if [ -z "$VERSER_LOAD_EXECUTED" ]; then
        loadAllRcFiles addPath development
        verserDebug "Current directory is within $verserDir"
        createStateEngine $verserDir  "" "Verser"
        addStateVerser fuu faa
        # Add your commands here for when the condition is true
        VERSER_LOAD_EXECUTED=1

        while IFS= read -r -d '' script; do
          echo "$script" > /dev/null
          source "$script"
        done < <(find "$processDir" -type f -name "*.sh" -print0 | sort -z)

        frontendDirReact="$verserDir/frontend/vite-react"


        # linkToFrontendFromVerser configurationProcessor
        # linkToFrontendFromVerser lib

        currentFile="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
        ensureInBashrc "${currentFile}"

        createSymlinkFunction $verserDir $frontendDirReact/api linkToFrontendFromVerser
        linkToFrontendFromVerser configurationProcessor
        linkToFrontendFromVerser lib
        # after
        verserDebug "Verser functions loaded."
        # afterStateLoaded aaa
    fi
}

unloadVerser() {
    verserDebug "Unloading Verser functions."
    if [ "$GIT_PROJECT_HOOK_NAME" = "$verserHookPostfix" ]; then
        unset GIT_PROJECT_HOOK_NAME
        verserDebug "GIT_PROJECT_HOOK_NAME unset."
    else
        verserDebug "GIT_PROJECT_HOOK_NAME not unset: $GIT_PROJECT_HOOK_NAME"
    fi
}

loadFilesInDirectory development "setupDirectoryHook, bindCtrlCombo";
loadFilesInDirectory core "initRc, addPath"

setupDirectoryHook "$verserDir" loadVerser unloadVerser

# initRc "#******** Verser functions begin ********#"
initRc "RC_LOADER=\${RC_LOADER} source /home/imre/bin/verser.sh"
initRc "everser() { e $verserDir; };  bindCtrlCombo x v everser;"
initRc "verserJzf() { cd $verserDir; jzf; }; bindCtrlCombo x x v verserJzf;"
# initRc "#********* Verser functions end *********#"
