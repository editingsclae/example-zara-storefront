"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { MailCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  confirmEmailVerification,
  getEmailVerification,
  sendEmailVerification,
} from "@/lib/medusa";
import {
  CODE_LENGTH,
  cleanCodeInput,
  describeVerificationError,
  isCodeComplete,
  resendLabel,
} from "@/lib/email-verification";

interface Props {
  email: string;
  // Called after the code was accepted and the orders were linked
  onVerified?: () => void;
}

// Asks the shopper to type the 6 digit code that was emailed. Shown while the
// email is not confirmed. Shopping is never blocked: an unconfirmed account can
// still place orders. Confirming links the orders placed as a guest with the
// same email to the account.
export default function EmailVerificationCard({ email, onVerified }: Props) {
  const { token, markEmailVerified } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"send" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // How long until a new code can be asked for, and whether one is waiting
  useEffect(() => {
    if (!token) return;
    let current = true;
    getEmailVerification(token)
      .then((status) => {
        if (!current) return;
        setWait(status.can_resend_in);
        setCodeSent(status.code_pending);
      })
      .catch(() => {
        // The buttons still work; the backend answers with the real limits
      });
    return () => {
      current = false;
    };
  }, [token]);

  // Counts the pause down, one second at a time
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const send = useCallback(async () => {
    if (!token || busy) return;
    setBusy("send");
    setError(null);
    setNotice(null);
    try {
      const res = await sendEmailVerification(token);
      if (res.verified) {
        await markEmailVerified();
        onVerified?.();
        return;
      }
      setCodeSent(true);
      setWait(res.can_resend_in ?? 60);
      setNotice(`We sent a code to ${email}.`);
      inputRef.current?.focus();
    } catch (err) {
      const problem = describeVerificationError(err);
      setError(problem.message);
      if (problem.retryAfter) setWait(Math.ceil(problem.retryAfter));
    } finally {
      setBusy(null);
    }
  }, [token, busy, email, markEmailVerified, onVerified]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || busy) return;
    if (!isCodeComplete(code)) {
      setError(`Enter the ${CODE_LENGTH} digit code from the email.`);
      return;
    }
    setBusy("confirm");
    setError(null);
    setNotice(null);
    try {
      await confirmEmailVerification(token, code);
      await markEmailVerified();
      onVerified?.();
    } catch (err) {
      const problem = describeVerificationError(err);
      setError(problem.message);
      if (problem.clearCode) setCode("");
      setBusy(null);
    }
  };

  return (
    <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <MailCheck size={20} className="text-amber-700 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900">Confirm your email</h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {codeSent
              ? `Enter the ${CODE_LENGTH} digit code we sent to ${email}.`
              : `We will email a ${CODE_LENGTH} digit code to ${email}.`}{" "}
            You can keep shopping without it. Confirming links your earlier
            guest orders to this account.
          </p>
        </div>
      </div>

      <form onSubmit={confirm} className="flex flex-col sm:flex-row gap-3">
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(cleanCodeInput(e.target.value))}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH + 4}
          placeholder="123456"
          aria-label={`${CODE_LENGTH} digit confirmation code`}
          className="w-full sm:w-44 px-3 py-2 border border-zinc-300 rounded-md bg-white text-center font-mono text-lg tracking-[0.35em] text-zinc-900 focus:outline-none focus:border-zinc-900"
        />
        <button
          type="submit"
          disabled={busy !== null || !isCodeComplete(code)}
          className="px-4 py-2 rounded-md bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === "confirm" ? "Checking..." : "Confirm"}
        </button>
        <button
          type="button"
          onClick={send}
          disabled={busy !== null || wait > 0}
          className="px-4 py-2 rounded-md border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy === "send"
            ? "Sending..."
            : codeSent || wait > 0
            ? resendLabel(wait)
            : "Send code"}
        </button>
      </form>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-xs text-rose-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {notice && !error && (
        <p role="status" className="flex items-start gap-2 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </p>
      )}
      <p className="text-[11px] text-zinc-500">
        Nothing in your inbox? Check the spam folder, then ask for a new code.
      </p>
    </div>
  );
}
