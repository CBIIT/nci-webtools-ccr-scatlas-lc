import { fileURLToPath } from "url";

/**
 * Checks if the current module is the main module.
 * @param {ImportMeta} importMeta
 * @param {NodeJS.ProcessEnv} env
 * @returns
 */
export function isMainModule(importMeta, env = process.env) {
  const mainModulePath = env.pm_exec_path || process.argv[1];
  const currentModulePath = fileURLToPath(importMeta.url);
  return mainModulePath === currentModulePath;
}
