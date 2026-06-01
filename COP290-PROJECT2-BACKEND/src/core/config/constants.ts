//process.env is used to access environment variables, note that we load them using dotenv in the main server file,not here.
// '??' operator: take value on the left if defined, else take right value.
export const PASSKEY = process.env.PASSKEY ?? 'Abhinav';
export const PORT = Number(process.env.PORT) ?? 3001;
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) ?? 12;
