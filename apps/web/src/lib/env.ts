export const getRequiredEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`${name} must be set — see .env.example.`);
  }
  return value;
};
