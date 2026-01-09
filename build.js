const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Helper function to escape HTML attributes
function escapeHtmlAttribute(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')  // Must be first
        .replace(/"/g, '&quot;')  // Escape double quotes
        .replace(/'/g, '&#x27;')  // Escape single quotes
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Guardrail: Prevent accidental writes to art.json or portfolio.json
function validateOutputPath(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (normalizedPath.includes('/art.json') || normalizedPath.includes('/portfolio.json')) {
        throw new Error(`ERROR: build.js is not allowed to write to ${filePath}. Art and portfolio JSON files are manually maintained.`);
    }
}

// Configuration
const CONTENT_DIR = path.join(__dirname, 'content');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');
const OUTPUT_DIR = __dirname;
const BLOG_OUTPUT_DIR = path.join(OUTPUT_DIR, 'blog');
const TEMPLATE_DIR = path.join(__dirname, 'templates');

// Ensure output directories exist
if (!fs.existsSync(BLOG_OUTPUT_DIR)) {
    fs.mkdirSync(BLOG_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(TEMPLATE_DIR)) {
    fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
}

// Read template file
function getPostTemplate() {
    const templatePath = path.join(__dirname, 'post-template.html');
    if (fs.existsSync(templatePath)) {
        return fs.readFileSync(templatePath, 'utf-8');
    }
    // Fallback template
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Cardo:ital,wght@0,400;0,700;1,400&family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header__inner">
                <a class="logo" href="/">
                    <img src="logo.png" alt="Logo" class="logo-image">
                </a>
                <div class="topnav" id="myTopnav">
                    <a href="/" class="active">Home</a>
                    <a href="/blog.html">Blog</a>
                    <a href="/art.html">Art</a>
                    <a href="/portfolio.html">Portfolio</a>
                    <a href="/about.html">About</a>
                    <a href="javascript:void(0);" class="icon" onclick="hamburger()">
                      <i class="fa fa-bars"></i>
                    </a>
                  </div>
            </div>
        </div>
    </header>

    <main class="main">
        <article class="blog-post">
            <div class="container">
                <header class="post-header">
                    <h1 class="title">{{TITLE}}</h1>
                    <div class="post-meta">
                        <span class="post-date">{{DATE}}</span>
                    </div>
                </header>
                <div class="post-content">
                    {{FEATURED_IMAGE}}
                    {{CONTENT}}
                 </div>
            </div>
        </article>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer__inner">
                <div class="footer__copyright">
                    © 2025 Isaiah's Corner. All rights reserved.
                </div>
            </div>
        </div>
    </footer>

    <script src="../script.js"></script>
</body>
</html>`;
}

// Build blog posts
function buildBlogPosts() {
    if (!fs.existsSync(BLOG_DIR)) {
        console.log('No content/blog directory found. Skipping blog posts.');
        return [];
    }

    const posts = [];
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));

    files.forEach(file => {
        const filePath = path.join(BLOG_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        // Generate slug from filename if not provided
        const slug = data.slug || path.basename(file, '.md');
        
        // Format date consistently
        let dateStr = data.date;
        if (dateStr instanceof Date) {
            dateStr = dateStr.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        // Convert markdown to HTML
        const htmlContent = marked(content);

        // Generate HTML file
        let template = getPostTemplate();
        
        // Replace title (non-greedy match)
        template = template.replace(/<h1 class="title">[^<]*<\/h1>/, `<h1 class="title">${(data.title || slug).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h1>`);
        
        // Replace date (non-greedy match)
        template = template.replace(/<span class="post-date">[^<]*<\/span>/, `<span class="post-date">${(dateStr || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`);
        
        // Replace featured image and content
        const imagePath = data.image ? `../${data.image}` : '';
        const escapedImagePath = escapeHtmlAttribute(imagePath);
        const imageHtml = imagePath ? `<img src="${escapedImagePath}" alt="Featured Image" class="post-image">` : '';
        
        // Find the post-content div and replace its contents
        const contentDivMatch = template.match(/(<div class="post-content">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/article>)/);
        if (contentDivMatch) {
            const newContent = `\n                    ${imageHtml ? '<!-- Featured Image -->\n                    ' + imageHtml + '\n' : ''}${htmlContent}\n                 `;
            template = template.replace(
                contentDivMatch[0],
                contentDivMatch[1] + newContent + contentDivMatch[3]
            );
        } else {
            // Fallback: try simple replacement
            template = template.replace('<!-- Post Content -->', imageHtml + '\n' + htmlContent);
        }

        const outputPath = path.join(BLOG_OUTPUT_DIR, `${slug}.html`);
        // Guardrail: Only allow writing to blog/*.html
        validateOutputPath(outputPath);
        fs.writeFileSync(outputPath, template);

        // Add to posts array for JSON
        posts.push({
            title: data.title || slug,
            date: dateStr || '',
            slug: slug,
            excerpt: data.excerpt || content.substring(0, 150).replace(/\n/g, ' ') + '...',
            image: data.image || ''
        });

        console.log(`✓ Generated blog post: ${slug}.html`);
    });

    // Write posts.json
    const postsJsonPath = path.join(OUTPUT_DIR, 'posts.json');
    // Guardrail: Ensure we're only writing posts.json
    validateOutputPath(postsJsonPath);
    fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2));
    console.log(`✓ Generated posts.json with ${posts.length} posts`);

    return posts;
}

// Main build function
function build() {
    console.log('🚀 Starting build process...\n');
    
    try {
        buildBlogPosts();
        
        console.log('\n✅ Build complete!');
    } catch (error) {
        console.error('\n❌ Build failed:', error);
        process.exit(1);
    }
}

// Run build if called directly
if (require.main === module) {
    build();
}

module.exports = { build, buildBlogPosts };
