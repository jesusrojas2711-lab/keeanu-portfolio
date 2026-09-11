import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccessError, requireAdmin } from "@/app/_lib/auth";
import ProjectManager from "@/app/_components/project-manager";
import ContactInbox from "@/app/_components/contact-inbox";
import SignOutButton from "@/app/_components/sign-out-button";
import AdminTools from "@/app/_components/admin-tools";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export default async function AdminPage() {
  let denied: 401 | 403 | 503 | undefined;
  try { await requireAdmin(); }
  catch (error) { denied = error instanceof AdminAccessError ? error.status : 503; }
  if (denied === 401) redirect("/login");
  if (denied === 403) redirect("/login?reason=denied");
  if (denied) return <main id="main" className="status-page"><h1>Access temporarily unavailable.</h1><p>We could not verify your administrator permissions. Please try again later.</p><Link className="text-link" href="/admin">Try again</Link><SignOutButton/></main>;
  return <main id="main" className="admin-page"><header className="admin-heading"><div><p className="eyebrow">KEEANU / Administration</p><h1>Your portfolio.</h1><Link className="text-link" href="/">View portfolio</Link></div><SignOutButton/></header><ProjectManager/><ContactInbox/><AdminTools/></main>;
}
