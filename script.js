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
            const response = await fetch('/posts.json');
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
            const response = await fetch('art.json');
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