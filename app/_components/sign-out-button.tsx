"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function signOut() {
    if (pending) return;
    setPending(true); setMessage("");
    try {
      const { error } = await createClient().auth.signOut({ scope: "local" });
      if (error) { setMessage("Could not sign out. Please try again."); return; }
      window.location.replace("/login");
    } catch { setMessage("Could not sign out. Please try again."); }
    finally { setPending(false); }
  }
  return <div><button type="button" disabled={pending} onClick={signOut}>{pending ? "Signing out…" : "Sign out"}</button><p role="status">{message}</p></div>;
}
