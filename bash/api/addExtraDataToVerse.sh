vApiAddExtraDataToVerse() {
    local verse_number=${1:-1}  # Default to verse 1 if no argument is provided
    local vApi_url="http://localhost:33333/api/addExtraDataToVerse"  # Using the provided port 33333

    # Validate input
    if [[ ! "$verse_number" =~ ^[0-9]+$ ]]; then
        echo "Error: Please provide a valid verse number as the first argument." >&2
        return 1
    fi

    # Prepare the JSON payload
    local payload=$(cat <<EOF
{
    "verseNumber": $verse_number,
    "extraData": {
        "a": 1
    }
}
EOF
)

    # Send the POST request
    local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$vApi_url")

    # Check the response
    if [[ "$response" == *"Extra data added successfully"* ]]; then
        echo "Successfully added extra data to verse $verse_number"
    else
        echo "Error: Failed to add extra data. Server response:" >&2
        echo "$response" >&2
        return 1
    fi
}