// Add this at the beginning of your script.js file
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in effect
    const mainContent = document.querySelector('.main');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }

    // Set active navigation link
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav__link, .topnav a:not(.icon)');
    
    // First, remove all active classes
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Then set active class only for the current page
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Normalize the paths for comparison
        const normalizedHref = href.replace(/^\.\//, '').replace(/\/$/, '');
        const normalizedCurrentPage = currentPage.replace(/^\.\//, '').replace(/\/$/, '');
        
        // For home page
        if (normalizedCurrentPage === '' || normalizedCurrentPage === 'index.html') {
            if (normalizedHref === 'index.html' || normalizedHref === '') {
                link.classList.add('active');
            }
        } 
        // For other pages
        else if (normalizedCurrentPage === normalizedHref) {
            link.classList.add('active');
        }
    });

    // Add blog-page class to body if we're on the blog page
    if (currentPage.includes('blog.html')) {
        document.body.classList.add('blog-page');
    }

    // Art page category filtering
    const artItems = document.querySelectorAll('.art-item');

    // Set dynamic copyright year
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

});

function hamburger() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }

// Blog post handling
class BlogManager {
    constructor() {
        this.posts = [];
        this.currentPage = 1;
        this.postsPerPage = 9;
        this.isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';
        this.currentPostSlug = window.location.pathname.split('/').pop().replace('.html', '');
    }

    async loadPosts() {
        try {
            // Fetch the blog posts metadata from a JSON file
            // Use relative path for GitHub Pages compatibility
            const basePath = window.location.pathname.includes('/blog/') ? '../' : '';
            const response = await fetch(`${basePath}posts.json`);
            this.posts = await response.json();
            
            // Sort posts by date (newest first)
            this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Render posts and pagination
            this.renderPosts();
            if (!this.isHomePage) {
                this.renderPagination();
            }

            // Add navigation if we're on a blog post page
            if (this.currentPostSlug && this.currentPostSlug !== 'blog') {
                this.renderPostNavigation();
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    renderPosts() {
        const postsContainer = document.querySelector('.posts-grid');
        if (!postsContainer) return;

        // Clear existing posts
        postsContainer.innerHTML = '';

        // Determine how many posts to show
        const postsToShow = this.isHomePage 
            ? this.posts.slice(0, 3) // Show only 3 posts on home page
            : this.posts.slice((this.currentPage - 1) * this.postsPerPage, this.currentPage * this.postsPerPage);

        postsToShow.forEach(post => {
            const postElement = this.createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }

    renderPagination() {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        // Clear existing pagination
        paginationContainer.innerHTML = '';

        // Calculate total number of pages
        const totalPages = Math.ceil(this.posts.length / this.postsPerPage);

        // Create page numbers
        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('div');
            pageNumber.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            pageNumber.addEventListener('click', () => {
                this.currentPage = i;
                this.renderPosts();
                this.renderPagination();
                // Smooth scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
            paginationContainer.appendChild(pageNumber);
        }
    }

    createPostElement(post) {
        const article = document.createElement('article');
        article.className = 'post-card';
        article.innerHTML = `
            <a href="blog/${post.slug}.html" class="post-link">
                <div class="post-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="post-content">
                    <div class="post-meta">
                        <span class="post-date">${post.date}</span>
                    </div>
                    <h2 class="title">${post.title}</h2>
                    <p class="post-excerpt">${post.excerpt}</p>
                    <div class="post-footer">
                        <span class="read-more">Read more →</span>
                    </div>
                </div>
            </a>
        `;
        return article;
    }

    renderPostNavigation() {
        const currentIndex = this.posts.findIndex(post => post.slug === this.currentPostSlug);
        if (currentIndex === -1) return;

        const prevPost = this.posts[currentIndex + 1]; // Next post in chronological order
        const nextPost = this.posts[currentIndex - 1]; // Previous post in chronological order

        const navigationContainer = document.createElement('div');
        navigationContainer.className = 'post-navigation';
        navigationContainer.innerHTML = `
            <div class="post-navigation__inner">
                ${prevPost ? `
                    <a href="${prevPost.slug}.html" class="post-navigation__link post-navigation__link--prev">
                        <span class="post-navigation__label">Previous Post</span>
                        <span class="post-navigation__title">${prevPost.title}</span>
                    </a>
                ` : '<div></div>'}
                ${nextPost ? `
                    <a href="${nextPost.slug}.html" class="post-navigation__link post-navigation__link--next">
                        <span class="post-navigation__label">Next Post</span>
                        <span class="post-navigation__title">${nextPost.title}</span>
                    </a>
                ` : '<div></div>'}
            </div>
        `;

        // Insert navigation before the footer
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.parentNode.insertBefore(navigationContainer, footer);
        }
    }
}

// Initialize blog manager
const blogManager = new BlogManager();

// Load posts when the page loads
document.addEventListener('DOMContentLoaded', () => {
    blogManager.loadPosts();
});

// Art Manager class
class ArtManager {
    constructor() {
        this.artItems = [];
        this.artGrid = document.getElementById('artGrid');
    }

    async loadArtItems() {
        try {
            // Use relative path for GitHub Pages compatibility
            const basePath = window.location.pathname.includes('/blog/') ? '../' : '';
            const response = await fetch(`${basePath}art.json`);
            this.artItems = await response.json();
            await this.renderArtItems();
        } catch (error) {
            console.error('Error loading art items:', error);
        }
    }

    async renderArtItems() {
        if (!this.artGrid) return;

        this.artGrid.innerHTML = '';
        
        // Create and append all items first
        const itemPromises = this.artItems.map(item => {
            const artElement = this.createArtElement(item);
            this.artGrid.appendChild(artElement);
            
            // For image items, wait for the image to load to get its dimensions
            if (!item.type || item.type !== 'poem') {
                return new Promise((resolve) => {
                    const img = artElement.querySelector('img');
                    if (img.complete) {
                        this.setGridSpan(artElement, img);
                        resolve();
                    } else {
                        img.onload = () => {
                            this.setGridSpan(artElement, img);
                            resolve();
                        };
                    }
                });
            }
            return Promise.resolve();
        });

        await Promise.all(itemPromises);
    }

    setGridSpan(element, img) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const rowSpan = Math.ceil(aspectRatio * 2); // Adjust multiplier to control height
        element.style.gridRow = `span ${rowSpan}`;
    }

    createArtElement(item) {
        const artItem = document.createElement('div');
        artItem.className = 'art-item';
        
        let content = '';
        if (item.type === 'poem') {
            content = `
                <div class="art-content poetry">
                    <h3>${item.title}</h3>
                    <div class="poem-text">
                        <p>${item.content.replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
        } else {
            content = `
                <div class="art-image">
                    <img src="${item.image}" alt="${item.title}" loading="lazy">
                </div>
            `;
        }
        
        artItem.innerHTML = content;
        
        // Add click event listener
        artItem.addEventListener('click', () => {
            this.showArtModal(item);
        });

        return artItem;
    }

    showArtModal(item) {
        const modal = document.createElement('div');
        modal.className = 'art-modal';
        
        let modalContent = '';
        if (item.type === 'poem') {
            modalContent = `
                <div class="art-modal__content">
                    <button class="art-modal__close">&times;</button>
                    <article class="art-full">
                        <header class="art-full__header">
                            <h1 class="art-full__title">${item.title}</h1>
                        </header>
                        <div class="art-full__content poetry">
                            <div class="poem-text">
                                <p>${item.content.replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    </article>
                </div>
            `;
        } else {
            modalContent = `
                <div class="art-modal__content">
                    <button class="art-modal__close">&times;</button>
                    <article class="art-full">
                        <header class="art-full__header">
                            <h1 class="art-full__title">${item.title}</h1>
                        </header>
                        <div class="art-full__image">
                            <img src="${item.image}" alt="${item.title}">
                        </div>
                        <footer class="art-full__footer">
                            <p class="art-full__date">${item.date}</p>
                        </footer>
                    </article>
                </div>
            `;
        }
        
        modal.innerHTML = modalContent;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeBtn = modal.querySelector('.art-modal__close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
    }
}

// Initialize art manager
const artManager = new ArtManager();

// Load art items when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    
    // Load art items if we're on the art page
    if (window.location.pathname.includes('art.html')) {
        artManager.loadArtItems();
    }
})

// Portfolio Manager class
class PortfolioManager {
    constructor() {
        this.projects = [];
        this.portfolioGrid = document.getElementById('portfolioGrid');
    }

    async loadProjects() {
        try {
            // Use relative path for GitHub Pages compatibility
            const basePath = window.location.pathname.includes('/blog/') ? '../' : '';
            const response = await fetch(`${basePath}portfolio.json`);
            this.projects = await response.json();
            await this.renderProjects();
        } catch (error) {
            console.error('Error loading portfolio projects:', error);
        }
    }

    async renderProjects() {
        if (!this.portfolioGrid) return;
        this.portfolioGrid.innerHTML = '';
        this.projects.forEach(project => {
            const projectElement = this.createProjectElement(project);
            this.portfolioGrid.appendChild(projectElement);
        });
    }

    createProjectElement(project) {
        const article = document.createElement('article');
        article.className = 'post-card';
        let imagesHtml = '';
        if (Array.isArray(project.images) && project.images.length > 0) {
            // Use the first image as the main image
            const imgObj = project.images[0];
            imagesHtml = `
                <div class="post-image">
                    <img src="${imgObj.src}" alt="${imgObj.caption || project.title}" loading="lazy">
                </div>
            `;
        } else {
            imagesHtml = '';
        }
        article.innerHTML = `
            <div class="post-link" style="cursor: pointer;">
                ${imagesHtml}
                <div class="post-content">
                    <div class="post-meta">
                        ${project.date ? `<span class="post-date">${project.date}</span>` : ''}
                    </div>
                    <h2 class="title">${project.title}</h2>
                    <p class="post-excerpt">${project.description || ''}</p>
                    <div class="post-footer">
                        <span class="read-more">View Project →</span>
                    </div>
                </div>
            </div>
        `;
        // Add click event listener for modal
        article.querySelector('.post-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showProjectModal(project);
        });
        return article;
    }

    showProjectModal(project) {
        const modal = document.createElement('div');
        modal.className = 'art-modal';
        let imagesHtml = '';
        if (Array.isArray(project.images)) {
            imagesHtml = project.images.map(imgObj => `
                <figure style="margin-bottom: 20px;">
                    <img src="${imgObj.src}" alt="${imgObj.caption || project.title}" style="max-width: 100%; max-height: 60vh; display: block; margin: 0 auto;">
                    ${imgObj.caption ? `<figcaption style='font-size: 1em; color: #666; text-align: center; margin-top: 5px;'>${imgObj.caption}</figcaption>` : ''}
                </figure>
            `).join('');
        }
        let pdfHtml = '';
        if (project.pdf) {
            pdfHtml = `<a href="${project.pdf}" class="view-all-link" target="_blank" style="margin-top: 20px; display: inline-block;">Download Report (PDF)</a>`;
        }
        modal.innerHTML = `
            <div class="art-modal__content">
                <button class="art-modal__close">&times;</button>
                <article class="art-full">
                    <header class="art-full__header">
                        <h1 class="art-full__title">${project.title}</h1>
                    </header>
                    <div class="art-full__image">
                        ${imagesHtml}
                    </div>
                    <div class="art-full__content">
                        <p style="font-size: 1.1em; margin: 20px 0;">${project.description || ''}</p>
                        ${pdfHtml}
                    </div>
                </article>
            </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        const closeBtn = modal.querySelector('.art-modal__close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
    }
}

// Initialize portfolio manager
const portfolioManager = new PortfolioManager();

// Load art or portfolio items when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    // Load art items if we're on the art page
    if (window.location.pathname.includes('art.html')) {
        artManager.loadArtItems();
    }
    // Load portfolio items if we're on the portfolio page
    if (window.location.pathname.includes('portfolio.html')) {
        portfolioManager.loadProjects();
    }
}) 