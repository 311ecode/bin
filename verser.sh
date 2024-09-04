#!/bin/bash
verserDir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source $RC_LOADER

verserHookPostfix="verser"

createGitHookVariables verser "addSymlinksToGitExclude" "removeSymlinksFromGitExclude"

loadVerser() {
    GIT_PROJECT_HOOK_NAME="$verserHookPostfix"
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


        # linkToFrontendFromVerser configurationProcessor
        # linkToFrontendFromVerser lib

        currentFile="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
        ensureInBashrc "${currentFile}"

        createSymlinkFunction $verserDir $frontendDirReact/api linkToFrontendFromVerser
        linkToFrontendFromVerser configurationProcessor
        linkToFrontendFromVerser lib
        # after
        echo "Verser functions loaded."
        # afterStateLoaded aaa
    fi
}

unloadVerser(){
    echo "Unloading Verser functions."
    unset GIT_PROJECT_HOOK_NAME
    echo "GIT_PROJECT_HOOK_NAME:" $GIT_PROJECT_HOOK_NAME
}


loadFilesInDirectory development "setupDirectoryHook, bindCtrlCombo";
loadFilesInDirectory core "initRc, addPath"

setupDirectoryHook "$verserDir" loadVerser unloadVerser

addPath "$verserDir/bin"

# initRc "#******** Verser functions begin ********#"
initRc "RC_LOADER=\${RC_LOADER} source /home/imre/bin/verser.sh"
initRc "everser() { e $verserDir; };  bindCtrlCombo x v everser;"
initRc "verserJzf() { cd $verserDir; jzf; }; bindCtrlCombo x x v verserJzf;"
# initRc "#********* Verser functions end *********#"



# createSymlinkWrapper() {
#     local source_dir="$1"
#     shift  # Remove the first argument (source_dir) from the argument list

#     local target_dir=$(mktemp -d)
#     local random_suffix=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 8 | head -n 1)
#     local inner_function_name="inner_symlink_func_${random_suffix}"
#     local outer_function_name="createSymlinkFunction_${random_suffix}"

#     # Create the inner function using createSymlinkFunction
#     createSymlink "$source_dir" "$target_dir" "$inner_function_name"

#     # Create the outer wrapper function
#     eval "
#     $outer_function_name() {
#         # Call the inner function with all received arguments
#         $inner_function_name \"\$@\"

#         # Print the target directory path to stdout
#         echo \"$target_dir\"
#     }
#     "

#     # Immediately use the created outer function with the remaining arguments
#     local result=$($outer_function_name "$@")

#     # Print the result (target directory path)
#     echo "Symlinks created in: $result"

#     if [ -n "${pathOnly+x}" ]; then
#         echo "${target_dir}"
#     else
#         if command -v code &> /dev/null; then
#             code "${target_dir}"
#             echo "Opened Visual Studio Code in ${target_dir}"
#         else
#             echo "Visual Studio Code (command 'code') not found. Please open ${target_dir} manually."
#         fi
#     fi
# }

# function createSymlinkWrapperTest() {
#     cls
#     path=$(pathOnly=t createSymlinkWrapper ./ /home/imre/bin/verser.sh /home/imre/bin/frontend/vite-react/index.html /home/imre/bin/frontend/vite-react/| tail -n 1)
#     echo  $path
#     zed $path
# }
#
# 1824  2024-08-28 04:41:29 create_symlink_wrapper . react.txt  configurationProcessor/apiRoutes/
