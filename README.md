# Isaiah's Corner - Content Pipeline

This repository uses an automated build pipeline to generate blog posts from markdown source files.

**Note**: Art items (`art.json`) and portfolio items (`portfolio.json`) are manually maintained and are not part of the automated build pipeline.

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

## Migrating Legacy Content

If you have existing blog posts that were created before the build pipeline, you can migrate them to the new markdown-based format:

```bash
npm run migrate:legacy
```

This script will:
- Read existing `posts.json` and `blog/*.html` files to create `content/blog/*.md` files

**Note**: The script will skip files that already exist. Use `--force` to overwrite:
```bash
npm run migrate:legacy -- --force
```

After migration, run `npm run build` to regenerate `posts.json` and blog HTML files from the new markdown sources.

## Content Management

### Adding a New Blog Post

1. **Create a new post** (interactive):
   ```bash
   npm run new:post
   ```
   This will prompt you for title, date, slug, excerpt, and image path, then create a markdown file in `content/blog/`.

2. **Or create manually**: Create a markdown file in `content/blog/` with frontmatter:
   ```markdown
   ---
   title: My New Post
   date: May 24, 2025
   slug: my-new-post
   excerpt: A brief description of the post...
   image: photos/my-image.jpg
   ---

   Your post content here in **Markdown** format.
   ```

3. **Build the site**:
   ```bash
   npm run build
   ```
   This generates:
   - `blog/<slug>.html` - The HTML page for your post
   - Updates `posts.json` with the new post metadata

### Art and Portfolio Items

Art items (`art.json`) and portfolio items (`portfolio.json`) are **manually maintained**. Edit these JSON files directly to add, update, or remove items. The build pipeline does not modify these files.

## Build Process

The build script (`build.js`) does the following:

1. **Blog Posts**:
   - Reads all `.md` files from `content/blog/`
   - Extracts frontmatter (title, date, slug, excerpt, image)
   - Converts markdown content to HTML
   - Generates HTML files in `blog/` directory using the post template
   - Generates/updates `posts.json` with all post metadata

**Important**: The build script only modifies `posts.json` and `blog/*.html` files. It does not touch `art.json` or `portfolio.json`.

## Directory Structure

```
.
├── content/              # Source content (your source of truth)
│   └── blog/            # Blog post markdown files
├── blog/                # Generated HTML blog posts
├── posts.json           # Generated from content/blog/
├── art.json             # Manually maintained (not generated)
├── portfolio.json       # Manually maintained (not generated)
├── build.js             # Build script (blog posts only)
├── scripts/             # Helper scripts
│   ├── new-post.js
│   └── migrate-legacy-content.js
└── post-template.html   # Template for blog post HTML
```

## GitHub Pages Deployment

The repository includes a GitHub Actions workflow (`.github/workflows/build.yml`) that:

1. Automatically runs on every push to `main`
2. Installs dependencies
3. Runs the build script
4. Deploys the generated files to GitHub Pages

**Setup Instructions**:
1. Go to your repository Settings → Pages
2. Under "Source", select "GitHub Actions" (not "Deploy from a branch")
3. The workflow will automatically build and deploy on every push to `main`

**Note**: If you're using a custom domain (CNAME file), it will be preserved during deployment.

## Local Development

1. Make changes to content files in `content/blog/`
2. Run `npm run build` to generate HTML and JSON files
3. Test locally (you can use a simple HTTP server like `python -m http.server` or `npx serve`)
4. Commit and push changes

## Tips

- **Dates**: Use consistent date formats (e.g., "May 24, 2025" or "August 2020")
- **Images**: Reference images using paths relative to the site root (e.g., `photos/image.jpg`)
- **Slugs**: If you don't specify a slug, it will be auto-generated from the filename
- **Markdown**: Full markdown support including bold, italic, links, lists, etc.

## Troubleshooting

- **Build fails**: Check that all required frontmatter fields are present
- **Images not showing**: Verify image paths are correct and relative to site root
- **Posts not appearing**: Ensure the markdown file has valid frontmatter and the build completed successfully
