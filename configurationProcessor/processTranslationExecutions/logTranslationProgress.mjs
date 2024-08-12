import { getMaxLineNumber } from "../../translation/processTranslation.mjs";
import { log } from "../processTranslationExecutions.mjs";

export function logTranslationProgress(name, realName, originPath, outputPath, language, filePostfix, maximumInputLength, sameLineFactor, originalMaxLine, promptPaths) {
  log(`\nProcessing translation for ${name} (using model ${realName}):`);
  log(`  Origin: ${originPath}`);
  log(`  Output: ${outputPath}`);
  log(`  Language: ${language}`);
  log(`  File Postfix: ${filePostfix}`);
  log(`  Maximum Input Length: ${maximumInputLength}`);
  log(`  Same Line Factor: ${sameLineFactor}`);
  log(`  Current progress: ${getMaxLineNumber(outputPath)} / ${originalMaxLine} lines`);
  log(`  Adjusted progress: ${(getMaxLineNumber(outputPath) / sameLineFactor).toFixed(2)} lines`);
  log(`  Prompts:`);
  promptPaths.forEach(path => log(`    - ${path}`));
}
