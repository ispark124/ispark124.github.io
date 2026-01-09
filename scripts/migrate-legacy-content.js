const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

// Configuration
const REPO_ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(REPO_ROOT, 'content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const LEGACY_POSTS_JSON = path.join(REPO_ROOT, 'posts.json');
const LEGACY_BLOG_DIR = path.join(REPO_ROOT, 'blog');

// Parse command line args
const FORCE = process.argv.includes('--force');

// Stats
const stats = {
    created: 0,
    skipped: 0,
    failed: 0
};

// Helper: Slugify a string
function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special chars
        .replace(/[\s_-]+/g, '-')  // Replace spaces/underscores with hyphens
        .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
}

// Helper: Escape YAML value (same as in new-post.js)
function escapeYamlValue(value) {
    if (!value) return '';
    
    const needsQuoting = /[:'"\n\\]/.test(value) ||
                         /^\s|\s$/.test(value) ||
                         /^[#&*!|>@`%{}[\]]/.test(value) ||
                         value === 'true' || value === 'false' || value === 'null' ||
                         /^[-?]/.test(value);
    
    if (needsQuoting) {
        return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    
    return value;
}

// Helper: Extract content from HTML
function extractPostContent(htmlContent) {
    try {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        // Try to find the post content container
        const postContent = document.querySelector('.post-content');
        if (!postContent) {
            // Fallback: try article or main content
            const article = document.querySelector('article.blog-post, article');
            if (article) {
                const contentDiv = article.querySelector('.post-content, .container .post-content');
                if (contentDiv) {
                    return contentDiv.innerHTML;
                }
            }
        } else {
            return postContent.innerHTML;
        }
        
        return null;
    } catch (error) {
        console.warn(`  Warning: Failed to parse HTML: ${error.message}`);
        return null;
    }
}

// Helper: Convert HTML to Markdown
function htmlToMarkdown(html) {
    if (!html) return '';
    
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
    });
    
    try {
        return turndownService.turndown(html);
    } catch (error) {
        console.warn(`  Warning: HTML to Markdown conversion failed: ${error.message}`);
        // Fallback: return HTML wrapped in HTML block
        return `\n\n${html}\n\n`;
    }
}

// Ensure directories exist
function ensureDirectories() {
    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }
}

// Migrate blog posts
function migrateBlogPosts() {
    console.log('\n📝 Migrating blog posts...\n');
    
    let posts = [];
    
    // Try to read posts.json
    if (fs.existsSync(LEGACY_POSTS_JSON)) {
        try {
            const content = fs.readFileSync(LEGACY_POSTS_JSON, 'utf-8');
            posts = JSON.parse(content);
            console.log(`  Found ${posts.length} posts in posts.json`);
        } catch (error) {
            console.warn(`  Warning: Failed to parse posts.json: ${error.message}`);
        }
    }
    
    // If no posts.json or empty, scan blog directory
    if (posts.length === 0 && fs.existsSync(LEGACY_BLOG_DIR)) {
        console.log('  No posts.json found, scanning blog/ directory...');
        const htmlFiles = fs.readdirSync(LEGACY_BLOG_DIR)
            .filter(f => f.endsWith('.html') && f !== 'index.html');
        
        posts = htmlFiles.map(file => {
            const slug = path.basename(file, '.html');
            return {
                slug: slug,
                title: slug.replace(/-/g, ' '),
                date: '',
                excerpt: '',
                image: ''
            };
        });
        console.log(`  Found ${posts.length} HTML files in blog/ directory`);
    }
    
    // Process each post
    for (const post of posts) {
        const slug = post.slug || slugify(post.title || 'untitled');
        const outputPath = path.join(BLOG_DIR, `${slug}.md`);
        
        // Skip if file exists and not forcing
        if (fs.existsSync(outputPath) && !FORCE) {
            console.log(`  ⏭️  Skipped: ${slug}.md (already exists, use --force to overwrite)`);
            stats.skipped++;
            continue;
        }
        
        try {
            // Try to read HTML file to extract content
            const htmlPath = path.join(LEGACY_BLOG_DIR, `${slug}.html`);
            let postContent = '';
            
            if (fs.existsSync(htmlPath)) {
                const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
                const extractedHtml = extractPostContent(htmlContent);
                
                if (extractedHtml) {
                    // Remove the featured image from content (it's in frontmatter)
                    const cleanedHtml = extractedHtml.replace(/<img[^>]*class="post-image"[^>]*>/gi, '');
                    postContent = htmlToMarkdown(cleanedHtml).trim();
                } else {
                    console.warn(`  ⚠️  Warning: Could not extract content from ${slug}.html`);
                }
            } else {
                console.warn(`  ⚠️  Warning: HTML file not found for ${slug}.html`);
            }
            
            // Build frontmatter
            const frontmatter = `---
title: ${escapeYamlValue(post.title || slug)}
date: ${escapeYamlValue(post.date || '')}
slug: ${escapeYamlValue(slug)}
excerpt: ${escapeYamlValue(post.excerpt || '')}
image: ${escapeYamlValue(post.image || '')}
---

${postContent || 'Write your post content here in Markdown format.'}
`;

            fs.writeFileSync(outputPath, frontmatter);
            console.log(`  ✅ Created: ${slug}.md`);
            stats.created++;
        } catch (error) {
            console.error(`  ❌ Failed: ${slug}.md - ${error.message}`);
            stats.failed++;
        }
    }
}

// Main migration function
function migrate() {
    console.log('🚀 Starting legacy blog post migration...');
    console.log(FORCE ? '  (--force flag enabled: will overwrite existing files)' : '  (use --force to overwrite existing files)');
    console.log('  Note: Art and portfolio items are manually maintained and are not migrated.\n');
    
    ensureDirectories();
    
    migrateBlogPosts();
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary');
    console.log('='.repeat(50));
    console.log(`  ✅ Created: ${stats.created}`);
    console.log(`  ⏭️  Skipped: ${stats.skipped}`);
    console.log(`  ❌ Failed:  ${stats.failed}`);
    console.log('='.repeat(50));
    
    console.log('\n✨ Migration complete!');
    console.log('   Next step: Run `npm run build` to regenerate posts.json and blog HTML files.\n');
}

// Run migration
if (require.main === module) {
    migrate();
}

module.exports = { migrate };
