import type { Metadata } from "next";
import "./globals.css";
import Analytics from "./_components/analytics";
export const metadata: Metadata = {
  title: { default: "Keeanu Contreras | Fotógrafo de bodas en Sonora", template: "%s | Keeanu Contreras" },
  description: "Fotografía y video de bodas en Sonora, Sinaloa y otros destinos. Keeanu Contreras acompaña a cada pareja para conservar su historia con naturalidad.",
  keywords: ["fotógrafo de bodas en Sonora", "fotografía de bodas en Navojoa", "video de bodas en Sonora", "fotógrafo de bodas en Sinaloa", "Keeanu Contreras"],
  openGraph: { title: "Keeanu Contreras | Fotografía y video de bodas", description: "Historias reales, fotografiadas y grabadas con calma en Sonora, Sinaloa y donde nos lleve la historia.", locale: "es_MX", type: "website" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">Saltar al contenido</a>{children}<Analytics /></body></html>;
}
