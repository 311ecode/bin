# Function to list all Ollama models
ollamaListModels() {
    local endpoint="${1:-http://localhost:11434}"
    local url="${endpoint}/api/tags"

    response=$(curl -s -X GET "$url")

    # Check if the response is valid JSON
    if ! echo "$response" | jq empty > /dev/null 2>&1; then
        echo "Error: Invalid response from the server" >&2
        return 1
    fi

    # Extract and print model names
    echo "$response" | jq -r '.models[].name' | sort
}

# Function to interact with the Ollama API
ollamaC() {
  local model="$1"
  local message="$2"
  local endpoint="${3:-http://localhost:11434}"
  local url="${endpoint}/api/generate"

  # Logging setup
  local log_file=""
  local start_time=""
  local end_time=""
  local log_enabled=false

  if [[ -n "${OLLAMAC_DIR}" ]]; then
    log_enabled=true
    local date_hour=$(date +"%Y-%m-%d_%H")
    log_file="${OLLAMAC_DIR}/${date_hour}.log"
    mkdir -p "${OLLAMAC_DIR}"
    start_time=$(date +"%Y-%m-%d %H:%M:%S")
  fi

  # If no model is provided, list models and prompt for selection
  if [[ -z "$model" ]]; then
    echo "Available models:"
    readarray -t models < <(ollamaListModels "$endpoint")
    
    for i in "${!models[@]}"; do
      echo "$((i+1)). ${models[i]}"
    done
    
    echo
    while true; do
      read -p "Select a model (1-${#models[@]}): " selection
      if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#models[@]}" ]; then
        model="${models[$((selection-1))]}"
        break
      else
        echo "Invalid selection. Please enter a number between 1 and ${#models[@]}."
      fi
    done
  fi

  # If no message is provided, prompt for one
  if [[ -z "$message" ]]; then
    read -p "Enter your message: " message
  fi

  payload=$(cat <<EOF
{
    "model": "$model",
    "prompt": "$message",
    "stream": true
}
EOF
)

  local full_response=""
  local word_count=0
  local current_word=""
  local generation_start_time=$(date +%s.%N)

  curl -s -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$payload" | while IFS= read -r line
  do
      if [[ -n "$line" ]]; then
          # Use grep to extract the "response" value
          json_response=$(echo "$line" | grep -oP '(?<="response":")[^"]*')
          if [[ -n "$json_response" ]]; then
              # Process each character in the response
              while IFS= read -r -n1 char; do
                  full_response+="$char"
                  if [[ "$char" == $'\n' ]]; then
                      # Actual newline character
                      echo
                      if [[ -n "$current_word" ]]; then
                          ((word_count++))
                          current_word=""
                      fi
                  elif [[ "$char" == '\' ]]; then
                      # Potential escape sequence
                      read -r -n1 next_char
                      if [[ "$next_char" == 'n' ]]; then
                          # '\n' sequence, print actual newline
                          echo
                          if [[ -n "$current_word" ]]; then
                              ((word_count++))
                              current_word=""
                          fi
                      else
                          # Not '\n', print both characters
                          printf '%s%s' "$char" "$next_char"
                          current_word+="$char$next_char"
                      fi
                  elif [[ "$char" =~ [[:space:]] ]]; then
                      # Space character
                      printf '%s' "$char"
                      if [[ -n "$current_word" ]]; then
                          ((word_count++))
                          current_word=""
                      fi
                  else
                      # Regular character, print as-is
                      printf '%s' "$char"
                      current_word+="$char"
                  fi
              done < <(printf '%s' "$json_response")
          fi
          
          # Check if "done" is true
          if [[ "$line" == *'"done":true'* ]]; then
              echo  # Print a final newline
              if [[ -n "$current_word" ]]; then
                  ((word_count++))
              fi
              break
          fi
      fi
  done

  # Log if enabled
  if [[ "$log_enabled" == true ]]; then
    end_time=$(date +"%Y-%m-%d %H:%M:%S")
    local generation_end_time=$(date +%s.%N)
    local generation_time=$(echo "$generation_end_time - $generation_start_time" | bc)
    local words_per_second=$(echo "scale=2; $word_count / $generation_time" | bc)

    {
      echo "Start Time: $start_time"
      echo "End Time: $end_time"
      echo "Model: $model"
      echo "Message: $message"
      echo "Response:"
      echo "$full_response"
      echo "Word Count: $word_count"
      echo "Generation Time: $generation_time seconds"
      echo "Words per Second: $words_per_second"
      echo "----------------------------------------"
    } >> "$log_file"
  fi
}