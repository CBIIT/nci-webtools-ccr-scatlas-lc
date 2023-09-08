export const required = ["PORT", "APPLICATION_NAME", "DATABASE_PATH"];

export function validateEnvironment(env = process.env, vars = required) {
  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing environment variable: ${key}.`);
    }
  }
}
