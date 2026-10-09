/**
 * Inter at heavy weights for `next/og` images. Satori ships only Noto Sans
 * Regular, which turned the app's heavy headline voice into a thin one. The
 * Google Fonts CSS API hands a non-browser client a TTF, which Satori reads
 * (it can't read woff2). Cached across renders; if the fetch fails the image
 * still renders in the default face.
 */
type OGFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 800; style: "normal" };

let cache: Promise<OGFont[]> | null = null;

async function load(weight: 400 | 600 | 800): Promise<OGFont | null> {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const data = await (await fetch(url)).arrayBuffer();
    return { name: "Inter", data, weight, style: "normal" };
  } catch {
    return null;
  }
}

export function ogFonts(): Promise<OGFont[]> {
  cache ??= Promise.all([load(400), load(600), load(800)]).then((fonts) => fonts.filter((f): f is OGFont => f !== null));
  return cache;
}
