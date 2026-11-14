const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');

const candidates = [
  'robots.txt',
  'sitemap.xml',
  'sitemap-0.xml',
];

function removeIfExists(fileName) {
  const fullPath = path.join(publicDir, fileName);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { force: true });
    console.log(`Removed stale generated SEO file: public/${fileName}`);
  }
}

function removeSitemapShards() {
  if (!fs.existsSync(publicDir)) return;
  for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (/^sitemap-\d+\.xml$/i.test(entry.name)) {
      removeIfExists(entry.name);
    }
  }
}

for (const file of candidates) {
  removeIfExists(file);
}
removeSitemapShards();
