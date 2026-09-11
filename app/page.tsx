import Image from "next/image";
import Link from "next/link";
import ContactForm from "./_components/contact-form";
import { publicProjects } from "./_lib/public-projects";
import { publicMediaUrl } from "./_lib/media-url";

export const dynamic = "force-dynamic";

const categories = [
  { id: "weddings", number: "01", title: "Bodas", text: "La emoción, los gestos y todo lo que sucede entre un momento y otro." },
  { id: "films", number: "02", title: "Video de boda", text: "Películas honestas para volver a escuchar las voces, la música y la emoción del día." },
  { id: "commercial", number: "03", title: "Comercial", text: "Imágenes con intención para marcas, personas y proyectos creativos." },
] as const;

const packages = [
  { number: "01", title: "Colección Uno", text: "Dos fotógrafos y dos videógrafos. Incluye save the date, maquillaje, first look, sesión de novios, sesión familiar, misa y recepción. Entrega de una selección de recuerdos con edición de luz y color, archivos en alta resolución y galería web." },
  { number: "02", title: "Colección Dos", text: "Un fotógrafo y un videógrafo. Incluye save the date, sesión de novios, first look, misa y recepción. Reciben una selección editada de fotografía y video, archivos en alta resolución y galería web." },
  { number: "03", title: "Colección Tres", text: "Un fotógrafo y un videógrafo para acompañar la sesión de novios, la misa y la recepción. Incluye selección editada de fotografía y video, archivos en alta resolución y galería web." },
];

const faqs = [
  ["¿En qué lugares trabajan?", "Keeanu nace en Sonora y cubre bodas en Navojoa, Hermosillo, Ciudad Obregón y otras ciudades del estado. También viajamos a Sinaloa y a otros destinos cuando la historia nos lleva ahí."],
  ["¿Con cuánto tiempo debemos reservar?", "Lo ideal es escribirnos en cuanto tengan fecha. Así podemos acompañarlos con calma, orientarles sobre la cobertura y apartar el día sin prisas."],
  ["¿Podemos contratar fotografía y video?", "Sí. Podemos contar su día con fotografías, video de boda o ambos. La propuesta se construye según lo que quieren volver a sentir y recordar."],
  ["¿Cuándo recibimos nuestro material?", "El tiempo depende de la cobertura y de la propuesta elegida. Al conversar con ustedes les explicamos el proceso y las fechas de entrega con claridad."],
  ["¿Nos ayudan a planear las fotos?", "Sí. Los guiamos cuando hace falta, pero cuidamos que los momentos se sientan naturales. La intención es acompañar, no convertir la boda en una sesión rígida."],
  ["¿Qué pasa si todavía no sabemos qué paquete elegir?", "No tienen que llegar con todo decidido. Podemos platicar sobre su día, entender qué les importa y recomendarles una forma de conservarlo sin agregar cosas que no necesitan."],
];

const testimonials = [
  ["“Nos sentimos acompañados desde la primera conversación. El día pasó volando, pero las fotografías nos regresan a cada instante.”", "Pareja Keeanu · Sonora"],
  ["“No tuvimos que actuar frente a la cámara. Keeanu estuvo atento a todo lo que estaba pasando y eso se nota en cada imagen.”", "Pareja Keeanu · Sinaloa"],
  ["“La entrega cuenta nuestra historia completa: los nervios, la familia, las risas y lo que vivimos cuando nadie estaba posando.”", "Pareja Keeanu · Navojoa"],
];

export default async function Home() {
  const projects = await publicProjects();
  const heroAssets = projects.flatMap((project) => project.assets.map((asset) => ({ ...asset, projectTitle: project.title }))).slice(0, 3);
  const featured = heroAssets[0];
  const secondaryFeatured = heroAssets.find((asset) => asset.id !== featured?.id);

  return <div className="site-shell">
    <div className="availability-banner" role="status"><span>Agenda abierta · 2026 — 2027</span><a href="#contact">Conversemos sobre su fecha <b>↗</b></a></div>
    <header className="site-header">
      <Link className="site-logo" href="/" aria-label="Keeanu, inicio"><span>K</span><small>Fotografía & cine</small></Link>
      <div className="header-line" aria-hidden="true" />
      <nav className="site-nav" aria-label="Navegación principal"><a href="#trabajo">Portafolio</a><a href="#contact">Contacto</a><details className="site-menu"><summary>Menú <span>+</span></summary><div><Link href="/info/proceso">Cómo trabajamos</Link><Link href="/info/paquetes">Paquetes</Link><Link href="/info/faq">Preguntas frecuentes</Link><Link href="/info/testimonios">Testimonios</Link></div></details><span className="language-switch"><Link href="/">ES</Link><span>/</span><Link href="/en">EN</Link></span></nav>
    </header>

    <main id="main">
      <section className="editorial-hero" aria-labelledby="hero-title">
        <div className="hero-photo hero-photo-left">{featured ? <Image priority unoptimized src={publicMediaUrl(featured.object_path, featured.id)} alt={featured.alt_text || "Fotografía destacada de Keeanu"} fill sizes="(max-width: 760px) 82vw, 26vw" /> : <span>Historias reales</span>}</div>
        <div className="hero-copy"><p className="eyebrow">Keeanu Contreras · Fotografía & video</p><p className="hero-mark" aria-hidden="true">K</p><h1 id="hero-title">Fotografía<br/>que se siente.</h1><p>Recuerdos honestos, luz natural y una mirada cercana para contar lo que de verdad importa.</p><a className="arrow-link" href="#trabajo">Descubrir el trabajo <span>↘</span></a></div>
        <div className="hero-photo hero-photo-right">{secondaryFeatured ? <Image unoptimized src={publicMediaUrl(secondaryFeatured.object_path, secondaryFeatured.id)} alt="" fill sizes="(max-width: 760px) 54vw, 23vw" /> : <span>Para siempre</span>}</div>
        <p className="hero-place">México · Disponible para viajar</p>
      </section>

      <section id="manifiesto" className="manifesto"><p className="section-index">01 / Nuestra mirada</p><div><p className="manifesto-lead">Las mejores fotografías no interrumpen el momento.</p><p className="manifesto-text">Lo acompañan. Keeanu documenta cada historia con calma, intención y sensibilidad: la luz que cambia, las manos que se buscan, la risa que nadie planeó.</p></div></section>

      <section id="trabajo" className="portfolio-section">
        <header className="section-heading"><p className="section-index">02 / Portafolio</p><h2>Historias<br/><em>seleccionadas</em></h2><p>Una colección de momentos vividos, no fabricados.</p></header>
        <div className="featured-grid">{projects.length ? projects.map((project, index) => <Link className={`editorial-card card-${index % 3}`} key={project.id} href={`/work/${project.slug}`}><div className="card-image">{project.assets[0] && <Image unoptimized src={publicMediaUrl(project.assets[0].object_path, project.assets[0].id)} alt={project.assets[0].alt_text || project.title} fill sizes="(max-width: 760px) 90vw, 48vw" />}</div><div className="card-meta"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{project.title}</h3><p>{categories.find((category) => category.id === project.category)?.title}</p></div><b>↗</b></div></Link>) : <p className="portfolio-empty">Las primeras historias llegarán pronto.</p>}</div>
      </section>

      <section className="video-feature" aria-labelledby="video-title"><div className="video-feature-copy"><p className="section-index">03 / Una película</p><h2 id="video-title">Volver a escuchar<br/><em>ese día.</em></h2><p>Una muestra de cómo preservamos las voces, los abrazos y la emoción tal como sucedieron.</p></div><div className="video-frame"><iframe src="https://drive.google.com/file/d/1JgU8JGJLA6LILywn2z-tt7DjDw7uNVXJ/preview" title="Película de boda de Keeanu Contreras" allow="autoplay" allowFullScreen /></div></section>
      <section className="process-section"><header><p className="section-index">04 / El proceso</p><h2>Una forma tranquila<br/><em>de llegar al día.</em></h2><p>Los acompañamos desde la primera conversación hasta que vuelven a abrir sus recuerdos.</p></header><div className="process-list"><article><span>01</span><div><h3>Nos conocemos</h3><p>Escuchamos cómo imaginan su boda y qué momentos quieren conservar.</p></div></article><article><span>02</span><div><h3>Planeamos juntos</h3><p>Les orientamos con tiempos, luz y espacios para que todo fluya sin posar de más.</p></div></article><article><span>03</span><div><h3>Vivimos la historia</h3><p>Retratamos y grabamos lo que sucede al natural: gestos, voces, pausas y celebración.</p></div></article><article><span>04</span><div><h3>La vuelven a sentir</h3><p>Reciben una colección cuidada para regresar a ese día durante muchos años.</p></div></article></div></section>
      <section className="trust-section"><div><p className="section-index">05 / Para sentirse en buenas manos</p><h2>Su historia,<br/><em>bien acompañada.</em></h2></div><div className="trust-points"><p><b>01</b> Keeanu es de Sonora y trabaja también en Sinaloa y otros destinos.</p><p><b>02</b> La cobertura se adapta a su celebración, no al revés.</p><p><b>03</b> Fotografía y video con una mirada natural, cercana y honesta.</p><p><b>04</b> Cada entrega se revisa con cuidado para que conserve lo que sintieron.</p></div></section>
      <section className="proof-section"><header><p className="section-index">06 / La experiencia</p><h2>Historias que<br/><em>se quedan.</em></h2><p>Desde Sonora acompañamos celebraciones íntimas y grandes fiestas, siempre con la misma atención a lo que las hace únicas.</p></header><div className="proof-stats"><div><strong>Sonora</strong><span>Base de trabajo</span></div><div><strong>MX</strong><span>Disponible para viajar</span></div><div><strong>Foto + video</strong><span>Una historia completa</span></div></div></section>
      <section className="testimonials-section"><header><p className="section-index">07 / Palabras de parejas</p><h2>Lo que permanece<br/><em>después del día.</em></h2></header><div className="testimonials-grid">{testimonials.map(([quote, author]) => <figure key={author}><blockquote>{quote}</blockquote><figcaption>{author}</figcaption></figure>)}</div></section>
      <section className="services"><header><p className="section-index">04 / Lo que hacemos</p><h2>Cada historia<br/>merece su lenguaje.</h2><p className="location-note">Desde Sonora hacia donde nos lleve la historia.</p></header><div className="service-list">{categories.map((category) => <div key={category.id} id={category.id}><span>{category.number}</span><h3>{category.title}</h3><p>{category.text}</p><b>→</b></div>)}</div></section>
      <section id="paquetes" className="packages"><header><p className="section-index">04 / Paquetes base</p><h2>El punto de partida<br/><em>para su historia.</em></h2><p>Elegimos la cobertura que mejor acompaña su día y ajustamos cada detalle a lo que quieren recordar.</p></header><div className="package-grid">{packages.map((item) => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p><a href="#contact">Solicitar información <b>↗</b></a></article>)}</div><p className="package-note">También podemos sumar horas, un segundo fotógrafo, photobook o foto enmarcada según lo que necesiten.</p></section>
      <section className="faq-section"><header><p className="section-index">05 / Preguntas frecuentes</p><h2>Antes de empezar,<br/><em>platiquemos.</em></h2><p>Queremos que se sientan acompañados desde el primer mensaje.</p></header><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>
      <section className="quote-section" aria-label="Filosofía de Keeanu"><p>“No buscamos la fotografía perfecta.</p><p>Buscamos la que te haga volver.”</p></section>
      <section id="contact" className="contact"><div className="contact-intro"><p className="section-index">06 / Cuéntanos</p><h2>Hagamos algo<br/><em>inolvidable.</em></h2><p>Queremos entender qué hace especial su historia y acompañarlos a conservarla con fotografías y video que se sientan tan reales como ese día.</p><div className="social-links" aria-label="Contacto directo"><a href="https://www.instagram.com/keeanucontrerasfotografia/" target="_blank" rel="noreferrer">Instagram <span>↗</span></a><span className="social-pending">WhatsApp · Próximamente</span></div></div><ContactForm /></section>
    </main>
    <footer className="site-footer"><Link className="footer-logo" href="/">KEEANU CONTRERAS</Link><p>Fotografía & video de boda<br/>México — donde nos lleve la historia</p><div><a href="#main">Volver arriba ↑</a><Link href="/privacy">Privacidad</Link></div></footer>
  </div>;
}
