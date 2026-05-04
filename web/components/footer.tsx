export function Footer() {
  return (
    <footer className="border-t border-cream-200 mt-20">
      <div className="max-w-7xl mx-auto px-5 py-10 text-sm text-ink-500 flex flex-wrap items-center justify-between gap-3">
        <p>
          <span className="font-display font-bold text-orange-500">Lagoon</span>
          <span className="ml-2">© {new Date().getFullYear()} · Built by Gauchos, for Gauchos.</span>
        </p>
        <p className="flex items-center gap-4">
          <a href="https://lagoonucsb.com" className="hover:text-ink-900 transition">lagoonucsb.com</a>
          <a href="/leaderboard" className="hover:text-ink-900 transition">Leaderboard</a>
        </p>
      </div>
    </footer>
  );
}
