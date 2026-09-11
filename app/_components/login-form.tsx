"use client";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true); setMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const supabase = createClient();
      // Direct to Supabase Auth: its rate limits apply to the visitor's IP.
      // No public signup or admin role is created by this form.
      const { error } = await supabase.auth.signInWithPassword({
        email: String(data.get("email") ?? "").trim(),
        password: String(data.get("password") ?? ""),
      });
      if (error) {
        setMessage(error.status === 429 ? "Too many attempts. Please wait before trying again." : "Unable to sign in. Check your details and try again.");
        return;
      }
      form.reset();
      // Fixed local destination; full navigation avoids stale prefetched auth UI.
      window.location.replace("/admin");
    } catch {
      setMessage("Sign-in is temporarily unavailable. Please try again later.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return <form onSubmit={submit} aria-describedby="login-status">
    <label htmlFor="login-email">Email</label>
    <input id="login-email" name="email" type="email" autoComplete="username" required maxLength={254} disabled={pending}/>
    <label htmlFor="login-password">Password</label>
    <input id="login-password" name="password" type="password" autoComplete="current-password" required maxLength={1024} disabled={pending}/>
    <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    <p id="login-status" role="status" aria-live="polite">{message}</p>
  </form>;
}
