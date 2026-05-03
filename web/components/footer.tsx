export function Footer() {
  return (
    <footer className="border-t border-amber/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-mist/50 flex flex-wrap items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Lagoon · Built by Gauchos, for Gauchos.</p>
        <p>
          <a href="https://lagoonucsb.com" className="hover:text-mist">lagoonucsb.com</a>
          <span className="mx-2">·</span>
          <a href="https://github.com" className="hover:text-mist">GitHub</a>
        </p>
      </div>
    </footer>
  );
}
