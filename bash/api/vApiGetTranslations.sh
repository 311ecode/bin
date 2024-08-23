vApiGetTranslations() {
    local execution_group="${1:-basictranslation}"
    local vApi_url="http://localhost:33333/api/translations/$execution_group"
    local response=$(curl -s "$vApi_url")
    local curl_status=$?

    if [ $curl_status -eq 0 ]; then
        echo "$response" | jq -C --indent 1
        local jq_status=$?
        if [ $jq_status -eq 0 ]; then
            echo "Successfully retrieved and formatted translations for execution group: $execution_group" > /dev/null
        else
            echo "Error: Failed to format JSON response." >&2
            return 1
        fi
    else
        echo "Error: Failed to retrieve API response. Curl exit status: $curl_status" >&2
        return 1
    fi
}
