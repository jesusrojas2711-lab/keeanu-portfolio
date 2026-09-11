"use client";
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="en"><body><main><h1>Something went wrong.</h1><button onClick={() => retry()}>Try again</button></main></body></html>;
}
