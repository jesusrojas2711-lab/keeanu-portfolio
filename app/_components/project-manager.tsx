"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Project, ProjectDetail } from "@/app/_lib/portfolio-types";
import { MAX_UPLOAD_BYTES } from "@/app/_lib/portfolio-types";
const messages: Record<string, string> = {
  SLUG_IN_USE: "That project address is already in use. Choose another.", PHOTO_REQUIRED: "Add at least one photo before publishing.", UNPUBLISH_FIRST: "Move this project to drafts before editing it.", PROJECT_CHANGED: "The project changed. Reload it and try again.", PHOTO_LIMIT: "This project already has 200 photos.", UPLOAD_CLEANUP_REQUIRED: "The upload could not be completed. A private file may need cleanup; please contact support.",
};
async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { ...init, cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.location.replace("/login");
    throw new Error(messages[body.error] ?? (response.status === 413 ? "Choose a photo smaller than 4 MiB." : response.status === 415 ? "Use a valid, non-animated JPEG, PNG or WebP image (up to 40 megapixels)." : response.status === 400 ? "Check the project fields and try again." : "The operation could not be completed. Please try again."));
  }
  return body;
}
const json = (method: string, data: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1); const [count, setCount] = useState(0);
  const [selection, setSelection] = useState<ProjectDetail | "new" | null>(null);
  const [loading, setLoading] = useState(true); const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function list() {
    const data = await api(`/api/admin/projects?page=${page}`);
    setProjects(data.projects); setCount(data.count);
  }
  useEffect(() => {
    let active = true;
    api(`/api/admin/projects?page=${page}`).then(data => { if (active) { setProjects(data.projects); setCount(data.count); } }).catch(error => { if(active) setMessage(error.message); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [page]);
  async function open(id: string) {
    if(busy) return; setBusy(true);setMessage("");
    try { const data = await api(`/api/admin/projects/${id}`); setSelection(data.project); }
    catch(error) { setMessage(error instanceof Error ? error.message : "Could not open project."); }
    finally { setBusy(false); }
  }
  async function changed(id: string) {
    const data = await api(`/api/admin/projects/${id}`); setSelection(data.project); await list();
  }
  return <div className="manager">
    <aside className="project-list"><button disabled={busy} onClick={() => { setSelection("new"); setMessage(""); }}>New project</button>
      <p>{count} {count === 1 ? "project" : "projects"}</p>
      {loading ? <p role="status">Loading projects…</p> : projects.length === 0 ? <p>No projects yet. Create your first draft.</p> : projects.map(project => <button className="project-row" disabled={busy} key={project.id} onClick={() => open(project.id)} aria-pressed={selection !== "new" && selection?.id === project.id}><strong>{project.title}</strong><span>{project.category} · {project.status}</span></button>)}
      <div className="button-row"><button disabled={busy || page === 1} onClick={() => { setLoading(true); setPage(page - 1); }}>Previous</button><span>{page}</span><button disabled={busy || page * 12 >= count} onClick={() => { setLoading(true); setPage(page + 1); }}>Next</button></div>
      <p role="status">{message}</p>
    </aside>
    <div>{selection ? <ProjectEditor key={selection === "new" ? "new" : selection.id} project={selection === "new" ? null : selection} changed={changed} setBusy={setBusy}/> : <div className="editor-empty"><h2>Your work, in one place.</h2><p>Select a project or start a new draft.</p></div>}</div>
  </div>;
}
function ProjectEditor({ project, changed, setBusy }: { project: ProjectDetail | null; changed: (id: string) => Promise<void>; setBusy: (busy: boolean) => void }) {
  const form = useRef<HTMLFormElement>(null); const uploadForm = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false); const running = useRef(false);
  const [message, setMessage] = useState("");
  const published = project?.status === "published";
  async function act(work: () => Promise<void>, success: string) {
    if(running.current) return; running.current = true; setPending(true);setBusy(true);setMessage("");
    try { await work(); setMessage(success); }
    catch(error) { setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again."); }
    finally { running.current = false;setPending(false);setBusy(false); }
  }
  async function save() {
    if (!form.current?.reportValidity()) throw new Error("Please complete the required fields.");
    const data = new FormData(form.current);
    const input = { title: data.get("title"), slug: data.get("slug"), category: data.get("category"), description: data.get("description"), sort_order: Number(data.get("sort_order")) };
    const result = await api(project ? `/api/admin/projects/${project.id}` : "/api/admin/projects", json(project ? "PATCH" : "POST", input));
    return result.project.id as string;
  }
  function submit(event: FormEvent) { event.preventDefault(); void act(async () => { const id = await save(); await changed(id); }, "Draft saved."); }
  function publish() { void act(async () => { const id = await save(); await api(`/api/admin/projects/${id}`, json("PATCH", {status:"published"})); await changed(id); }, "Project published. It is now visible on your portfolio."); }
  function unpublish() { if(!project) return; void act(async () => { await api(`/api/admin/projects/${project.id}`,json("PATCH",{status:"draft"}));await changed(project.id); },"Moved to drafts."); }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if(!project) return;
    const data = new FormData(event.currentTarget); data.set("project_id",project.id);
    const file = data.get("file");
    if (!(file instanceof File) || !file.size) { setMessage("Choose a photo first."); return; }
    if (file.size > MAX_UPLOAD_BYTES) { setMessage("Choose a photo smaller than 4 MiB."); return; }
    void act(async () => { await api("/api/admin/uploads",{method:"POST",body:data});uploadForm.current?.reset();await changed(project.id); },"Photo added to the draft.");
  }
  function updateAsset(id: string, values: Record<string, unknown>, success: string) {
    if (!project) return;
    void act(async () => { await api(`/api/admin/assets/${id}`, json("PATCH", values)); await changed(project.id); }, success);
  }
  function moveAsset(index: number, direction: -1 | 1) {
    if (!project) return;
    const target = index + direction;
    if (target < 0 || target >= project.assets.length) return;
    const current = project.assets[index]; const next = project.assets[target];
    void act(async () => {
      await api(`/api/admin/assets/${current.id}`, json("PATCH", { sort_order: next.sort_order }));
      await api(`/api/admin/assets/${next.id}`, json("PATCH", { sort_order: current.sort_order }));
      await changed(project.id);
    }, "Gallery order updated.");
  }
  function remove(id: string) {
    if(!project || !window.confirm("Permanently remove this photo from the draft?")) return;
    void act(async () => { await api(`/api/admin/assets/${id}`,{method:"DELETE"});await changed(project.id); },"Photo removed.");
  }
  return <section className="project-editor"><p className="eyebrow">{project ? project.status : "New draft"}</p><h2>{project ? "Edit project" : "Create a project"}</h2>
    <form ref={form} onSubmit={submit}><fieldset disabled={pending}>
      <label htmlFor="project-title">Title</label><input id="project-title" name="title" required maxLength={160} defaultValue={project?.title ?? ""}/>
      <label htmlFor="project-slug">Project address</label><input id="project-slug" name="slug" required maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="ana-and-luis" defaultValue={project?.slug ?? ""}/><small>Lowercase letters, numbers and hyphens.</small>
      <label htmlFor="project-category">Category</label><select id="project-category" name="category" defaultValue={project?.category ?? "weddings"}><option value="weddings">Weddings</option><option value="films">Films</option><option value="commercial">Commercial</option></select>
      <label htmlFor="project-description">Description</label><textarea id="project-description" name="description" maxLength={3000} rows={4} defaultValue={project?.description ?? ""}/>
      <label htmlFor="project-order">Display order</label><input id="project-order" name="sort_order" type="number" min={0} max={10000} step={1} required defaultValue={project?.sort_order ?? 0}/>
      <button type="submit">{pending ? "Working…" : project ? "Save draft" : "Create draft"}</button>
    </fieldset></form>
    <div className="button-row">{published ? <><button disabled={pending} onClick={unpublish}>Move to drafts</button><a href={`/work/${project.slug}`} target="_blank" rel="noopener noreferrer">View published project</a></> : project && <button disabled={pending || project.assets.length === 0} onClick={publish}>Save and publish</button>}</div>
    {published && <p>Published changes appear on the portfolio as soon as they are saved.</p>}
    {project && <><h3>Gallery · {project.assets.length}/200</h3><p className="muted">Arrange the story from left to right, and add a useful description to each image.</p><div className="asset-grid">{project.assets.map((asset, index) => <figure key={asset.id}><Image unoptimized src={`/api/admin/assets/${asset.id}/preview`} alt={asset.alt_text || "Project photo"} width={480} height={360}/><label htmlFor={`asset-alt-${asset.id}`}>Alt text</label><input id={`asset-alt-${asset.id}`} defaultValue={asset.alt_text} maxLength={500} onBlur={(event) => { if (event.currentTarget.value !== asset.alt_text) updateAsset(asset.id, { alt_text: event.currentTarget.value }, "Image description saved."); }}/><div className="asset-actions"><button disabled={pending || index === 0} onClick={() => moveAsset(index, -1)} aria-label="Move photo earlier">Anterior</button><button disabled={pending || index === project.assets.length - 1} onClick={() => moveAsset(index, 1)} aria-label="Move photo later">Siguiente</button><button disabled={pending} onClick={() => remove(asset.id)}>Remove</button></div></figure>)}</div>
      <form ref={uploadForm} onSubmit={upload}><fieldset disabled={pending}><label htmlFor="photo-file">Add a photo</label><input id="photo-file" name="file" type="file" accept="image/jpeg,image/png,image/webp" required/><small>JPEG, PNG or WebP · up to 4 MiB · one photo at a time.</small><label htmlFor="photo-alt">Photo description</label><input id="photo-alt" name="alt_text" maxLength={500} placeholder="Describe the photo for visitors using a screen reader"/><button type="submit">{pending ? "Working…" : "Upload photo"}</button></fieldset></form>
    </>}
    {!project && <p>Save your draft to start adding photos.</p>}<p role="status" aria-live="polite">{message}</p>
  </section>;
}
