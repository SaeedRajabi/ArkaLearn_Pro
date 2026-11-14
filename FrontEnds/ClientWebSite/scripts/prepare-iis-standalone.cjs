const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const standaloneSrc = path.join(projectRoot, '.next', 'standalone');
const staticSrc = path.join(projectRoot, '.next', 'static');
const publicSrc = path.join(projectRoot, 'public');
const outputDir = path.join(projectRoot, '.iis-dist');
const webConfigSrc = path.join(projectRoot, 'web.config');

function ensureExists(targetPath, label) {
  if (!fs.existsSync(targetPath)) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function main() {
  ensureExists(standaloneSrc, 'Next standalone output');
  ensureExists(path.join(standaloneSrc, 'server.js'), 'Standalone server.js');
  ensureExists(staticSrc, 'Next static assets (.next/static)');
  ensureExists(publicSrc, 'public folder');

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  copyDir(standaloneSrc, outputDir);
  copyDir(staticSrc, path.join(outputDir, '.next', 'static'));
  copyDir(publicSrc, path.join(outputDir, 'public'));

  if (fs.existsSync(webConfigSrc)) {
    fs.copyFileSync(webConfigSrc, path.join(outputDir, 'web.config'));
  } else {
    throw new Error(
      'web.config was not found in the project root. It is required: without it IIS cannot route ' +
        'deep links (e.g. /projects/<slug>) to server.js and replaces Next.js custom 404 pages with ' +
        'raw IIS error pages. Restore FrontEnds/ClientWebSite/web.config before packaging.'
    );
  }

  console.log('IIS package prepared at .iis-dist');
  console.log('Included: standalone server, .next/static, public, web.config');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
