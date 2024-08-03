#!/usr/bin/env -S node --no-warnings
import fetch from 'node-fetch';

async function chatWithOllama(model, message, endpoint = "http://localhost:11434") {
    const url = `${endpoint}/api/generate`;
    
    const payload = {
        model: model,
        prompt: message,

        // Optional parameters
        // max_tokens: 1000,
        temperature: 0.8,
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
        
        // Get the raw text of the response
        const rawText = await response.text();
        console.log("Raw API response:");
        console.log(rawText);

        // Try to parse the JSON
        try {
            const data = JSON.parse(rawText);
            return data.response;
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            return `Error parsing response: ${parseError.message}`;
        }
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

// Example usage

const model = process.argv[2] || "gemma2:27b";

const message = process.argv[3] || `
Act as a C2-level target language translator. Translate the given text to the target language, preserving line numbers and structure. Use advanced vocabulary and natural target language sentence structures. Only provide the translation, no explanations.

Rules:
1. Preserve line numbers (e.g., |1.|, |2.|).
2. Don't translate lines with only dashes (e.g., |2.|---).
3. Keep names of places without target language translations unchanged.
4. Maintain sentence consistency.
5. Use C2-level target language vocabulary.

Translate the following to Dutch:

|160.|---
|161.| Cilinderem sértetlenül megmaradt.
|162.| A légnyomás feldobta egy törmelékdomb tetejére a lakószoba közepén.
|163.| Kissé poros, de máskülönben sértetlen.
|164.| Más kalapom nem is maradt.
|165.|---
|166.| A tengert adjátok vissza, a tengert!
|167.| És smaragdszín bort, orvietót vagy véres veronait!
|168.| És meleget, aranyszín meleget!
|169.| És várost, ahol a kövek között nők és költők élnek!
|170.| Minden mást vihettek, Isten hírével.
|171.|---
|172.| Kosztolányi[6] Rilke-tanulmányát olvasom.
|173.| A költők néha túloznak, Kosztolányi bevezetőben a szlávokról ír, e nagy költő, Rilke testi és szellemi őseiről.
|174.| Ezt írja a szlávokról: „Csak adni tudnak.
|175.| Elvenni mástól semmit.
|176.|---
|177.| E sorokat elnéző fejbólogatással olvasom.
|178.| E hetekben megismerkedtem szlávokkal, akik le tudták küzdeni alkati szemérmüket, és értettek ahhoz is, hogyan kell elvenni mástól valamit.
|179.|---
|180.| Mindene elpusztult az ostrom alatt, s most harsányan fenekedik: „Ezért fizetni fognak nekem!...
|181.| ” Szegény balek!
|182.| Még azt sem tudja, hogy mindezért ő fog fizetni – éppen ő, a kárvallott.
|183.|---

`;

chatWithOllama(model, message)
    .then(response => console.log(response))
    .catch(error => console.error(error));


