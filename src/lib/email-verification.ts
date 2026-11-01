// Small rules for the "confirm your email" box. No React here, so they are easy
// to test.

export const CODE_LENGTH = 6;

// What the shopper typed, reduced to at most 6 digits. Pasting "123 456" or
// "123-456" works.
export function cleanCodeInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

export function isCodeComplete(value: string): boolean {
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(value);
}

// "Resend code", or "Resend code in 0:42" while the pause lasts
export function resendLabel(seconds: number): string {
  const left = Math.max(0, Math.ceil(Number.isFinite(seconds) ? seconds : 0));
  if (left === 0) return "Resend code";
  const minutes = Math.floor(left / 60);
  const rest = String(left % 60).padStart(2, "0");
  return `Resend code in ${minutes}:${rest}`;
}

// A wait in words: "45 seconds", "3 minutes"
export function waitInWords(seconds: number): string {
  const left = Math.max(1, Math.ceil(seconds));
  if (left < 60) return `${left} ${left === 1 ? "second" : "seconds"}`;
  const minutes = Math.ceil(left / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export interface VerificationProblem {
  message: string;
  // Seconds to wait before asking for a new code, when the backend said so
  retryAfter?: number;
  // The code that was typed is wrong or no longer works: clear the box
  clearCode: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

// A message a shopper can act on, for an error from the verification calls.
// Errors carry the backend's { code, message } in `data`.
export function describeVerificationError(err: unknown): VerificationProblem {
  const data = asRecord(asRecord(err).data);
  const code = typeof data.code === "string" ? data.code : "";

  switch (code) {
    case "invalid_format":
      return { message: "Enter the 6 digit code from the email.", clearCode: false };
    case "wrong_code": {
      const left = Number(data.attempts_left);
      const tries =
        Number.isInteger(left) && left > 0
          ? ` You have ${left} ${left === 1 ? "try" : "tries"} left.`
          : "";
      return { message: `That code is not right.${tries}`, clearCode: true };
    }
    case "code_expired":
      return {
        message: "This code has expired. Send a new code and try again.",
        clearCode: true,
      };
    case "no_code":
      return {
        message: "There is no code waiting. Send a new code first.",
        clearCode: true,
      };
    case "too_many_attempts":
      return {
        message: "Too many wrong tries. Send a new code and try again.",
        clearCode: true,
      };
    case "too_soon": {
      const wait = Number(data.retry_after);
      return {
        message: "A code was sent a moment ago. Check your inbox, or wait before asking again.",
        retryAfter: Number.isFinite(wait) && wait > 0 ? wait : undefined,
        clearCode: false,
      };
    }
    case "too_many": {
      const wait = Number(data.retry_after);
      const when = Number.isFinite(wait) && wait > 0 ? ` Try again in ${waitInWords(wait)}.` : "";
      return {
        message: `Too many codes were sent.${when}`,
        retryAfter: Number.isFinite(wait) && wait > 0 ? wait : undefined,
        clearCode: false,
      };
    }
    case "email_unavailable":
      return {
        message: "We could not send the email right now. Please try again in a moment.",
        clearCode: false,
      };
    default:
      return {
        message: "Something went wrong. Please try again in a moment.",
        clearCode: false,
      };
  }
}
