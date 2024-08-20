import { fileURLToPath } from "url";
import { processConcatenationTasks } from "./processConcatenationTasks.mjs";
import { processTranslationExecutions } from "./processTranslationExecutions.mjs";
import { startApiServer } from "./startApiServer.mjs";
import { 
  parseConfigArgument, 
  parseExecutionGroups, 
  resolveConfigPath, 
  readConfigFile, 
  getAllExecutionGroups } from "../configutationProcessor.mjs";

export async function processConfig(args) {
  const configPath = parseConfigArgument(args);
  const executionGroups = parseExecutionGroups(args);
  const isApiMode = args.includes('--api');

  if (!configPath) {
    console.error('Please provide a configuration file using -c or --config');
    process.exit(1);
  }

  const { resolvedConfigPath } = await resolveConfigPath(configPath);
  const rawConfig = await readConfigFile(resolvedConfigPath);
  let allExecutionGroups = await getAllExecutionGroups(rawConfig.jobs);

  // Filter execution groups if specified
  if (executionGroups.length > 0) {
    allExecutionGroups = allExecutionGroups.filter(group => executionGroups.includes(group));
  }

  if (isApiMode) {
    await startApiServer(rawConfig, allExecutionGroups, resolvedConfigPath);
  } else {
    // Process model executions
    for (const executionGroup of allExecutionGroups) {
      console.log(`Processing execution group: ${executionGroup}`);
      
      await processTranslationExecutions(resolvedConfigPath, executionGroup);
      await processConcatenationTasks(resolvedConfigPath, executionGroup);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processConfig(process.argv.slice(2)).catch(error => {
    console.error('An error occurred:', error);
    process.exit(1);
  });
}
