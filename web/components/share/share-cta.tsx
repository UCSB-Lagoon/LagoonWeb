import { appStoreURL } from "@/lib/share";

/**
 * Install first, then "already have it?". The custom-scheme link matters
 * because a universal link tapped on its own domain stays in Safari.
 */
export function ShareCTA({ kind, appPath, label, note }: { kind: string; appPath: string; label: string; note?: string }) {
  return (
    <div className="mt-7 flex flex-col gap-3">
      <a
        href={appStoreURL(kind)}
        rel="noreferrer"
        data-lagoon-cta={`share-${kind}`}
        className="btn-primary w-full justify-center text-center"
      >
        {label}
      </a>
      <a href={`lagoon://${appPath}`} className="text-sm font-semibold text-ink-500 text-center underline underline-offset-4">
        Already have Lagoon? Open it there
      </a>
      {note ? <p className="text-xs text-ink-400 text-center mt-1">{note}</p> : null}
    </div>
  );
}
