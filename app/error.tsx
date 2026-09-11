"use client";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main id="main" className="status-page"><h1>Something went wrong.</h1><p>Please try again.</p><button onClick={() => retry()}>Try again</button></main>;
}
