#!/usr/bin/env -S node --no-warnings
import fetch from 'node-fetch';

const extraDefaultPayloads = {
  "gemma2:27b": {
    // model: "gemma2:27b",
    // prompt: "<start_of_turn>user You are a professional literary translator. Translate the following text from [source language] to [target language], maintaining the original style, tone, and nuances: [Your text here]<end_of_turn>",
    max_tokens: 4096,  // Adjust based on your text length, up to the model's limit
    temperature: 0.7,  // A balance between creativity and accuracy
    top_p: 0.9,        // Default, works well for most literary translations
    top_k: 100,        // Increased for wider vocabulary selection
    repeat_penalty: 1.15,  // Slightly increased to reduce repetition in longer texts
    presence_penalty: 0.2, // Encourages coverage of different elements in the text
    frequency_penalty: 0.2, // Encourages use of a diverse vocabulary
    stop: ["<start_of_turn>", "<end_of_turn>"],  // As specified in the model parameters
    seed: 42  // Set a specific seed for reproducibility, change as needed
  }
}

export async function chatWithOllama(model, message, endpoint = "http://localhost:11434") {
  const url = `${endpoint}/api/generate`;

  const payload = {
    model: model,
    prompt: message,
    seed: 42,
    ...(() => extraDefaultPayloads[model] || {})()
  };

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
    return `Error: ${error.message}`;
  }
}
// Example usage

const model = process.argv[2]
  // || "qwen2:0.5b"
  || "gemma2:27b";

//  

const message = process.argv[3] ||
  // 'hello' || 
  `
Act as a C2-level target language translator. Translate the given text to the target language, preserving line numbers and structure. Use advanced vocabulary and natural target language sentence structures. Only provide the translation, no explanations.

Rules:
1. Preserve line numbers (e.g., |1.|, |2.|).
2. Don't translate lines with only dashes (e.g., |2.|---).
3. Keep names of places without target language translations unchanged.
4. Maintain sentence consistency.
5. Use C2-level target language vocabulary.

Translate the following to Dutch:

|183.|---
|184.| A városban.
|185.| Első életjelek: a postás leveleket osztogat az utcán.
|186.| A kapuk alatt cérnát, gyertyát, kolbászt, zsírt, pogácsát árulnak.
|187.| Temetés: két ember deszkán viszi a koporsót, nyomában a gyászolók.
|188.| A póthídról elzavarnak az oroszok.
|189.| Csónakkal megyek át a Dunán.
|190.| A házroncsok között állati tetemek, felületesen elföldelt emberi hullák bűzlenek a tavaszi nap melegében.
|191.| A vánszorgó, csomagokat, batyukat cipelő tömeg mintha céltalanul ténferegne; de a valóságban Pest sistereg az élettől.
|192.| Hevenyészett üzletekben, kapuk alatt és az úttesten mindent árulnak, olyan cikkeket is, melyeket már évek óta nem láttunk: malac, marha és borjú, Chanel-parfüm, cipőpaszta, csokoládé, igazi tea és kávé, kockacukor, női ruhaanyagok, harisnya, cipő...
|193.| A gettóból kimenekült zsidóság nagy erővel tevékenykedik, hozza az árut; néhány feketéző kereskedő ezekben a hetekben megmentette Pestet az éhhaláltól.
|194.| Az árak inflációsak.
|195.| Valószínűleg csak azok vásárolnak, akik sok holmit loptak össze az ostrom alatt.
|196.| És az éhesek, akik eladják maradék motyójukat, hogy ehessenek.
|197.| Villany is lenne már, ha az oroszok engednék.
|198.| A romok között shopping-hangulat.
|199.| Az utcasarkon viszontlátások; az emberek gépiesen darálják élményeiket.
|200.| Mindenkivel „ugyanaz” történt: éjjel bejöttek a nyilasok a házba, megették a lekvárokat és megölték a nagymamát.
|201.| És ez a groteszk monotonság borzalmasan igaz.
|202.|---
|203.| Április vége.
|204.| A kert olyan most, mint egy japán ünnep.
|205.|---

`;

// chatWithOllama(model, message)
//   .then(response => console.log(response))
//   .catch(error => console.error(error));


