export function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-white/10 ${className ?? ""}`} />;
}
