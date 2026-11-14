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

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  copyDir(standaloneSrc, outputDir);
  copyDir(staticSrc, path.join(outputDir, '.next', 'static'));
  if (fs.existsSync(publicSrc)) {
    copyDir(publicSrc, path.join(outputDir, 'public'));
  }

  if (fs.existsSync(webConfigSrc)) {
    fs.copyFileSync(webConfigSrc, path.join(outputDir, 'web.config'));
  } else {
    console.warn('web.config was not found in project root and was not copied.');
  }

  // Patch server.js to support iisnode named pipes
  const serverJsPath = path.join(outputDir, 'server.js');
  let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
  serverJsContent = serverJsContent.replace(
    /const currentPort = parseInt\(process\.env\.PORT, 10\) \|\| 3000/g,
    'const currentPort = process.env.PORT || 3000'
  );
  fs.writeFileSync(serverJsPath, serverJsContent);

  console.log('IIS package prepared at .iis-dist');
  console.log('Included: standalone server, .next/static, public (if any), web.config');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
