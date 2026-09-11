"use client";
import { useCallback, useEffect, useState } from "react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
};

export default function ContactInbox() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/messages", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const body = await response.json() as { messages: ContactMessage[] };
      setMessages(body.messages);
      setNotice("");
    } catch { setNotice("Messages could not be loaded."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/messages", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ messages: ContactMessage[] }>;
      })
      .then((body) => { if (active) { setMessages(body.messages); setNotice(""); } })
      .catch(() => { if (active) setNotice("Messages could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function changeStatus(id: string, status: ContactMessage["status"]) {
    setNotice("");
    try {
      const response = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) throw new Error();
      setMessages((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } catch { setNotice("That change could not be saved."); }
  }

  const visible = messages.filter((item) => item.status !== "archived");
  return <section className="inbox" aria-labelledby="inbox-title">
    <div className="inbox-heading"><div><p className="eyebrow">Private inbox</p><h2 id="inbox-title">Enquiries</h2></div><button type="button" onClick={() => void load()} disabled={loading}>Refresh</button></div>
    <p className="muted">Messages sent through the contact form appear here.</p>
    {notice && <p role="status">{notice}</p>}
    {loading ? <p>Loading messages…</p> : visible.length === 0 ? <p className="empty-card">No enquiries yet.</p> :
      <div className="message-list">{visible.map((item) => <article className="message-card" key={item.id}>
        <header><div><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a></div><span>{item.status === "new" ? "New" : "Read"}</span></header>
        <p>{item.message}</p>
        <footer><time dateTime={item.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</time><div>{item.status === "new" && <button type="button" onClick={() => void changeStatus(item.id, "read")}>Mark read</button>}<button type="button" onClick={() => void changeStatus(item.id, "archived")}>Archive</button></div></footer>
      </article>)}</div>}
  </section>;
}
