import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public";
import { ASSET_FIELDS, PROJECT_FIELDS } from "@/app/_lib/portfolio-types";
import { publicMediaUrl } from "@/app/_lib/media-url";
export const dynamic = "force-dynamic";
export const metadata = { title: "Fotografía de boda en Sonora y México" };
const categoryNames = { weddings: "Bodas", films: "Cine", commercial: "Comercial" } as const;
export default async function WorkPage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) notFound();
  const { data, error } = await createPublicClient().from("projects").select(`${PROJECT_FIELDS},project_assets(${ASSET_FIELDS})`).eq("slug",slug).eq("status","published").maybeSingle();
  if (error) throw new Error("Portfolio unavailable"); if (!data) notFound();
  const assets = [...data.project_assets].sort((a,b) => a.sort_order-b.sort_order || a.id.localeCompare(b.id));
  const category = categoryNames[data.category as keyof typeof categoryNames] ?? data.category;
  return <div className="story-page"><header className="story-nav"><Link className="site-logo" href="/"><span>K</span><small>Keeanu Contreras</small></Link><Link href="/#trabajo">Todas las historias</Link><Link href="/#contact">Contacto</Link></header><main id="main"><section className="story-hero"><p className="eyebrow">{category} / Historia seleccionada</p><h1>{data.title}</h1>{data.description && <p>{data.description}</p>}<span>Desliza para descubrir ↓</span></section><div className="story-gallery">{assets.map((asset,index) => <figure className="story-image" key={asset.id}><Image priority={index === 0} unoptimized src={publicMediaUrl(asset.object_path, asset.id)} alt={asset.alt_text || `${data.title}, fotografía ${index + 1}`} width={1800} height={1350}/><figcaption>{String(index + 1).padStart(2,"0")} / {String(assets.length).padStart(2,"0")}</figcaption></figure>)}</div><section className="story-end"><p>¿Te imaginas tu historia aquí?</p><Link className="arrow-link" href="/#contact">Hablemos <span>↗</span></Link></section></main><footer className="site-footer"><Link className="footer-logo" href="/">KEEANU CONTRERAS</Link><Link href="/#trabajo">Volver al portafolio</Link></footer></div>;
}
