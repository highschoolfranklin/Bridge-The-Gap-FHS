/**
 * Minimal sanity checks (run with: node tests/sanity-check.js)
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const required = [
  'index.html',
  'style.css',
  'config.js',
  'utils.js',
  'auth.js',
  'student.js',
  'parent.js',
  'counselor.js',
  'manifest.webmanifest',
  'sw.js',
  'favicon.svg',
  'supabase-college-logo-migration.sql',
  'supabase-storage-college-logos.sql'
];

let failed = false;
for (const f of required) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error('Missing:', f);
    failed = true;
  }
}

const utilsPath = path.join(root, 'utils.js');
const u = fs.readFileSync(utilsPath, 'utf8');
if (!u.includes('function escapeHtml')) {
  console.error('utils.js must export escapeHtml');
  failed = true;
}
if (!u.includes('function fetchJsonWithCache')) {
  console.error('utils.js must define fetchJsonWithCache');
  failed = true;
}
if (!u.includes('function resolveCollegeLogoDisplayUrl')) {
  console.error('utils.js must define resolveCollegeLogoDisplayUrl');
  failed = true;
}

if (failed) {
  console.error('Sanity check failed');
  process.exit(1);
}
console.log('Sanity check passed');
process.exit(0);
