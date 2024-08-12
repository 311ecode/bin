import { performTranslations } from "../performTranslations.mjs";

/**
 * Conditionally performs translations based on the execution type.
 *
/**
 * @type {import('../performTranslations.mjs').TranslationFunction}
 *
 * @description
 * This function acts as a conditional wrapper around the `performTranslations` function.
 * It only executes the translation process if the `executionType` parameter is exactly 'translateAlong'.
 *
 * The function is designed to be flexible and potentially support different types of translation
 * executions in the future, although currently it only handles 'translateAlong'.
 *
 * If the `executionType` is not 'translateAlong', the function will do nothing and return immediately.
 *
 * When `executionType` is 'translateAlong', it calls `performTranslations` with all the other
 * parameters passed through unchanged. This allows for a conditional execution of translations
 * based on the specified execution type.
 *
 *
 * @see performTranslations
 */
export async function kindTranslateAlong(originPath, outputPath, promptPaths, realName, maximumInputLength, attemptToKeepTranslationsAtTheSameLine, name, originalMaxLine) {
  await performTranslations(originPath, outputPath, promptPaths, realName, maximumInputLength, attemptToKeepTranslationsAtTheSameLine, name, originalMaxLine);
}
