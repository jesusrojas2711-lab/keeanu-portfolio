import Link from "next/link";
import LoginForm from "@/app/_components/login-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "Admin access", robots: { index: false, follow: false } };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string | string[] }> }) {
  const { reason } = await searchParams;
  const message = reason === "denied" ? "This account does not have administrator access." : "";
  return <main id="main" className="status-page"><p className="eyebrow">KEEANU / Private area</p><h1>Admin access</h1><LoginForm initialMessage={message}/><Link className="text-link" href="/">Return to portfolio</Link></main>;
}
