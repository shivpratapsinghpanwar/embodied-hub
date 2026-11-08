import { Suspense } from "react";
import { Hub } from "@/components/Hub";

export default function Page() {
  return (
    <main className="flex-1">
      <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
        <Hub />
      </Suspense>
    </main>
  );
}
