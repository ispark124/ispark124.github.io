# Isaiah's Corner — Full Rebuild Plan

---

## Table of Contents

1. Site Audit
2. Architecture Map
3. Design Direction
4. Content Strategy
5. PRD
6. CLAUDE.md Draft
7. Skills Recommendations
8. Open Questions & Assumptions
9. Recommended Next Step

---

---

# 1. SITE AUDIT

## 1.1 High-Level Summary

Isaiah's Corner is a personal site built as a static HTML/CSS/JS project hosted on GitHub Pages at `www.isaiahscorner.com`. It has five pages: Home, Blog, Art, Portfolio, and About. Content is loaded client-side from JSON files (`posts.json`, `art.json`, `portfolio.json`). Blog posts are individual HTML files built from markdown via a Node.js build script (`build.js`). The site works and is navigable, but the design is generic, the authoring workflow is fragile and high-friction, and the portfolio page is being removed entirely.

**What is working:**
- Navigation is clean and simple
- Content data is already structured in JSON (good migration foundation)
- The build pipeline for blog posts (markdown → HTML) is the right direction
- Art modal interaction is functional
- Mobile hamburger menu works

**What is not working:**
- Visual design is generic — Inter/Cardo/Quicksand stack without a clear aesthetic point of view
- The "active" nav link is hardcoded as `/` on every page — it never correctly highlights the current page
- Logo path (`blog/logo.png`) is inconsistent across pages; some reference `../` and some don't
- Portfolio page is being removed
- No search
- No email subscription
- Adding a new blog post requires: writing markdown, running build.js, committing the generated HTML — too much friction
- `art.json` and `poetry.json` are manually edited with no tooling
- `post-template.html` contains hardcoded content ("summer & love") — it is not a real template, it is a half-finished post that was repurposed
- The `tailwind_config.js` file references Next.js paths (`./pages`, `./components`, `./app`) but the site is plain HTML — Tailwind is not actually used anywhere
- Font-Awesome 4.7 is loaded via CDN for social icons only (heavy for minimal use)
- The Art page CSS uses `column-count: 3` (masonry-like) but then also references `grid-template-columns` — the two layout approaches conflict
- `DOMContentLoaded` fires three separate listeners in `script.js` that could conflict or double-initialize
- Copyright year is dynamically set via JS, which causes a brief flash before it renders
- No `<meta description>` tags on any page
- No Open Graph tags
- No favicon referenced in HTML
- `art.html` title says "My Blog" — wrong
- `about.html` title says "My Blog" — wrong
- About page has no actual written content, just a photo, subtitle, and social links

---

## 1.2 Page Inventory

| Page | File | Status | Disposition |
|---|---|---|---|
| Home | index.html | Active | Keep, redesign |
| Blog (index) | blog.html | Active | Keep, redesign |
| Blog Post | blog/[slug].html (generated) | Active | Keep, improve template |
| Art & Poetry | art.html | Active | Keep, redesign |
| Portfolio | portfolio.html | Active | Remove entirely |
| About | about.html | Active | Keep, needs real content |

---

## 1.3 Content Inventory

| Type | Count | Source | Notes |
|---|---|---|---|
| Blog posts | 39 | posts.json + blog/*.html | All migrate; some are from 2020, some 2025 |
| Art images | ~18 | art.json | Manually curated, keep as-is |
| Poems | ~6 | art.json | Inline text, keep as-is |
| Portfolio items | 4 | portfolio.json | Removed per owner decision |
| About text | 0 | about.html | Page exists but has no prose |

---

## 1.4 IA Critique

- The top-level nav (Home, Blog, Art, Portfolio, About) is appropriate in size
- Portfolio does not belong here and is being removed — correct call
- "Art" conflates visual art and poetry with no way to filter between them; this is worth surfacing more clearly in the UI even if they stay on one page
- The home page has a hero + "Recent Posts" only — it does not introduce Isaiah as a person at all; there is no hook for a new visitor
- There is no way to find a specific post other than scrolling through paginated cards — search is missing
- Blog posts have prev/next navigation (implemented in JS) but it is not visually prominent

---

## 1.5 UX Critique

- Post cards on the blog page show an image, date, title, excerpt, and "Read more →" — this is fine but visually undifferentiated from every other blog
- The art page modal is a good pattern but the close button (×) is small and easy to miss on mobile
- Pagination on the blog is number-only — no "Previous / Next" affordance for context
- The home page hero says "Welcome to Isaiah's Corner" with a single "MISSION" CTA in all caps linking to the welcome post — this is unclear; new visitors won't know what "MISSION" means
- The about page has zero descriptive text — visitors who click About get nothing
- Font sizes in posts are comfortable (18px body) — this is a strength to keep
- The fade-in animation on `.main` is a nice touch; it works but delays all content by 0.8s

---

## 1.6 Design Critique

- Color palette: warm clay/terracotta `rgb(188, 157, 139)` as the single accent on white. This is pleasant but not distinctive. It does not feel intentional — it could belong to any personal site.
- Typography: Three font families are loaded (Cardo, Quicksand, Inter) but Inter is referenced in `:root` and never applied. Cardo is used for headings and article content; Quicksand is the body font. The Cardo/Quicksand combination has potential but needs cleaner hierarchy rules.
- Spacing: `padding: 200px 300px` on the hero on desktop is extreme and breaks on mid-size screens before the mobile breakpoint kicks in
- Post cards use a box shadow + border + hover lift — safe but forgettable
- No visual motif, texture, or personality element ties the pages together
- The logo is an image file — no fallback if it fails to load

---

## 1.7 Accessibility Critique

- No `lang` attribute issues — `<html lang="en">` is present on all pages
- Alt text is present on images but some are generic ("Featured Image", "Author")
- Hamburger menu uses `onclick="hamburger()"` inline — no keyboard accessibility, no ARIA labels, no focus management when the full-screen menu opens
- Art modal has no focus trap — keyboard users can tab behind the modal
- Art modal has no ARIA role (`role="dialog"`, `aria-modal="true"`) 
- Color contrast: the terracotta `rgb(188, 157, 139)` on white is approximately 2.1:1 — this fails WCAG AA (requires 4.5:1 for normal text, 3:1 for large text). This needs to change.
- No skip-to-content link
- `post-card::after` pseudo-element (the underline reveal) has no accessible equivalent

---

## 1.8 SEO Critique

- No `<meta name="description">` on any page
- No Open Graph (`og:title`, `og:description`, `og:image`) on any page
- No `<title>` strategy — `about.html` and `art.html` both say "My Blog" in the title tag
- No canonical URLs
- No sitemap
- No structured data (blog posts would benefit from `Article` schema)
- URLs are good — `/blog/ambition-time.html` is readable (though `.html` extension is not ideal)
- Internal linking is minimal — posts do not link to related posts or back to the blog index

---

## 1.9 Performance Critique

- No image optimization — all images served at original resolution
- No lazy loading on blog post images (only on art/portfolio)
- Three Google Font loads (some duplicated) — could be combined into one request
- Font Awesome CDN loaded for ~2 icons (hamburger, social)
- `script.js` loads all JS for all pages on every page (BlogManager, ArtManager, PortfolioManager all initialize everywhere)
- No caching headers (GitHub Pages default)
- `main { opacity: 0 }` with JS-triggered fade means content is invisible until JS runs — bad for slow connections

---

## 1.10 Technical Risk List

| Risk | Severity | Notes |
|---|---|---|
| Post authoring is high-friction | High | Must be solved in rebuild |
| Active nav link never works correctly | Medium | Hardcoded `class="active"` on Home link |
| Logo path inconsistency | Medium | Some pages break logo |
| Tailwind config is vestigial | Low | Remove to avoid confusion |
| Three DOMContentLoaded listeners | Low | Risk of race condition |
| Art page layout (column-count vs grid) | Low | Could produce unexpected behavior at certain widths |
| No fallback if JSON fetch fails | Medium | Blank page with no error message for user |

---

## 1.11 Migration Risk List

| Item | Risk | Notes |
|---|---|---|
| 39 blog post HTML files | Low | Already generated from markdown; markdown source files are the canonical content |
| posts.json | Low | Well-structured; migrate directly |
| art.json | Low | Well-structured; migrate directly; image paths need normalization |
| Blog post images | Medium | No consistent naming or sizing; some may be missing |
| Art images | Medium | Some paths use `../art/` prefix inconsistently |
| Portfolio page | None | Being removed |
| About page content | High | No prose exists; must be written fresh |

---

---

# 2. ARCHITECTURE MAP

## 2.1 Primary Navigation (post-rebuild)

```
Home  |  Blog  |  Art & Poetry  |  About
```

Portfolio is removed. Four items is the right size for this site.

---

## 2.2 Page Hierarchy

```
/                          → Home
/blog/                     → Blog index (paginated)
/blog/[slug]/              → Individual blog post
/art/                      → Art & Poetry gallery
/about/                    → About Isaiah
```

Moving away from `.html` extensions improves URL cleanliness and is achievable on GitHub Pages with proper configuration.

---

## 2.3 Page Purposes

| Page | Primary Purpose | Secondary Purpose |
|---|---|---|
| Home | Orient new visitors; surface the 3 most recent posts | Create a sense of who Isaiah is |
| Blog | Browse all posts; search | Filter/sort by date |
| Blog Post | Read a single post | Navigate to prev/next post |
| Art & Poetry | Browse visual art and poems | View individual item in full |
| About | Understand who Isaiah is | Follow on social / subscribe to email |

---

## 2.4 Key User Flows

**Flow 1: New visitor landing on home**
Home → reads welcome hero → clicks into recent post → reads post → navigates to blog index or about

**Flow 2: Returning reader**
Home or direct URL → blog index → finds post via scroll or search → reads → uses prev/next

**Flow 3: Creative curious visitor**
Art & Poetry → browses gallery → clicks item → views full image or reads full poem → returns to gallery

**Flow 4: Subscriber**
About → finds email subscribe form → subscribes → receives notification on new post

---

## 2.5 CTA Hierarchy

1. **Primary:** Read a blog post (any post card → full post)
2. **Secondary:** Subscribe for email notifications (About page, potentially footer)
3. **Tertiary:** Browse Art & Poetry / Follow on Instagram/LinkedIn

---

## 2.6 Content Relationships

- Posts are standalone; they do not belong to categories or tags (current behavior; keep for simplicity)
- Art items are standalone; poems and images live together on one page
- No cross-linking between posts and art currently (could be added later)

---

## 2.7 Reusable Components

| Component | Used On |
|---|---|
| Header / Nav | All pages |
| Footer | All pages |
| Post card | Home, Blog index |
| Post prev/next navigation | Blog post |
| Art/poem card | Art & Poetry |
| Art/poem modal | Art & Poetry |
| Search input | Blog index |
| Email subscribe form | About, Footer (optional) |
| Pagination | Blog index |

---

## 2.8 Data Entities (JSON-driven, no CMS)

**Post**
```
title, date, slug, excerpt, image, body (markdown file)
```

**Art Item**
```
title, type (image | poem), image (if image), content (if poem), date (if image)
```

---

## 2.9 What Should Stay, Change, or Go

| Element | Decision |
|---|---|
| JSON-driven content | Stay — it is the right pattern for a static site |
| Markdown-based blog posts | Stay — improve the build pipeline |
| Single `styles.css` | Change — split into component files or use a CSS framework properly |
| `script.js` monolith | Change — split into page-specific modules |
| Post template | Change — make it a real template with all placeholders |
| Portfolio page + JSON | Remove |
| Tailwind config | Remove (or adopt properly) |
| GitHub Pages hosting | Stay |
| CNAME / custom domain | Stay |

---

---

# 3. DESIGN DIRECTION

## 3.1 Design Principles

1. **Warmth over flash.** Isaiah's writing is personal, reflective, and spiritually grounded. The design should feel like a warm room, not a portfolio showcase.
2. **Typography as the primary design element.** This is a reading site. Typography does most of the heavy lifting — the layout should serve the text, not compete with it.
3. **Editorial restraint.** Reference the look of a quality literary journal or independent magazine: generous whitespace, confident type choices, minimal decoration.
4. **Intimacy at scale.** Even as the content library grows, the site should feel like it was made for one person — not a template.
5. **No noise.** No animations for their own sake. No elements that distract from reading.

---

## 3.2 Visual Style Direction

**Reference mood:** A well-designed independent literary magazine. Think Kinfolk editorial layouts, or the typographic confidence of a classic essay collection — not a tech blog.

Not flashy. Not sparse-to-the-point-of-coldness. Warm, unhurried, confident.

The warm terracotta accent (`#BC9D8B`) is a good instinct and should be kept, but needs to be used more intentionally — as a selective accent, not a default link color everywhere.

---

## 3.3 Typography Direction

**Display / Headings:** Retain **Cardo** (serif). It carries the right editorial, literary weight. Use it for post titles, section headers, and the site name. Consider using its italic variant for pull quotes or post dates.

**Body:** Replace **Quicksand** with something with more character. Recommendation: **DM Serif Display** for display-size headings and **Lora** for body text — both are Google Fonts, both have the warmth and readability this content needs. Alternatively, keep Cardo throughout and use weight variation instead of font-family switching.

**Scale (suggested):**
- Site title / hero headline: 56–72px, Cardo, light letter-spacing
- Post title (index card): 22–26px, Cardo
- Post title (full post): 42–48px, Cardo
- Body text (full post): 18–20px, body font, 1.8 line-height
- Caption / meta / date: 13px, body font, slightly muted

**Rules:**
- Never use three font families. Maximum two.
- Inter is not used anywhere in the actual CSS output — remove it from imports entirely.

---

## 3.4 Spacing and Layout Direction

- Max reading width: 720px for blog post body
- Max site width: 1100px container
- Section padding: 80–100px vertical
- Card grid gap: 32px minimum
- Generous line-height in posts (1.8–2.0)
- Home page hero: full-width image with overlay, centered text, significantly less padding than the current `200px 300px` approach

---

## 3.5 Color Direction

| Role | Color | Notes |
|---|---|---|
| Background | `#FDFAF7` (warm off-white) | Slightly warmer than pure white; easier on the eyes for reading |
| Text primary | `#1A1714` (near-black, warm) | Slightly warmer than `#1f2937` |
| Text muted | `#7A6E68` | Warm gray for dates, captions |
| Accent | `#BC9D8B` | Existing terracotta; keep |
| Accent dark | `#8A6D5D` | For hover states on accent elements |
| Border | `#E8E2DC` (warm light) | Slightly warmer than current neutral gray |
| Footer bg | `#F2EDE8` | Warm light gray |

The accent color contrast problem (2.1:1) must be resolved. Use the accent as a decorative element (borders, illustrations, hover backgrounds) rather than text color. For text links, use the primary text color with an underline or the accent dark.

---

## 3.6 Interaction and Motion Direction

- **Page load:** Keep the fade-in on `.main`, but reduce from 0.8s to 0.4s. Start from `opacity: 0` but not from a translated position — the translate makes it feel like the page "falls in."
- **Post card hover:** Subtle box-shadow lift only. No scale transforms — they can feel clumsy.
- **Art modal:** Fade in the overlay (0.2s). No slide-in for the content — just opacity.
- **Navigation:** No hover animation needed beyond color change.
- **No parallax, no scroll-triggered animations, no auto-playing anything.**

---

## 3.7 Mobile Behavior

- Single-column post cards below 640px
- Art & Poetry: single column below 640px, two columns at 640–900px, three columns above 900px
- Hero image: reduce height significantly on mobile; text must remain readable
- Full-screen mobile nav is already implemented and is a good pattern — keep it

---

## 3.8 Accessibility Considerations

- All interactive elements must have visible focus states (outline or ring)
- Art modal must trap focus and use `role="dialog"` + `aria-modal="true"`
- Hamburger menu must be a `<button>` with an `aria-label`, and must manage focus when opened/closed
- Contrast: all text must meet WCAG AA minimum (4.5:1 for body, 3:1 for large text)
- Skip-to-content link in the header (visually hidden until focused)
- All images need descriptive alt text (no "Featured Image")

---

## 3.9 Component Language

- Cards: subtle border (`1px solid border color`) + very light background. No heavy shadows.
- Buttons/CTAs: filled (warm accent) for primary actions; outlined for secondary
- Dividers: thin `1px` warm-toned lines, used sparingly
- Modal: white background, generous internal padding, clear close affordance (× button with label, top-right)
- Poetry display: left-aligned, Cardo italic, `pre-wrap` preserved — no centering (centering poetry is a common mistake)

---

---

# 4. CONTENT STRATEGY

## 4.1 Brand Voice

Isaiah's writing has a distinct voice: **honest, reflective, conversational, and spiritually grounded**. He writes in lowercase titles ("ambition & time"), uses the ampersand as a consistent stylistic signature, and is not afraid of vulnerability. The site should not flatten this into generic "personal brand" speak.

**Voice rules:**
- First person, direct
- Lowercase for post and art titles (stylistic, intentional)
- Ampersands in titles as the site's consistent signature
- Warm but not saccharine
- No marketing copy anywhere on the site

---

## 4.2 Messaging Hierarchy

1. **This is a personal creative space** — not a portfolio, not a resume, not a brand
2. **Writing and art as a way of processing life** — growth, faith, identity, creativity
3. **An invitation to read along** — the site is open, not exclusive

---

## 4.3 Homepage Narrative

The home page currently has a hero image, a "Welcome to Isaiah's Corner" headline, and a "MISSION" CTA. This is too abstract.

**Recommended approach:**
- Hero: retain the background photo + headline, but rewrite the headline and CTA
- Headline: something like *"Isaiah's Corner"* as the site name, with a single line beneath it that is a real sentence — e.g., "Writing through life as I find it."
- CTA: change "MISSION" to "Start Here" or link directly to the most representative introductory post ("welcome & hello")
- Recent Posts: the 3-card grid is correct. Rename the section heading from "Recent Posts" to something warmer — "From the Blog" or just "Recent Writing."
- No other sections needed on the home page. It should not try to explain everything — it should invite.

---

## 4.4 Section-by-Section Content Goals

**Blog index:** Let the posts speak. The page title "All Posts" is fine. Add a short one-line descriptor beneath it: e.g., "Thoughts on faith, creativity, identity, and the everyday." This gives new visitors context without requiring them to click a separate About page.

**Individual blog post:** Posts already have titles and dates. The featured image is a nice element. The post body content is strong. The only thing to add is: a consistent byline or small author chip ("Isaiah Park") and the prev/next navigation made more visually prominent.

**Art & Poetry:** Title is fine. Add a short descriptor: "Visual art and poems." Consider labeling each card type clearly (a small "poem" or "art" badge) so visitors know what they're looking at before clicking.

**About:** This page currently has zero prose. It needs to be written. Suggested structure:
- Profile photo (already present)
- Name + subtitle (already present: "Son. Student. Friend. Creative.")
- 2–3 paragraphs: who Isaiah is, why this site exists, what he's studying/doing
- Social links (already present: Instagram, LinkedIn)
- Email subscribe form (new)

---

## 4.5 CTA Language Direction

| Context | Current | Recommended |
|---|---|---|
| Home hero | "MISSION" | "Start Here" or "Welcome Post" |
| Post card | "Read more →" | Keep as-is |
| Blog index | "View All Posts →" | Keep as-is |
| About subscribe | (none) | "Get notified when I post" |

---

## 4.6 SEO Topic Priorities

This site is personal and not SEO-driven. Priority should be on:
- Correct page titles (each page has a unique, descriptive `<title>`)
- Meta descriptions on every page and every post
- Open Graph tags for sharing on social (Instagram audience)
- Clean URLs without `.html`

Keyword targeting is not relevant here.

---

## 4.7 Content Gaps

| Gap | Priority |
|---|---|
| About page prose | Critical — page is empty |
| Meta descriptions for all pages | High |
| Alt text for all images | High |
| OG images for posts (for social sharing) | Medium |

---

## 4.8 Content Migration Plan

| Content | Action |
|---|---|
| All 39 blog posts | Migrate markdown files as-is; rebuild HTML |
| posts.json | Migrate as-is; add `description` field for meta descriptions |
| Art images | Migrate as-is; audit file paths for consistency |
| Poems in art.json | Migrate as-is |
| Portfolio page | Delete |
| portfolio.json | Delete |
| About page | Rewrite from scratch |

---

---

# 5. PRD

## Project Overview

**Project:** Isaiah's Corner — Site Redesign and Workflow Rebuild
**Owner:** Isaiah Park
**Site:** www.isaiahscorner.com
**Hosting:** GitHub Pages
**Stack:** Static HTML/CSS/JS, Node.js build pipeline, GitHub Actions (optional for automation)

---

## Problem Statement

The current site is functional but has two core problems:

1. **Design:** The visual design is generic and lacks a clear aesthetic identity that matches the quality and character of Isaiah's writing and art.
2. **Workflow:** Adding new blog posts requires manually writing markdown, running a build script, committing generated HTML, and pushing — creating too much friction, which discourages posting.

---

## Goals

1. Redesign the site with a warm, editorial, literary aesthetic that reflects Isaiah's voice
2. Reduce new-post authoring to: write markdown → commit → done (build happens automatically)
3. Remove the portfolio page
4. Add search to the blog index
5. Fix all accessibility and technical issues identified in the audit

---

## Non-Goals

- No CMS integration
- No user accounts
- No comments section
- No paid features
- No backend server
- No AI features
- No analytics beyond what GitHub Pages provides (or a simple privacy-respecting tool added later)

---

## Target Audience

Friends and peers of Isaiah Park who follow his writing, art, and creative work. Mostly discovered via Instagram or direct sharing. Not a professional audience — this is a personal creative site.

---

## Success Metrics

| Metric | Target |
|---|---|
| Time to publish a new blog post | Under 5 minutes (write + commit) |
| All pages have correct `<title>` and `<meta description>` | 100% |
| WCAG AA contrast ratio met | All text elements |
| Modal accessibility (focus trap, ARIA) | Implemented |
| Site loads with no JS errors in console | 0 errors |
| About page has real written content | Done at launch |

---

## Current State Summary

See Section 1 (Site Audit). The site is a custom static HTML/CSS/JS project with a Node.js build pipeline. Five pages. 39 blog posts. ~24 art/poetry items. Hosted on GitHub Pages with a custom domain.

---

## Scope

**In scope for this rebuild:**

- Full visual redesign (HTML, CSS)
- Typography and color system refresh
- Home page redesign (hero, recent posts section)
- Blog index redesign (with search)
- Blog post template redesign
- Art & Poetry page redesign
- About page (with real content + email subscribe form)
- Fix all broken nav active states
- Fix all logo path inconsistencies
- Fix mobile hamburger menu accessibility
- Fix art modal accessibility (focus trap, ARIA)
- Add skip-to-content link
- Add meta descriptions to all pages and posts (via frontmatter + build pipeline)
- Add Open Graph tags to all pages and posts
- Automate build via GitHub Actions (markdown commit → auto-build → deploy)
- Remove portfolio page and all references to it
- Remove Tailwind config vestige
- Remove Font Awesome dependency (replace with inline SVG icons)
- Consolidate font imports (maximum 2 families)
- Add search to blog index (client-side, JSON-based)
- Add email subscribe form to About page (service TBD — Buttondown, Substack, or similar free tier)

**Out of scope:**

- Server-side rendering or framework migration
- CMS
- Comments
- Analytics
- Portfolio page (being removed)
- AI features

---

## Requirements

### Page Requirements

**All pages:**
- Correct `<title>` tag (format: "[Page Name] — Isaiah's Corner")
- `<meta name="description">` tag
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Skip-to-content link (visually hidden, revealed on focus)
- Correct active nav link for current page
- Consistent logo path (single canonical path, no `../` inconsistencies)
- Footer with dynamic copyright year (no JS flash — use server-rendered or build-time injection)
- No Font Awesome dependency — replace social and hamburger icons with inline SVG

**Home:**
- Hero section with background image, site name, one-sentence descriptor, and "Start Here" CTA
- Recent Writing section: 3 most recent posts, card layout
- "View all posts →" link

**Blog index:**
- "All Posts" heading with a brief descriptor line
- Card grid, paginated (9 per page)
- Client-side search input (filters cards by title/excerpt in real time)
- Pagination with previous/next controls in addition to page numbers

**Blog post:**
- Title (Cardo, large)
- Date (muted, below title)
- Featured image (if present in frontmatter)
- Body content (rendered from markdown)
- Prev/next post navigation (prominent)
- Author byline: "Isaiah Park"

**Art & Poetry:**
- Gallery title with "Visual art and poems" descriptor
- Masonry-style grid (CSS column-count, cleaned up)
- Type badge on each card ("art" or "poem")
- Click → modal with full image or full poem
- Modal: `role="dialog"`, `aria-modal="true"`, focus trap, ESC to close

**About:**
- Profile photo
- Name and subtitle
- Written bio (2–3 paragraphs — Isaiah to write)
- Social links (Instagram, LinkedIn) as accessible links with SVG icons
- Email subscribe form

---

### Feature Requirements

**Client-side search:**
- Input field on blog index page
- Filters post cards in real time as user types
- Searches post title and excerpt
- Shows "No posts found" message if no match
- No external library required — plain JS filter on the already-loaded posts array

**Email subscribe:**
- Embedded form from a free email service (Buttondown or Substack recommended for simplicity)
- Form on About page
- Optionally in the footer

**GitHub Actions build:**
- Trigger: push to main branch
- Steps: install dependencies → run `build.js` → commit generated HTML back to repo (or deploy to Pages directly)
- Result: Isaiah pushes a markdown file; the site updates automatically without manually running the build

---

### Content Requirements

- About page prose: 2–3 paragraphs (Isaiah to write before launch)
- All 39 posts: slugs, titles, dates, excerpts, images preserved
- All art/poetry: preserved exactly as in art.json
- Meta descriptions: either written per-post or auto-generated from excerpt field in posts.json

---

### Design Requirements

See Section 3 (Design Direction) in full. Summary:
- Warm off-white background (`#FDFAF7`)
- Near-black warm text (`#1A1714`)
- Terracotta accent (`#BC9D8B`) used decoratively, not as text color
- Maximum two font families (Cardo + Lora recommended, or Cardo throughout)
- Editorial, literary aesthetic
- No heavy shadows, no flashy animations

---

### Technical Requirements

- Static HTML/CSS/JS output — no framework required
- Node.js build script (`build.js`) for markdown → HTML
- GitHub Actions workflow for automated builds on push
- GitHub Pages deployment with custom domain (CNAME preserved)
- JSON data files (`posts.json`, `art.json`) remain the content source of truth
- No Tailwind (remove config)
- No Font Awesome (replace with inline SVG)
- Lazy loading on all images not in the initial viewport
- All JS split by page concern (no single monolith running on every page)

---

### Accessibility Requirements

- WCAG 2.1 AA for all text contrast
- Skip-to-content link
- Hamburger menu: `<button>` with `aria-label`, focus management
- Art modal: `role="dialog"`, `aria-modal="true"`, focus trap, ESC closes
- All images: descriptive alt text
- Focus visible on all interactive elements

---

### SEO Requirements

- Unique `<title>` per page and per post
- `<meta name="description">` per page and per post
- Open Graph tags on all pages
- No `.html` extensions in URLs (or redirect from `.html` to clean URLs if GitHub Pages supports it)
- Proper heading hierarchy (`<h1>` → `<h2>` → etc.)

---

### Migration Requirements

- All 39 blog posts preserved (markdown source + generated HTML)
- posts.json updated to include `description` field
- art.json image paths normalized (remove `../` inconsistencies)
- portfolio.html and portfolio.json deleted
- All nav links pointing to portfolio removed

---

### Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| gray-matter | Parse markdown frontmatter | Keep |
| marked | Markdown → HTML | Keep |
| GitHub Actions | Automated build | New |
| Email service (Buttondown / Substack) | Subscribe form | Isaiah to choose |

---

### Risks

| Risk | Mitigation |
|---|---|
| About page content not written before launch | Placeholder can launch; content added in first post-launch commit |
| GitHub Actions build loop (build commits trigger another build) | Use `[skip ci]` in commit message from the Action |
| Email service free tier limits | Start with Buttondown (free for small lists); migrate if needed |
| Image paths inconsistent across art.json | Audit and normalize all paths before migration |

---

### Assumptions

- Isaiah will write the About page prose before or shortly after launch
- The site will remain on GitHub Pages (no hosting migration)
- No framework migration — the site stays as plain HTML/CSS/JS
- Email subscription service will be chosen before launch

---

### Open Questions

- Which email subscription service? (Buttondown recommended for simplicity)
   Answer: ignore for now, will implement later.
- Should blog post URLs drop the `.html` extension? (GitHub Pages supports this with a workaround)
   Answer: Yes, drop `.html` extension
- Should poetry and visual art be on separate pages or remain combined?
- Should the search field be always-visible or icon-triggered?
   Answer: have it be icon-triggered

---

### Phased Roadmap

**Phase 1 — Foundation (ship this)**
- Full visual redesign (all pages)
- Remove portfolio
- Fix all nav, logo, and title bugs
- Add meta/OG tags
- Fix accessibility issues (modal, hamburger, contrast)
- GitHub Actions automated build

**Phase 2 — Content and engagement**
- About page with real prose
- Email subscribe form
- Client-side search on blog index

**Phase 3 — Polish (post-launch)**
- "Art" vs "Poem" badges on art page cards
- Open Graph images for posts
- Clean URLs (drop `.html`)
- Prev/next navigation visual improvement

---

---

# 6. CLAUDE.md DRAFT

```markdown
# CLAUDE.md — Isaiah's Corner

## Project Summary

Isaiah's Corner is a personal creative website at www.isaiahscorner.com, hosted on GitHub Pages. It is a static HTML/CSS/JS site with a Node.js build pipeline. Isaiah writes blog posts in markdown; the build script converts them to HTML. Art and poetry are stored in art.json and loaded client-side. No framework. No CMS. No server.

---

## Product Goals

1. A warm, editorial, personal site that reflects Isaiah's voice
2. Low-friction content authoring (write markdown → commit → done)
3. Accessible, readable, and visually intentional

---

## Architecture Decisions

- Static HTML only — no framework, no SSR, no React
- Content source of truth: markdown files for posts, art.json for art/poetry
- Build pipeline: `build.js` (Node.js) converts markdown → HTML and writes posts.json
- Data loaded client-side via `fetch()` on relevant pages
- Hosted on GitHub Pages; custom domain via CNAME
- GitHub Actions handles automated builds on push to main

---

## Stack

- HTML5, CSS3, vanilla JS (ES6+)
- Node.js (build only, not served)
- gray-matter (frontmatter parsing)
- marked (markdown → HTML)
- Google Fonts: Cardo + Lora (maximum two families)
- No Tailwind
- No Font Awesome — use inline SVG for all icons
- No jQuery

---

## Page Structure Conventions

- Every page must have: `<html lang="en">`, a unique `<title>` in the format "[Page] — Isaiah's Corner", a `<meta name="description">`, and Open Graph tags
- Nav active state must be set dynamically based on `window.location.pathname` — never hardcoded in HTML
- Logo `src` must use an absolute path from root (`/blog/logo.png`) — no `../` references
- Footer copyright year must be injected at build time, not by JS, to avoid flash
- Skip-to-content link must be the first element inside `<body>` on every page

---

## Component Conventions

- Post cards: `<article class="post-card">` wrapping an `<a>` — not the reverse
- Art modal: must include `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title, and a focus trap
- Hamburger button: must be a `<button>` element with `aria-label="Open navigation"` and `aria-expanded` state
- Pagination: must include both numbered page links and previous/next buttons

---

## Content Rules

- Post titles use lowercase and ampersands as stylistic signature — preserve exactly as written
- Poem line breaks are preserved with `white-space: pre-wrap` — never convert to `<br>` in CSS
- Excerpts in posts.json should be plain text, no HTML
- art.json and portfolio.json (if it exists) are manually maintained — build.js must never write to them
- Blog posts must have these frontmatter fields: `title`, `date`, `slug`, `excerpt`, `image` (optional)

---

## Accessibility Rules

- All text must meet WCAG 2.1 AA contrast ratio (4.5:1 for body text, 3:1 for large text)
- The terracotta accent color (#BC9D8B) must NOT be used as text color — use it decoratively only
- All images must have descriptive alt text — never "Featured Image" or empty alt on non-decorative images
- All modals must trap focus and be closeable via ESC
- All interactive elements must have visible focus styles
- Never use `onclick` inline on HTML elements — use addEventListener in JS

---

## SEO Rules

- Every page and every generated post must have a unique `<title>` and `<meta name="description">`
- Open Graph tags required: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Heading hierarchy: one `<h1>` per page, `<h2>` for sections, `<h3>` for sub-items
- Internal links must use root-relative paths (`/blog/slug.html`), not relative paths

---

## Testing Expectations

Before any commit that changes templates or CSS:
- Open home, blog index, one blog post, art page, and about page in browser
- Check: no console errors, no broken images, correct active nav link, footer year correct
- Resize to 375px and confirm mobile nav works and content is readable
- Tab through the page and confirm focus is visible on all interactive elements

---

## Do Not Rules

- Do not write to art.json or portfolio.json from any script
- Do not use three or more font families
- Do not use Font Awesome
- Do not use Tailwind unless it has been properly installed and configured
- Do not hardcode the active nav link in HTML
- Do not use `../` for logo or asset paths — use root-relative paths
- Do not add inline styles in HTML — use CSS classes
- Do not use `onclick=""` attributes — use addEventListener
- Do not load all page-specific JS on every page — scope JS to the pages that need it
- Do not generate or modify portfolio.html — it has been intentionally removed

---

## Review Checkpoints

After Phase 1 implementation, verify:
- [ ] Portfolio page and all links to it are removed
- [ ] All pages have correct title, meta description, and OG tags
- [ ] Nav active state works correctly on all pages
- [ ] Logo loads on all pages
- [ ] Mobile hamburger is accessible (button, aria-label, focus management)
- [ ] Art modal is accessible (dialog role, focus trap, ESC)
- [ ] Accent color passes contrast check when used on text
- [ ] GitHub Actions build runs successfully on push
- [ ] No console errors on any page
```

---

### Optional: Repository-Level Addendum

Place this as a comment block at the top of `build.js`:

```
// BUILD RULES:
// - This script reads from content/blog/*.md and writes to blog/*.html and posts.json
// - It must never write to art.json or portfolio.json
// - Frontmatter fields required: title, date, slug, excerpt
// - Run via: npm run build
// - In production: GitHub Actions runs this on every push to main
```

---

---

# 7. SKILLS RECOMMENDATIONS

## Skill 1: `new-post`

**Purpose:** Create a new blog post file with correct frontmatter pre-filled.
**When to use:** Every time Isaiah wants to write a new post.
**When NOT to use:** For editing existing posts, or for creating art/poetry entries.
**Inputs:** Post title (and optionally a slug and image path)
**Outputs:** A new `.md` file in `content/blog/` with frontmatter populated and a placeholder body
**Why a skill, not CLAUDE.md:** This is a procedure (create file, fill fields, confirm path), not a persistent fact.

**Steps:**
1. Confirm the post title with Isaiah
2. Generate slug from title (lowercase, hyphens, strip special chars)
3. Create `/content/blog/[slug].md` with this frontmatter:
   ```
   ---
   title: "post title here"
   date: "Month DD, YYYY"
   slug: "slug-here"
   excerpt: ""
   image: ""
   ---
   ```
4. Confirm the file was created at the correct path
5. Remind Isaiah to fill in the excerpt and image fields in frontmatter before committing

---

## Skill 2: `new-art-entry`

**Purpose:** Add a new art image or poem entry to `art.json`.
**When to use:** When Isaiah creates a new piece of visual art or writes a new poem.
**When NOT to use:** For blog posts (use `new-post`).
**Inputs:** Title, type (image or poem), and either image path or poem text
**Outputs:** A new entry added to `art.json` in the correct format
**Why a skill:** Adding to a JSON file has a specific schema and guardrails; it should not be freeform.

**Steps:**
1. Ask: is this a poem or an image?
2. For image: `{ "title": "...", "image": "art/filename.jpg", "date": "Month YYYY" }`
3. For poem: `{ "title": "...", "type": "poem", "content": "poem text here with \n for line breaks" }`
4. Append to the bottom of the array in `art.json`
5. Confirm the JSON is still valid (no trailing commas, brackets balanced)

---

## Skill 3: `page-qa`

**Purpose:** Run a pre-commit quality check on any changed page.
**When to use:** Before committing any template, CSS, or JS change.
**When NOT to use:** For markdown-only content changes (those only need a build check).
**Inputs:** The page(s) that changed
**Outputs:** A checklist result with pass/fail per item
**Why a skill:** This is a repeatable checklist procedure, not a design rule.

**Checklist:**
- [ ] `<title>` is unique and matches format "[Page] — Isaiah's Corner"
- [ ] `<meta name="description">` exists
- [ ] Open Graph tags present
- [ ] Nav active link is dynamically set (not hardcoded in HTML)
- [ ] Logo path is root-relative
- [ ] No console errors (check by reading JS and looking for obvious issues)
- [ ] Mobile: single column at 375px
- [ ] Focus visible on all interactive elements
- [ ] No Font Awesome classes present
- [ ] No inline `style=""` attributes
- [ ] No `onclick=""` inline attributes
- [ ] No references to `/portfolio.html`

---

## Skill 4: `github-actions-setup`

**Purpose:** Set up the GitHub Actions workflow for automated builds.
**When to use:** Once, during Phase 1 implementation.
**When NOT to use:** After it is set up and working.
**Inputs:** The repository structure, branch name (main)
**Outputs:** `.github/workflows/build.yml` file
**Why a skill:** This is a one-time setup procedure with specific steps.

**Steps:**
1. Create `.github/workflows/build.yml`
2. Trigger: `push` to `main`, paths: `content/blog/**`
3. Steps: `checkout` → `setup-node` → `npm install` → `npm run build` → `commit and push generated files` using `[skip ci]` in commit message
4. Confirm: test with a dummy commit and verify the Action runs and the generated HTML appears

---

---

# 8. OPEN QUESTIONS AND ASSUMPTIONS

## Open Questions

| Question | Who decides | Notes |
|---|---|---|
| Which email subscription service? | Isaiah | Buttondown recommended (free, simple embed) |
| Should poetry and art stay on one page or split? | Isaiah | Current: combined. Splitting adds navigation complexity |
| Should search be always-visible or icon-triggered? | Isaiah | Icon-triggered is cleaner |
| Should blog URLs drop `.html`? | Isaiah | Cleaner URLs, requires GitHub Pages workaround (`404.html` redirect trick) |
| Will Isaiah write the About page prose before launch? | Isaiah | Placeholder can ship; prose added post-launch |

## Assumptions

- The site stays on GitHub Pages
- No framework adoption — plain HTML/CSS/JS
- Isaiah is the sole author and maintainer
- The warm terracotta accent color is a keeper (only its usage changes, not the color itself)
- Cardo is kept as the primary display font, Lora for body text.

---

---

# 9. RECOMMENDED NEXT STEP

**Before any code is written, do two things:**

1. **Isaiah: choose an email subscription service.** Buttondown (buttondown.email) is the recommendation — free for small lists, simple embed code, no tracking bloat. Sign up, create a form, and have the embed code ready.

2. **Isaiah: write the About page prose.** Even a rough draft — 2–3 paragraphs about who you are, why the site exists, what you're studying. This is the only content gap that blocks the site from feeling complete at launch.

**Then, implementation begins in this order:**

1. Set up GitHub Actions build workflow (Phase 1 foundation)
2. Redesign CSS (color, typography, spacing system)
3. Redesign HTML templates (all pages)
4. Fix all technical bugs (nav active state, logo paths, title tags, meta tags)
5. Remove portfolio
6. Fix accessibility issues (modal, hamburger)
7. Add search (blog index)
8. Add email subscribe (About page)
9. QA across all pages
10. Deploy
```
