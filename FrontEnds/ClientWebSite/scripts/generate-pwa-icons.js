/**
 * تولید آیکون‌های PWA از لوگوی SVG
 * اجرا: node scripts/generate-pwa-icons.js
 * نیاز: npm install -D sharp
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('خطا در بارگذاری sharp:', e.message);
    console.error('لطفاً sharp را نصب کنید: npm install -D sharp');
    process.exit(1);
  }

  const svgPath = path.join(iconsDir, 'android-icon-foreground.png');
  if (!fs.existsSync(svgPath)) {
    console.error('فایل logo.svg در public/icons یافت نشد.');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);

  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  for (const size of sizes) {
    const outPath = path.join(iconsDir, `icon.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log('Created', outPath);
  }

  for (const size of maskableSizes) {
    const outPath = path.join(iconsDir, `android-icon-foreground.png`);
    const padding = Math.round(size * 0.1);
    const safeSize = size - padding * 2;
    const paddedSvg = await sharp(svgBuffer)
      .resize(safeSize, safeSize)
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 15, g: 23, b: 42, alpha: 1 } })
      .png()
      .toBuffer();
    await sharp(paddedSvg)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log('Created', outPath);
  }

  console.log('آیکون‌های PWA با موفقیت ساخته شدند.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
