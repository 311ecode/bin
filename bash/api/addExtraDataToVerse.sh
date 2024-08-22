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
    echo "$response" 
}

# vTestAddExtraDataToVerse
#
# Test function for the vApiAddExtraDataToVerse API endpoint.
# This function performs a series of operations to verify the correct
# behavior of adding, updating, and removing extra data for a verse.
#
# Usage:
#   vTestAddExtraDataToVerse [verse_number] [execution_group]
#
# Parameters:
#   verse_number:    (Optional) The number of the verse to test. Default is 1.
#   execution_group: (Optional) The execution group to use. Default is "basictranslation".
#
# Returns:
#   0 if all tests pass successfully, 1 if any test fails.
#
# Example:
#   vTestAddExtraDataToVerse 5 "customExecutionGroup"
#
# Note: This function requires jq for JSON processing and assumes the
# vApiAddExtraDataToVerse function is available in the current environment.
#
# Test Steps:
#   1. Adding Initial Data:
#      - Adds two key-value pairs: {"a": "pina", "b": "colada"}
#      - Verifies that both keys are present with correct values
#      - This tests the basic functionality of adding new data
#
#   2. Removing Data:
#      - Sets the value of 'a' to null: {"a": null}
#      - Checks that 'a' is removed from the data
#      - Verifies that 'b' still exists with its original value
#      - This tests the null-removal functionality and ensures it doesn't affect other data
#
#   3. Adding New Data:
#      - Adds a new key-value pair: {"c": "mango"}
#      - Checks that 'c' is added with the correct value
#      - Verifies that 'a' is still not present (was removed in step 2)
#      - Confirms that 'b' still exists with its original value
#      - This tests adding new data while maintaining the existing state
#
# Each step uses the vApiAddExtraDataToVerse function and parses the JSON response
# to verify the correct state of the extra data after each operation.

vTestAddExtraDataToVerse() {
    local verse_number=${1:-1}
    local execution_group=${2:-"basictranslation"}

    echo "Testing addExtraDataToVerse for verse $verse_number in execution group '$execution_group'"

    # Step 1: Add initial data
    echo "Step 1: Adding initial data..."
    local response=$(vApiAddExtraDataToVerse $verse_number $execution_group '{"a": "pina", "b": "colada"}')
    local extra_data=$(echo "$response" | jq )
    
    if [[ $(echo "$extra_data" | jq -r '.a') == "pina" && $(echo "$extra_data" | jq -r '.b') == "colada" ]]; then
        echo "✅ Initial data added successfully"
    else
        echo "❌ Failed to add initial data"
        return 1
    fi

    # Step 2: Remove 'a' by setting it to null
    echo "Step 2: Removing 'a' by setting it to null..."
    response=$(vApiAddExtraDataToVerse $verse_number $execution_group '{"a": null}')
    extra_data=$(echo "$response" | jq )
    
    if [[ $(echo "$extra_data" | jq 'has("a")') == false && $(echo "$extra_data" | jq -r '.b') == "colada" ]]; then
        echo "✅ 'a' removed successfully, 'b' retained"
    else
        echo "❌ Failed to remove 'a' or 'b' was affected"
        return 1
    fi

    # Step 3: Add new data
    echo "Step 3: Adding new data..."
    response=$(vApiAddExtraDataToVerse $verse_number $execution_group '{"c": "mango"}')
    extra_data=$(echo "$response" | jq )
    
    if [[ $(echo "$extra_data" | jq 'has("a")') == false && 
          $(echo "$extra_data" | jq -r '.b') == "colada" && 
          $(echo "$extra_data" | jq -r '.c') == "mango" ]]; then
        echo "✅ New data added successfully, previous state maintained"
    else
        echo "❌ Failed to add new data or previous state was not maintained"
        return 1
    fi

    echo "All tests passed successfully!"
    return 0
}
