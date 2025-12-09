export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-borderLight dark:border-borderDark bg-panelLightAlt dark:bg-panelDark p-6 text-center text-muted">
      {message}
    </div>
  );
}
