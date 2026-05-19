'use strict';

const fs     = require('fs');
const path   = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT         = __dirname;
const BLOG_CONTENT = path.join(ROOT, 'content', 'blog');
const POEM_CONTENT = path.join(ROOT, 'content', 'poetry');
const BLOG_OUT     = path.join(ROOT, 'blog');
const TEMPLATE     = path.join(ROOT, 'post-template.html');
const POSTS_JSON   = path.join(ROOT, 'posts.json');
const ART_JSON     = path.join(ROOT, 'art.json');

function toISO(dateStr) {
  const d = new Date(dateStr);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function buildBlog() {
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const files    = fs.readdirSync(BLOG_CONTENT).filter(f => f.endsWith('.md'));
  const posts    = [];

  for (const file of files) {
    const { data, content } = matter(fs.readFileSync(path.join(BLOG_CONTENT, file), 'utf8'));
    const { title, date, slug, excerpt, image } = data;

    if (!title || !date || !slug) {
      console.warn(`  ⚠  Skipping ${file}: missing title, date, or slug in frontmatter`);
      continue;
    }

    const bodyHtml = marked(content.trim());
    const safeTitle = title.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const featuredImage = image
      ? `<img class="post-featured-image" src="../${image}" alt="${safeTitle}" loading="lazy">`
      : '';

    const html = template
      .replace(/\{\{TITLE\}\}/g,     title)
      .replace(/\{\{DATE\}\}/g,      date)
      .replace(/\{\{DATE_ISO\}\}/g,  toISO(date))
      .replace(/\{\{SLUG\}\}/g,      slug)
      .replace(/\{\{EXCERPT\}\}/g,   excerpt || '')
      .replace(/\{\{IMAGE\}\}/g,     image   || '')
      .replace('{{FEATURED_IMAGE}}', featuredImage)
      .replace('{{CONTENT}}',        bodyHtml);

    fs.writeFileSync(path.join(BLOG_OUT, `${slug}.html`), html);
    console.log(`  ✓ blog/${slug}.html`);

    posts.push({ title, date, slug, excerpt: excerpt || '', image: image || '' });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(POSTS_JSON, JSON.stringify(posts, null, 2) + '\n');
  console.log(`  ✓ posts.json (${posts.length} posts)`);
}

function buildPoetry() {
  if (!fs.existsSync(POEM_CONTENT)) return;

  const files = fs.readdirSync(POEM_CONTENT).filter(f => f.endsWith('.md'));
  if (!files.length) return;

  const art = JSON.parse(fs.readFileSync(ART_JSON, 'utf8'));

  for (const file of files) {
    const { data, content } = matter(fs.readFileSync(path.join(POEM_CONTENT, file), 'utf8'));
    const { title } = data;

    if (!title) {
      console.warn(`  ⚠  Skipping ${file}: missing title in frontmatter`);
      continue;
    }

    const entry = { title, type: 'poem', content: content.trim() };
    const idx   = art.findIndex(e => e.type === 'poem' && e.title === title);

    if (idx >= 0) {
      art[idx] = entry;
      console.log(`  ↻ poem updated: "${title}"`);
    } else {
      art.unshift(entry);
      console.log(`  ✓ poem added:   "${title}"`);
    }
  }

  fs.writeFileSync(ART_JSON, JSON.stringify(art, null, 2) + '\n');
  console.log(`  ✓ art.json`);
}

console.log("\n🏗  Building Isaiah's Corner…\n");
buildBlog();
buildPoetry();
console.log('\n✅  Done.\n');
