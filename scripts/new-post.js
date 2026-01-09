const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONTENT_DIR = path.join(__dirname, '..', 'content', 'blog');

// Ensure content directory exists
if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

// Escape YAML frontmatter values
function escapeYamlValue(value) {
    if (!value) return '';
    
    // Check if value needs quoting (contains special chars, colons, quotes, newlines, etc.)
    const needsQuoting = /[:'"\n\\]/.test(value) || // contains colon, quote, newline, or backslash
                         /^\s|\s$/.test(value) || // leading/trailing whitespace
                         /^[#&*!|>@`%{}[\]]/.test(value) || // special YAML chars at start
                         value === 'true' || value === 'false' || value === 'null' || // YAML keywords
                         /^[-?]/.test(value); // starts with dash or question mark (YAML special)
    
    if (needsQuoting) {
        // Escape backslashes first, then quotes, then wrap in double quotes
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    
    return value;
}

async function createNewPost() {
    console.log('📝 Create a new blog post\n');

    const title = await question('Post title: ');
    const date = await question('Date (e.g., "May 24, 2025" or leave empty for today): ') || 
                 new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const slug = await question('Slug (URL-friendly, e.g., "my-new-post" or leave empty to auto-generate): ') ||
                 title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const excerpt = await question('Excerpt: ');
    const image = await question('Featured image path (e.g., "photos/my-image.jpg"): ');

    const frontmatter = `---
title: ${escapeYamlValue(title)}
date: ${escapeYamlValue(date)}
slug: ${escapeYamlValue(slug)}
excerpt: ${escapeYamlValue(excerpt)}
image: ${escapeYamlValue(image)}
---

Write your post content here in Markdown format.

`;

    const filename = `${slug}.md`;
    const filepath = path.join(CONTENT_DIR, filename);

    fs.writeFileSync(filepath, frontmatter);
    console.log(`\n✅ Created new post: ${filepath}`);
    console.log(`\nNext steps:`);
    console.log(`1. Edit ${filepath} to add your content`);
    console.log(`2. Run 'npm run build' to generate the HTML and update posts.json`);

    rl.close();
}

createNewPost().catch(console.error);

