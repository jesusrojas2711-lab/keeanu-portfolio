"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setStatus("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(data), startedAt }),
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        setStatus("Gracias. Recibimos tu mensaje.");
        form.reset();
        setStartedAt(Date.now());
      } else if (response.status === 400) setStatus("Revisa tu nombre, correo, fecha, celular y mensaje.");
      else if (response.status === 429) setStatus("Espera un momento antes de intentarlo otra vez.");
      else setStatus("El contacto no está disponible por el momento. Tu mensaje no fue enviado.");
    } catch { setStatus("No pudimos confirmar el envío. Inténtalo más tarde."); }
    finally { setPending(false); }
  }

  return <form onSubmit={submit} aria-describedby="contact-privacy contact-status">
    <label htmlFor="name">Nombre</label><input id="name" name="name" autoComplete="name" required maxLength={100}/>
    <label htmlFor="email">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="email" required maxLength={254}/>
    <div className="contact-fields-row"><div><label htmlFor="eventDate">Fecha del evento</label><input id="eventDate" name="eventDate" type="date" required /></div><div><label htmlFor="phone">Celular</label><input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={25}/></div></div>
    <label htmlFor="message">Cuéntanos de su historia</label><textarea id="message" name="message" required minLength={10} maxLength={3000} rows={7} placeholder="¿Qué les gustaría volver a sentir y recordar con el paso del tiempo?" />
    <div className="contact-trap" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" type="text" autoComplete="off" tabIndex={-1}/></div>
    <p id="contact-privacy" className="form-note">Usamos tus datos únicamente para responderte. <Link href="/privacy">Privacidad</Link></p>
    <button disabled={pending} type="submit">{pending ? "Enviando…" : "Enviar"}</button>
    <p id="contact-status" role="status" aria-live="polite">{status}</p>
  </form>;
}
