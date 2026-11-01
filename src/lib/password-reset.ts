// Small rules for the "forgot password" page. No React here, so they are easy to
// test.

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// What is wrong with the new password, or null when it is fine. The password is
// not trimmed: spaces are part of it.
export function checkNewPassword(
  password: string,
  repeat: string
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `The password can have at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  if (password !== repeat) {
    return "The two passwords are not the same.";
  }
  return null;
}

// Loose check before asking the backend: one @ and a dot in the domain
export function looksLikeEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export interface ResetProblem {
  message: string;
  // The code that was typed is wrong or no longer works: clear the box
  clearCode: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

// A message a shopper can act on, for an error from the reset calls. Errors
// carry the backend's { code, message } in `data`.
export function describeResetError(err: unknown): ResetProblem {
  const data = asRecord(asRecord(err).data);
  const code = typeof data.code === "string" ? data.code : "";

  switch (code) {
    case "invalid_code":
      return {
        message: "That code is not right or has expired. Send a new code and try again.",
        clearCode: true,
      };
    case "weak_password":
      return {
        message:
          typeof data.message === "string" && data.message
            ? data.message
            : `Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
        clearCode: false,
      };
    default:
      return {
        message: "Something went wrong. Please try again in a moment.",
        clearCode: false,
      };
  }
}
