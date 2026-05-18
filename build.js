/**
 * Isaiah's Corner — build.js
 *
 * BUILD RULES:
 * - Reads from content/blog/*.md
 * - Writes to blog/*.html and posts.json
 * - NEVER writes to art.json or portfolio.json
 * - Run via: npm run build
 * - In production: GitHub Actions runs this on every push to main
 *
 * Required frontmatter fields: title, date, slug, excerpt
 * Optional frontmatter fields: image
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

/* ── Helpers ─────────────────────────────────────────────── */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function toISODate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/* ── Guardrail: never write to manually-maintained JSON files ── */
function validateOutputPath(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  if (norm.includes('/art.json') || norm.includes('/portfolio.json')) {
    throw new Error(
      `ERROR: build.js must not write to ${filePath}. ` +
      'art.json and portfolio.json are manually maintained.'
    );
  }
}

/* ── Paths ───────────────────────────────────────────────── */
const ROOT         = __dirname;
const BLOG_DIR     = path.join(ROOT, 'content', 'blog');
const BLOG_OUT     = path.join(ROOT, 'blog');
const TEMPLATE     = path.join(ROOT, 'post-template.html');
const POSTS_JSON   = path.join(ROOT, 'posts.json');

/* ── Template ────────────────────────────────────────────── */
function getTemplate() {
  if (!fs.existsSync(TEMPLATE)) {
    throw new Error(`post-template.html not found at ${TEMPLATE}`);
  }
  return fs.readFileSync(TEMPLATE, 'utf-8');
}

/* ── Build one post ──────────────────────────────────────── */
function buildPost(file, template) {
  const filePath = path.join(BLOG_DIR, file);
  const raw      = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  // Derive slug
  const slug = data.slug || path.basename(file, '.md');

  // Format date
  let dateStr = data.date;
  if (dateStr instanceof Date) {
    dateStr = dateStr.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  dateStr = String(dateStr || '');

  const excerpt   = String(data.excerpt || content.slice(0, 160).replace(/\n/g, ' '));
  const imageRaw  = data.image || '';
  const imageEsc  = escapeHtml(imageRaw);
  const titleEsc  = escapeHtml(data.title || slug);
  const excerptEsc = escapeHtml(excerpt);
  const isoDate   = toISODate(dateStr);

  // Render markdown
  const bodyHtml = marked(content);

  // Featured image HTML (only if image provided)
  const featuredImageHtml = imageRaw
    ? `<img class="post-featured-image" src="../${imageEsc}" alt="${titleEsc}" loading="lazy">`
    : '';

  // Replace all template placeholders
  let html = template
    .replace(/\{\{TITLE\}\}/g,          data.title || slug)
    .replace(/\{\{TITLE_ESC\}\}/g,      titleEsc)
    .replace(/\{\{DATE\}\}/g,           dateStr)
    .replace(/\{\{DATE_ISO\}\}/g,       isoDate)
    .replace(/\{\{EXCERPT\}\}/g,        excerpt)
    .replace(/\{\{EXCERPT_ESC\}\}/g,    excerptEsc)
    .replace(/\{\{SLUG\}\}/g,           escapeHtml(slug))
    .replace(/\{\{IMAGE\}\}/g,          imageEsc)
    .replace(/\{\{FEATURED_IMAGE\}\}/g, featuredImageHtml)
    .replace(/\{\{CONTENT\}\}/g,        bodyHtml);

  // Write output
  const outPath = path.join(BLOG_OUT, `${slug}.html`);
  validateOutputPath(outPath);
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`  ✓ ${slug}.html`);

  return {
    title:   data.title || slug,
    date:    dateStr,
    slug,
    excerpt,
    image:   imageRaw,
  };
}

/* ── Main build ──────────────────────────────────────────── */
function build() {
  console.log('\n🔨 Building Isaiah\'s Corner...\n');

  // Ensure output dir
  if (!fs.existsSync(BLOG_OUT)) {
    fs.mkdirSync(BLOG_OUT, { recursive: true });
  }

  if (!fs.existsSync(BLOG_DIR)) {
    console.log('  ⚠  No content/blog directory found. Skipping blog posts.');
    return;
  }

  const template = getTemplate();
  const files    = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('  ⚠  No markdown files found in content/blog/');
    return;
  }

  const posts = files.map(file => buildPost(file, template));

  // Sort newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Write posts.json
  validateOutputPath(POSTS_JSON);
  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2), 'utf-8');
  console.log(`\n  ✓ posts.json (${posts.length} posts)`);
  console.log('\n✅ Build complete.\n');
}

if (require.main === module) build();
module.exports = { build };
