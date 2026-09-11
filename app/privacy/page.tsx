import Link from "next/link";

export const metadata = { title: "Privacidad" };

export default function PrivacyPage() {
  return <main id="main" className="legal-page">
    <p className="eyebrow">KEEANU</p>
    <h1>Privacidad</h1>
    <p>Cuando utilizas el formulario de contacto, Keeanu recibe tu nombre, correo electrónico y mensaje para responder tu solicitud.</p>
    <p>La información se guarda en una cuenta privada y solo está disponible para el administrador del portafolio. Se conserva únicamente durante el tiempo necesario para responder y atender la solicitud.</p>
    <p>Puedes pedir información, corrección o eliminación de tus datos de contacto respondiendo a un correo de Keeanu.</p>
    <Link className="text-link" href="/">Volver al portafolio</Link>
  </main>;
}
