#!/bin/bash

# @brief Creates a function for symlinking files to a target directory.
# @description
#   This script defines a function `create_symlink_function` that dynamically
#   creates another function. The created function can be used to create
#   symlinks from a base directory to a specified target subdirectory.
#
# @author Imre Toth
# @version 1.0
# @date 2024-08-24

# @function createSymlinkFunction
# @description Creates a new function for symlinking files.
# @param {string} base_dir - The absolute path to the base directory.
# @param {string} target_subdir - The target subdirectory. Can be:
#   - An absolute path (must be a subdirectory of base_dir)
#   - A relative path starting with './'
#   - A simple relative path
# @param {string} function_name - The name of the function to be created.
# @return {number} 0 if successful, 1 if an error occurred.
# @example
#   createSymlinkFunction "$verserDir" "frontend/vite-react/api" "link_to_api"
#   createSymlinkFunction "/projects/myapp" "./backend/modules" "link_to_modules"
#   createSymlinkFunction "/home/user/project" "/home/user/project/dist/assets" "link_to_assets"
createSymlinkFunction() {
    local base_dir target_subdir function_name

    if [[ $# -ne 3 ]]; then
        echo "Error: Exactly three arguments are required." >&2
        echo "Usage: create_symlink_function <base_dir> <target_subdir> <function_name>" >&2
        return 1
    fi

    base_dir=$(realpath "$1")
    if [[ ! -d "$base_dir" ]]; then
        echo "Error: Base directory '$base_dir' does not exist or is not a directory." >&2
        return 1
    fi

    if [[ "$2" == /* ]]; then
        if [[ "$2" != "$base_dir"* ]]; then
            echo "Error: Target subdirectory must be within the base directory." >&2
            return 1
        fi
        target_subdir="${2#$base_dir/}"
    elif [[ "$2" == ./* ]]; then
        target_subdir="${2#./}"
    else
        target_subdir="$2"
    fi
    target_subdir="${target_subdir%/}"

    function_name="$3"
    if [[ "$function_name" != [a-zA-Z_][a-zA-Z0-9_]* ]]; then
        echo "Error: Invalid function name. It must start with a letter or underscore, followed by letters, numbers, or underscores." >&2
        return 1
    fi

    local function_def="
    $function_name() {
        local target_dir=\"$base_dir/$target_subdir\"
        
        mkdir -p \"\$target_dir\"
        
        for arg in \"\$@\"; do
            local source_path=\"\$(realpath \"\$arg\")\"
            local target_path=\"\$target_dir/\${source_path##*/}\"
            
            if [ ! -e \"\$source_path\" ]; then
                echo \"Error: \$source_path does not exist\" >&2
                continue
            fi
            
            if [ -e \"\$target_path\" ]; then
                if [ -L \"\$target_path\" ]; then
                    echo \"Warning: Symlink already exists at \$target_path. Skipping.\" >&2
                    continue
                else
                    echo \"Error: A non-symlink file already exists at \$target_path. Cannot create symlink.\" >&2
                    continue
                fi
            fi
            
            mkdir -p \"\$(dirname \"\$target_path\")\"
            
            ln -s \"\$source_path\" \"\$target_path\"
            echo \"Created symlink: \$target_path -> \$source_path\"
        done
    }"

    eval "$function_def"

    printIfWithinDirectory $base_dir "Created function '$function_name' for symlinking to $base_dir/$target_subdir"
    printIfWithinDirectory $base_dir "To use: $function_name <file_or_directory_paths>"
}
# @description Example usage of create_symlink_function
# Uncomment and modify these lines to use the function
# createSymlinkFunction "$HOME/projects" "frontend/api" "link_to_api"
# link_to_api file1.js file2.js subdirectory/file3.js