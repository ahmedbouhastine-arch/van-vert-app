"use client"

export default function Error({ error }: { error: Error & { digest?: string } }) {
  console.error("App Error:", error.message, "Digest:", error.digest);
  return <div>Error: {error.message} — Digest: {error.digest}</div>;
}
