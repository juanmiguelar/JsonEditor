import fs from 'fs';
import path from 'path';

const sitemapPath = path.resolve('public', 'sitemap.xml');
const today = new Date().toISOString().slice(0, 10);

if (!fs.existsSync(sitemapPath)) {
  console.error('sitemap.xml not found at', sitemapPath);
  process.exit(1);
}

const xml = fs.readFileSync(sitemapPath, 'utf8');

if (!xml.includes('<lastmod>')) {
  console.warn('No <lastmod> tag found. Skipping update.');
  process.exit(0);
}

const updatedXml = xml.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${today}</lastmod>`);

fs.writeFileSync(sitemapPath, updatedXml);
console.log(`Updated sitemap lastmod to ${today}`);
