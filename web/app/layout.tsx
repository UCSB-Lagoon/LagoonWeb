import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AdminBar } from "@/components/admin-bar";

const GA_ID = "G-5HY7LBXP8G";

export const metadata: Metadata = {
  title: {
    default: "UCSB Lagoon — Live campus map, leaderboards & stats",
    template: "%s · UCSB Lagoon",
  },
  description:
    "The live web hub for UCSB Lagoon. Interactive campus map with friends nearby, weekly leaderboards, challenges, and aggregate stats from the Lagoon iOS app.",
  applicationName: "UCSB Lagoon",
  keywords: ["UCSB", "Lagoon", "Gaucho", "campus map", "leaderboard", "UCSB students", "Isla Vista"],
  metadataBase: new URL("https://lagoonucsb.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: "UCSB Lagoon",
    title: "UCSB Lagoon — Live campus map, leaderboards & stats",
    description:
      "Interactive UCSB campus map with friends nearby, weekly leaderboards, and live stats from the Lagoon iOS app.",
    url: "https://lagoonucsb.com",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "UCSB Lagoon — Live campus map & leaderboards",
    description:
      "The live web hub for UCSB Lagoon. Campus map, leaderboards, stats.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Lagoon",
  },
  other: {
    "apple-itunes-app": "app-id=6760681142, app-argument=https://lagoonucsb.com/",
  },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <AdminBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        <Script id="lagoon-events" strategy="afterInteractive">
          {`(function(){
  // App Store outbound click → GA4 conversion
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
    if (!a) return;
    var src = a.getAttribute('data-lagoon-cta') || 'inline';
    if (window.gtag) {
      gtag('event','app_store_click',{cta_source:src, page_path:location.pathname, link_url:a.href});
      gtag('event','conversion',{send_to:'${GA_ID}', cta_source:src});
    }
  }, true);
  // Scroll-depth milestones
  var hit={}, ms=[25,50,75,100];
  window.addEventListener('scroll', function(){
    var h=document.documentElement;
    var p=Math.round(((h.scrollTop||document.body.scrollTop)+window.innerHeight)/h.scrollHeight*100);
    ms.forEach(function(m){ if(!hit[m]&&p>=m){hit[m]=true; window.gtag&&gtag('event','scroll_depth',{percent:m,page_path:location.pathname});} });
  }, {passive:true});
  // Referral cookie persistence
  try {
    var m = location.pathname.match(/^\\/r\\/([a-zA-Z0-9_-]{2,32})/);
    if (m) document.cookie = 'lagoon_ref=' + m[1] + '; path=/; max-age=' + (60*60*24*60) + '; SameSite=Lax';
  } catch (e) {}
})();`}
        </Script>
      </body>
    </html>
  );
}
