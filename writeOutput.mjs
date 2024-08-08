import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname } from "path/posix";


export function writeOutput(content, outputPath) {
  if (outputPath === 'stdout') {
    console.log(content);
  } else if (outputPath) {
    // Ensure the directory exists
    const outputDir = dirname(outputPath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    // Write the content to the file
    writeFileSync(outputPath, content);
    console.log(`Output written to: ${outputPath}`);
  }
}
