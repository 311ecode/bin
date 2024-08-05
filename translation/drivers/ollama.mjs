#!/usr/bin/env -S node --no-warnings
import fetch from 'node-fetch';
import { logger } from '../../lib/logger.mjs';

const log = logger()();

export async function chatWithOllama(model, message, endpoint = "http://localhost:11434") {
  const url = `${endpoint}/api/generate`;

  const payload = {
    model: model,
    prompt: message,
    seed: 42,
    ...(() => extraDefaultPayloads && extraDefaultPayloads[model] || {})()
  };

  log({ payload }, 'Ohhmm');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let fullResponse = '';

    // Use response.text() to get the full response as a string
    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.trim() !== '') {
        try {
          const jsonResponse = JSON.parse(line);
          fullResponse += jsonResponse.response;
          if (jsonResponse.done) {
            break;
          }
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
        }
      }
    }

    return fullResponse;
  } catch (error) {
    log('Error in translation:', error);
    return `Error: ${error.message}`;
  }
}


const extraDefaultPayloads = {  
  // "gemma2:27b": {
  //   "temperature": 0.8,
  //   "mirostat": 0,
  //   "mirostat_eta": 0.1,
  //   "mirostat_tau": 5,
  //   "top_k": 40,
  //   "top_p": 0.9,
  //   "repeat_penalty": 1.1,
  //   "repeat_last_n": 64,
  //   "tfs_z": 1,
  //   "num_ctx": 2048,
  //   "num_batch": 512,
  //   "num_keep": 24,
  //   "num_predict": 128
  // }
}
