export function GET({ site }: { site: URL | undefined }) {
  const base = (site?.href ?? 'https://techtious.com/').replace(/\/$/, '');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${base}/sitemap-0.xml</loc></sitemap></sitemapindex>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}
