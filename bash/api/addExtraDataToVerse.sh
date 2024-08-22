#!/bin/bash

# Predefined extraData options in the global namespace.
vaed_default='{"a": 1}'
vaed_custom='{"customKey": "customValue"}'


# vApiAddExtraDataToVerse
#
# This function adds extra data to a verse using the API.
#
# Usage:
#   vApiAddExtraDataToVerse [verse_number] [execution_group] [extra_data]
#
# Parameters:
#   verse_number:    (Optional) The number of the verse to update. Default is 1.
#   execution_group: (Optional) The execution group. Default is "basictranslation".
#   extra_data:      (Optional) The extra data to add. Can be specified in multiple ways:
#                    - Using a predefined vaed_ variable (e.g., vaed_default, vaed_custom)
#                    - As a JSON string (must start with '{')
#                    - As a path to a JSON file
#                    Default is vaed_default.
#
# The parameters can be provided in any order. The function will interpret them based on their format.
#
# Examples:
#   vApiAddExtraDataToVerse 5 "customExecutionGroup" vaed_custom
#   vApiAddExtraDataToVerse 5 "customExecutionGroup" '{"key": "value"}'
#   vApiAddExtraDataToVerse 5 "customExecutionGroup" "/path/to/extra_data.json"
#   vApiAddExtraDataToVerse vaed_custom 5 "customExecutionGroup"
#
# Note: This function requires jq for JSON processing and curl for making API requests.


vApiAddExtraDataToVerse() {
    local verse_number=1
    local execution_group="basictranslation"
    local extra_data="$vaed_default"

    # Parse arguments
    for arg in "$@"; do
        if [[ "$arg" =~ ^[0-9]+$ ]]; then
            verse_number=$arg
        elif [[ "$arg" == vaed_* ]]; then
            extra_data="${!arg}"
        elif [[ "$arg" == {* ]]; then
            # Direct JSON input
            extra_data="$arg"
        elif [[ -f "$arg" ]]; then
            # JSON file input
            extra_data=$(cat "$arg")
        elif [[ "$arg" != vaed_* && "$arg" == *[!0-9]* ]]; then
            execution_group=$arg
        fi
    done

    local vApi_url="http://localhost:33333/api/addExtraDataToVerse"

    # Construct the full payload
    local payload=$(cat <<EOF
{
    "verseNumber": $verse_number,
    "executionGroup": "$execution_group",
    "extraData": $extra_data
}
EOF
)

    # Send the POST request
    local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$vApi_url")

    # Check the response
    if [[ "$response" == *"Extra data added successfully"* ]]; then
        echo "Successfully added extra data to verse $verse_number in execution group '$execution_group'"
        
        echo "$response" 
    else
        echo "Error: Failed to add extra data. Server response:" >&2
        echo "$response" >&2
        return 1
    fi
}