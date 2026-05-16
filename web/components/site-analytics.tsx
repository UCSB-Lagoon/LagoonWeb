import Script from "next/script";

/**
 * GA4 + Lagoon conversion events, parameterized by stream.
 *
 * The marketing pages and the app report to SEPARATE GA4 streams and this
 * must stay true (see ONBOARDING / memory): marketing → G-2F8CTN4DNP,
 * app → G-5HY7LBXP8G. The (marketing) and (app) group layouts each render
 * this with their own id so a page only ever emits to its own stream.
 *
 * The events block is the same logic the old static marketing pages and
 * the app layout both shipped: App Store outbound → app_store_click +
 * conversion, scroll-depth milestones, and /r/<code> referral cookie.
 */
export function SiteAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
      <Script id="lagoon-events" strategy="afterInteractive">
        {`(function(){
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
    if (!a) return;
    var src = a.getAttribute('data-lagoon-cta') || 'inline';
    if (window.gtag) {
      gtag('event','app_store_click',{cta_source:src, page_path:location.pathname, link_url:a.href});
      gtag('event','conversion',{send_to:'${gaId}', cta_source:src});
    }
  }, true);
  var hit={}, ms=[25,50,75,100];
  window.addEventListener('scroll', function(){
    var h=document.documentElement;
    var p=Math.round(((h.scrollTop||document.body.scrollTop)+window.innerHeight)/h.scrollHeight*100);
    ms.forEach(function(m){ if(!hit[m]&&p>=m){hit[m]=true; window.gtag&&gtag('event','scroll_depth',{percent:m,page_path:location.pathname});} });
  }, {passive:true});
  try {
    var m = location.pathname.match(/^\\/r\\/([a-zA-Z0-9_-]{2,32})/);
    if (m) document.cookie = 'lagoon_ref=' + m[1] + '; path=/; max-age=' + (60*60*24*60) + '; SameSite=Lax';
  } catch (e) {}
})();`}
      </Script>
    </>
  );
}
