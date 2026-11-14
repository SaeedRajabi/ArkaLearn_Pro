/**
 * ساخت گواهی SSL خودامضا برای اجرای محلی داشبورد با HTTPS.
 * بدون نیاز به OpenSSL: از پکیج selfsigned استفاده می‌کند.
 * یک بار اجرا کنید: npm run generate-certs
 * سپس داشبورد را با HTTPS اجرا کنید: npm run dev:https
 * آدرس: https://localhost:4001
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const keyPath = path.join(root, 'localhost+2-key.pem');
const certPath = path.join(root, 'localhost+2.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('> گواهی\u200cهای SSL از قبل وجود دارند:', certPath);
  process.exit(0);
}

function generateWithOpenSSL() {
  try {
    execSync('openssl version', { encoding: 'utf8' });
  } catch {
    return false;
  }
  const cmd = [
    'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
    '-keyout', keyPath,
    '-out', certPath,
    '-days', '365',
    '-nodes',
    '-subj', '/CN=localhost'
  ].join(' ');
  try {
    execSync(cmd, { cwd: root, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function generateWithSelfsigned() {
  let selfsigned;
  try {
    selfsigned = require('selfsigned');
  } catch {
    return false;
  }
  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const options = { keySize: 2048, days: 365 };
  const pems = selfsigned.generate(attrs, options);
  if (pems && pems.private && pems.cert) {
    fs.writeFileSync(keyPath, pems.private, 'utf8');
    fs.writeFileSync(certPath, pems.cert, 'utf8');
    return true;
  }
  return false;
}

// ۱) اول با OpenSSL امتحان (اگر نصب باشد)
if (generateWithOpenSSL()) {
  console.log('> گواهی\u200cها با OpenSSL ساخته شدند.');
  console.log('  Key:', keyPath);
  console.log('  Cert:', certPath);
  console.log('> اجرای داشبورد با HTTPS: npm run dev:https');
  process.exit(0);
}

// ۲) با پکیج selfsigned (بدون نیاز به OpenSSL)
if (generateWithSelfsigned()) {
  console.log('> گواهی\u200cها با selfsigned ساخته شدند.');
  console.log('  Key:', keyPath);
  console.log('  Cert:', certPath);
  console.log('> اجرای داشبورد با HTTPS: npm run dev:https');
  process.exit(0);
}

console.error('> برای ساخت گواهی یکی از این کارها را انجام دهید:');
console.error('  1. نصب وابستگی\u200cها و دوباره اجرا: npm install && npm run generate-certs');
console.error('  2. نصب Git for Windows (شامل OpenSSL) و دوباره اجرا');
console.error('  3. یا دستی با OpenSSL:');
console.error('     openssl req -x509 -newkey rsa:2048 -keyout localhost+2-key.pem -out localhost+2.pem -days 365 -nodes -subj "/CN=localhost"');
process.exit(1);
