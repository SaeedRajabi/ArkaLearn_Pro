/**
 * Build resized favicon / PWA / OG assets from user files in public/brand/.
 * Does NOT modify originals: favicon.png, android-icon-*.png
 *
 * Run: npm run brand:sync
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

const root = path.join(__dirname, '..');
const brandDir = path.join(root, 'public', 'brand');
const appDir = path.join(root, 'src', 'app');

const SOURCE_FAVICON = path.join(brandDir, 'favicon.png');
const SOURCE_FOREGROUND = path.join(brandDir, 'android-icon-foreground.png');
const SOURCE_BACKGROUND = path.join(brandDir, 'android-icon-background.png');

async function resizeFromFavicon(size) {
  return sharp(SOURCE_FAVICON)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function compositeAdaptiveIcon(size) {
  if (!fs.existsSync(SOURCE_FOREGROUND) || !fs.existsSync(SOURCE_BACKGROUND)) {
    return resizeFromFavicon(size);
  }
  const fgSize = Math.round(size * 0.62);
  const [bg, fg] = await Promise.all([
    sharp(SOURCE_BACKGROUND).resize(size, size, { fit: 'cover' }).png().toBuffer(),
    sharp(SOURCE_FOREGROUND)
      .resize(fgSize, fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
  ]);
  return sharp(bg)
    .composite([{ input: fg, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function writePng(buffer, target) {
  await sharp(buffer).toFile(target);
  console.log('Wrote', path.relative(root, target));
}

async function main() {
  if (!fs.existsSync(SOURCE_FAVICON)) {
    console.error('Missing', SOURCE_FAVICON);
    console.error('Place favicon.png in public/brand/');
    process.exit(1);
  }

  const icon192 = await resizeFromFavicon(192);
  const icon512 = await resizeFromFavicon(512);
  const apple180 = await resizeFromFavicon(180);
  const adaptive512 = await compositeAdaptiveIcon(512);

  await writePng(icon192, path.join(brandDir, 'icon-192.png'));
  await writePng(icon512, path.join(brandDir, 'icon-512.png'));
  await writePng(apple180, path.join(brandDir, 'apple-touch-icon.png'));

  const pngSizes = [16, 32, 48];
  const icoBuffers = await Promise.all(
    pngSizes.map((s) => resizeFromFavicon(s))
  );
  const icoBuffer = await toIco(icoBuffers);
  const icoPath = path.join(brandDir, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log('Wrote', path.relative(root, icoPath));

  await sharp(icon512).toFile(path.join(appDir, 'icon.png'));
  console.log('Wrote src/app/icon.png');

  await sharp(apple180).toFile(path.join(appDir, 'apple-icon.png'));
  console.log('Wrote src/app/apple-icon.png');

  fs.copyFileSync(icoPath, path.join(appDir, 'favicon.ico'));
  console.log('Wrote src/app/favicon.ico');

  const ogWidth = 1200;
  const ogHeight = 630;
  const logoSize = 280;
  const logo = await sharp(adaptive512).resize(logoSize, logoSize).png().toBuffer();

  const ogSvg = Buffer.from(`
    <svg width="${ogWidth}" height="${ogHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#e8f4fc"/>
          <stop offset="50%" style="stop-color:#dbeafe"/>
          <stop offset="100%" style="stop-color:#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="520" y="200" fill="#0f172a" font-family="Arial,sans-serif" font-size="52" font-weight="700">آرکا نرم افزار</text>
      <text x="520" y="270" fill="#334155" font-family="Arial,sans-serif" font-size="38" font-weight="600">ArkaSoftware</text>
      <text x="520" y="340" fill="#475569" font-family="Arial,sans-serif" font-size="28">آموزش آنلاین برنامه‌نویسی</text>
      <text x="520" y="560" fill="#64748b" font-family="Arial,sans-serif" font-size="26">arkasoftware.ir</text>
    </svg>
  `);

  const ogOut = path.join(brandDir, 'og-image.png');
  await sharp(ogSvg)
    .composite([{ input: logo, left: 140, top: Math.round((ogHeight - logoSize) / 2) }])
    .png()
    .toFile(ogOut);
  console.log('Wrote', path.relative(root, ogOut));

  console.log('Brand derivatives synced from public/brand/ (originals untouched).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
