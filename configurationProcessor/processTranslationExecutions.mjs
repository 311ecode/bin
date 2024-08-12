import { logger } from "../lib/logger.mjs";
import { executeTranslationCycleNextUntranslatedItems } 
  from "./processTranslationExecutions/executeTranslationCycleNextUntranslatedItems.mjs";

export const log  = logger()();

export const processTranslationExecutions = (defaultModelExecutions)=>async (configPath, executionGroup) => {
  await executeTranslationCycleNextUntranslatedItems(defaultModelExecutions)(configPath, executionGroup);
}



