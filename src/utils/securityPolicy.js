export const MIN_PASSWORD_LENGTH = 12;
export function validateNewPassword(password, confirmation) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH || password.length > 128) return "Use a password between 12 and 128 characters.";
  if (confirmation !== undefined && password !== confirmation) return "Passwords do not match.";
  return null;
}
