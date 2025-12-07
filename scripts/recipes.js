function addRecipesPageHandlers() {
    // Layout controls
    const layoutButtons = document.querySelectorAll('.layout-button');
    layoutButtons.forEach(button => {
        button.addEventListener('click', function() {
            const layout = this.dataset.layout;
            switchLayout(layout);
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Recipe search
    const searchInput = document.getElementById('recipeSearch');
    const searchButton = document.querySelector('.search-button');
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Filter controls
    const applyFiltersButton = document.querySelector('.apply-filters-button');
    const clearFiltersButton = document.querySelector('.clear-filters-button');
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', applyFilters);
    }
    if (clearFiltersButton) {
        clearFiltersButton.addEventListener('click', clearFilters);
    }
}

function switchLayout(layout) {
    const recipeGrid = document.getElementById('recipeGrid');
    if (!recipeGrid) return;
    if (layout === 'list') {
        recipeGrid.classList.add('list-layout');
    } else {
        recipeGrid.classList.remove('list-layout');
    }
    showNotification(`Switched to ${layout} view`);
}

function performSearch() {
    const searchInput = document.getElementById('recipeSearch');
    const query = searchInput.value.toLowerCase().trim();
    fetchRecipes().then(recipes => {
        if (!query) {
            renderRecipeCards(recipes);
            showNotification('Showing all recipes');
            return;
        }
        const filtered = recipes.filter(recipe =>
            recipe.title.toLowerCase().includes(query) ||
            recipe.description.toLowerCase().includes(query)
        );
        renderRecipeCards(filtered);
        showNotification(`Found ${filtered.length} recipes matching "${query}"`);
    });
}

function showAllRecipes() {
    const recipeCards = document.querySelectorAll('.recipe-card');
    recipeCards.forEach(card => {
        card.style.display = 'block';
    });
}

async function getFilterOptions() {
    const recipes = await fetchRecipes();
    const categories = [...new Set(recipes.map(r => r.category))];
    const cuisines = [...new Set(recipes.map(r => r.cuisine))];
    const difficulties = [...new Set(recipes.map(r => r.difficulty))];
    const times = [...new Set(recipes.map(r => r.time))];
    return { categories, cuisines, difficulties, times };
}

function getSelectedFilters() {
    const selected = {
        category: [],
        cuisine: [],
        difficulty: [],
        time: []
    };
    document.querySelectorAll('.filter-group').forEach(group => {
        const label = group.querySelector('.filter-label').textContent.trim().toLowerCase();
        group.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            if (label.includes('category')) selected.category.push(cb.value);
            else if (label.includes('cuisine')) selected.cuisine.push(cb.value);
            else if (label.includes('difficulty')) selected.difficulty.push(cb.value);
            else if (label.includes('cooking time')) selected.time.push(cb.value);
        });
    });
    return selected;
}

async function applyFilters() {
    const recipes = await fetchRecipes();
    const filters = getSelectedFilters();
    let filtered = recipes.filter(recipe => {
        const matchCategory = filters.category.length === 0 || filters.category.includes(recipe.category);
        const matchCuisine = filters.cuisine.length === 0 || filters.cuisine.includes(recipe.cuisine);
        const matchDifficulty = filters.difficulty.length === 0 || filters.difficulty.includes(recipe.difficulty);
        const matchTime = filters.time.length === 0 || filters.time.includes(recipe.time);
        return matchCategory && matchCuisine && matchDifficulty && matchTime;
    });
    renderRecipeCards(filtered);
    showNotification(`Applied filters: ${filtered.length} recipes found`);
}

function clearFilters() {
    const checkboxes = document.querySelectorAll('.filter-option input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    fetchRecipes().then(recipes => {
        renderRecipeCards(recipes);
        showNotification('All filters cleared');
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    const backgroundColor = type === 'error' ? '#ff4444' : type === 'success' ? '#44aa44' : '#333';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${backgroundColor};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        font-family: Helvetica, Arial, sans-serif;
        max-width: 300px;
        line-height: 1.4;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

async function fetchRecipes() {
    try {
        const res = await fetch('data/recipes.json');
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Error loading recipes:', err);
        return [];
    }
}

function renderRecipeCards(recipes) {
    const grid = document.getElementById('recipeGrid');
    const countEl = document.getElementById('recipeCount');
    if (!grid) return;

    const skeletons = grid.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());

    const existingCards = grid.querySelectorAll('.recipe-card');
    existingCards.forEach(card => card.remove());

    fetchRecipes().then(allRecipes => {
        if (countEl) {
            countEl.textContent = `${recipes.length} of ${allRecipes.length} recipes`;
        }
    });
    recipes.forEach(recipe => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.setAttribute('data-category', recipe.category);
        card.setAttribute('data-cuisine', recipe.cuisine);
        card.setAttribute('data-difficulty', recipe.difficulty);
        card.setAttribute('data-time', recipe.time);

        // Generate responsive image HTML
        const imageHTML = recipe.image
            ? `<img 
                srcset="
                    images/recipes/${recipe.image}-400.webp 400w,
                    images/recipes/${recipe.image}-800.webp 800w,
                    images/recipes/${recipe.image}-1200.webp 1200w
                "
                sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
                src="images/recipes/${recipe.image}-800.webp"
                alt="${recipe.title}"
                width="800"
                height="600"
                loading="lazy"
                class="recipe-image"
              >`
            : `<div class="thumbnail-placeholder">${recipe.title}</div>`;

        card.innerHTML = `
            <div class="recipe-thumbnail">
                ${imageHTML}
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.title}</h3>
                <p class="recipe-description">${recipe.description}</p>
                <div class="recipe-meta">
                    <span class="recipe-author">By ${recipe.author}</span>
                    <span class="recipe-views">${recipe.views} views</span>
                    <span class="recipe-likes">&#10084; ${recipe.likes}</span>
                </div>
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                </div>
                <a href="recipe-detail.html?id=${recipe.id}" class="view-details">View Details</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function renderCuisineFilters() {
    const { cuisines } = await getFilterOptions();
    const container = document.getElementById('cuisine-filter-options');
    if (!container) return;
    container.innerHTML = '';
    cuisines.forEach(cuisine => {
        const label = cuisine.charAt(0).toUpperCase() + cuisine.slice(1);
        const el = document.createElement('label');
        el.className = 'filter-option';
        el.innerHTML = `<input type="checkbox" value="${cuisine}"><span>${label}</span>`;
        container.appendChild(el);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Update footer date
    if (typeof updateFooterDate === 'function') {
        updateFooterDate();
    }

    // Initialize hamburger menu
    if (typeof initHamburgerMenu === 'function') {
        initHamburgerMenu();
    }

    addRecipesPageHandlers();
    await renderCuisineFilters();
    const recipes = await fetchRecipes();
    renderRecipeCards(recipes);
});
