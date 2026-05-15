import Link from "next/link";
import { Download, ArrowUpRight } from "lucide-react";

const APP_STORE = "https://apps.apple.com/us/app/ucsb-lagoon/id6760681142";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 relative overflow-hidden">
      {/* Tinted CTA strip */}
      <div className="card-tinted mx-5 sm:mx-8 px-6 sm:px-10 py-10 sm:py-12 max-w-7xl lg:mx-auto relative overflow-hidden">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-orange-300/40 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-amber-400/40 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-orange-700">Built for Gauchos</p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 mt-2">
              Get Lagoon on your phone.
            </h3>
            <p className="text-ink-500 mt-2 max-w-md">
              Same account as the web hub. Live dining, GOLD sync, friends on the map.
            </p>
          </div>
          <a
            href={APP_STORE}
            rel="noreferrer"
            data-lagoon-cta="footer-cta"
            className="btn-primary self-start md:self-auto whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Download free
          </a>
        </div>
      </div>

      {/* Link grid */}
      <div className="max-w-7xl mx-auto px-5 pt-12 pb-8 grid gap-10 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white font-display font-extrabold text-lg leading-none shadow-[0_6px_18px_-8px_rgba(240,138,60,0.7)]"
            >
              L
            </span>
            <span className="font-display font-bold text-lg tracking-tight text-ink-900">Lagoon</span>
          </div>
          <p className="mt-3 text-ink-500 leading-relaxed">
            Campus life, beautifully simple. Built by UCSB students, for UCSB students.
          </p>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-ink-400 mb-3">Product</h4>
          <ul className="space-y-2 text-ink-700">
            <li><Link href="/leaderboard" className="hover:text-orange-600 transition">Leaderboard</Link></li>
            <li><Link href="/challenges" className="hover:text-orange-600 transition">Challenges</Link></li>
            <li><Link href="/stats" className="hover:text-orange-600 transition">Stats</Link></li>
            <li><Link href="/map" className="hover:text-orange-600 transition">Campus map</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-ink-400 mb-3">Resources</h4>
          <ul className="space-y-2 text-ink-700">
            <li>
              <a href="https://lagoonucsb.com/guides" className="hover:text-orange-600 transition inline-flex items-center gap-1">
                UCSB guides <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a href="https://lagoonucsb.com/ucsb-dining-menu" className="hover:text-orange-600 transition inline-flex items-center gap-1">
                Dining menu <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a href="https://lagoonucsb.com/ucsb-grade-distributions-guide" className="hover:text-orange-600 transition inline-flex items-center gap-1">
                Grade distributions <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
            <li>
              <Link href="/captains" className="hover:text-orange-600 transition inline-flex items-center gap-1">
                Captain program <ArrowUpRight className="w-3 h-3" />
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-[0.18em] font-semibold text-ink-400 mb-3">Lagoon</h4>
          <ul className="space-y-2 text-ink-700">
            <li>
              <a href="https://lagoonucsb.com" className="hover:text-orange-600 transition inline-flex items-center gap-1">
                lagoonucsb.com <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a href="https://lagoonucsb.com/company" className="hover:text-orange-600 transition inline-flex items-center gap-1">
                About <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
            <li>
              <a href={APP_STORE} rel="noreferrer" data-lagoon-cta="footer-link"
                className="hover:text-orange-600 transition inline-flex items-center gap-1">
                Download iOS <ArrowUpRight className="w-3 h-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-5 py-6 text-xs text-ink-400 flex flex-wrap items-center justify-between gap-3">
          <p>© {year} Lagoon · Not affiliated with UC Santa Barbara.</p>
          <p className="flex items-center gap-1.5">
            <span className="live-dot" aria-hidden="true" />
            <span>Live across campus</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
