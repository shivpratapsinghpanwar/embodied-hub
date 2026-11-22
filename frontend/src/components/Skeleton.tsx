export function CardSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex gap-2">
          <span className="skeleton h-4 w-16" />
          <span className="skeleton h-4 w-12" />
          <span className="skeleton ml-auto h-4 w-10" />
        </div>
        <span className="skeleton h-5 w-2/3" />
        <span className="skeleton h-4 w-full" />
        <span className="skeleton h-4 w-5/6" />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex gap-2">
        <span className="skeleton h-4 w-16" />
        <span className="skeleton h-4 w-12" />
        <span className="skeleton ml-auto h-4 w-10" />
      </div>
      <span className="skeleton h-5 w-4/5" />
      <span className="skeleton h-3 w-1/3" />
      <span className="skeleton h-4 w-full" />
      <span className="skeleton h-4 w-11/12" />
      <span className="skeleton h-4 w-2/3" />
      <div className="flex gap-1.5">
        <span className="skeleton h-5 w-16 rounded-full" />
        <span className="skeleton h-5 w-20 rounded-full" />
        <span className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-border pt-3">
        <span className="skeleton h-3 w-10" />
        <span className="skeleton h-3 w-12" />
        <span className="skeleton ml-auto h-3 w-20" />
      </div>
    </div>
  );
}
