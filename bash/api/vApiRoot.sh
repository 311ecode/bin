vApiRoot()
{
  local vApi_url="http://localhost:33333/api/"  # Using the provided port 33333

  # Capture curl output in a variable
  local response
  response=$(curl -s "$vApi_url")
  local curl_status=$?

  if [ $curl_status -eq 0 ]; then
    # If curl was successful, format and force color the JSON
    echo "$response" | jq -C --indent 1
    local jq_status=$?

    if [ $jq_status -eq 0 ]; then
      echo "Successfully retrieved and formatted API root response." > /dev/null
    else
      echo "Error: Failed to format JSON response." >&2
      return 1
    fi
  else
    echo "Error: Failed to retrieve API response. Curl exit status: $curl_status" >&2
    return 1
  fi
}