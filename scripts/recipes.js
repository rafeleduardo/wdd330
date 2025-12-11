function getSelectedFilters() {
    const categorySelect = document.getElementById('categorySelect');
    return {
        category: categorySelect ? categorySelect.value : ''
    };
}

function addRecipesPageHandlers() {
    // Recipe search (by name via TheMealDB)
    const searchInput = document.getElementById('recipeSearch');
    const searchButton = document.querySelector('.search-button');
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
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

    // Apply immediately when user changes category
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) {
        categorySelect.addEventListener('change', () => {
            // Clear search to avoid mixed "search vs category" expectations
            const recipeSearch = document.getElementById('recipeSearch');
            if (recipeSearch) recipeSearch.value = '';

            applyFilters();
        });
    }
}

// Searches TheMealDB by recipe name:
// https://www.themealdb.com/api/json/v1/1/search.php?s=<name>
async function performSearch() {
    const searchInput = document.getElementById('recipeSearch');
    const rawQuery = (searchInput?.value || '').trim();

    if (!rawQuery) {
        // If user cleared search, go back to category mode (or empty state)
        applyFilters();
        return;
    }

    const meals = await fetchMealsBySearch(rawQuery);

    renderRecipeCards(meals);

    const countEl = document.getElementById('recipeCount');
    if (countEl) {
        countEl.textContent = `${meals.length} recipes matching "${rawQuery}"`;
    }

    if (meals.length === 0) {
        showNotification(`No recipes found for "${rawQuery}"`, 'info');
    } else {
        showNotification(`Found ${meals.length} recipes`, 'success');
    }
}


async function applyFilters() {
    const filters = getSelectedFilters();

    if (!filters.category) {
        // No category selected -> choose first available category if present
        const categorySelect = document.getElementById('categorySelect');
        const firstRealOption = categorySelect && categorySelect.querySelector('option[value]:not([value=""])');
        if (firstRealOption) {
            categorySelect.value = firstRealOption.value;
            return applyFilters();
        }

        showNotification('Please select a category.', 'info');
        renderRecipeCards([]);
        updateRecipeCount(0, '');
        return;
    }

    const meals = await fetchMealsByCategory(filters.category);
    renderRecipeCards(meals);
    updateRecipeCount(meals.length, filters.category);
    showNotification(`Category: ${filters.category} (${meals.length} recipes)`, 'success');
}

function clearFilters() {
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect) categorySelect.value = '';
    renderRecipeCards([]);
    updateRecipeCount(0, '');
    showNotification('Filters cleared. Select a category to view recipes.');
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

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

async function fetchCategories() {
    try {
        const res = await fetch(`${THEMEALDB_BASE}/list.php?c=list`);
        if (!res.ok) return [];
        const data = await res.json();
        const meals = Array.isArray(data.meals) ? data.meals : [];
        return meals
            .map(m => m.strCategory)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));
    } catch (err) {
        console.error('Error loading categories:', err);
        return [];
    }
}

async function fetchMealsByCategory(category) {
    try {
        const res = await fetch(`${THEMEALDB_BASE}/filter.php?c=${encodeURIComponent(category)}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.meals) ? data.meals : [];
    } catch (err) {
        console.error('Error loading meals by category:', err);
        return [];
    }
}

async function fetchMealsBySearch(query) {
    try {
        const res = await fetch(`${THEMEALDB_BASE}/search.php?s=${encodeURIComponent(query)}`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.meals) ? data.meals : [];
    } catch (err) {
        console.error('Error searching meals:', err);
        return [];
    }
}

function updateRecipeCount(shownCount, categoryName = '') {
    const countEl = document.getElementById('recipeCount');
    if (!countEl) return;

    if (!categoryName) {
        countEl.textContent = 'Select a category to view recipes.';
        return;
    }

    countEl.textContent = `${shownCount} recipes in ${categoryName}`;
}

function renderRecipeCards(meals) {
    const grid = document.getElementById('recipeGrid');
    if (!grid) return;

    const skeletons = grid.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());

    const existingCards = grid.querySelectorAll('.recipe-card');
    existingCards.forEach(card => card.remove());

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'recipe-card';

        const title = meal.strMeal || 'Recipe';
        const thumb = meal.strMealThumb || '';

        const imageHTML = thumb
            ? `<img 
                src="${thumb}"
                alt="${title}"
                width="800"
                height="600"
                loading="lazy"
                class="recipe-image"
              >`
            : `<div class="thumbnail-placeholder">${title}</div>`;

        // Note: MealDB filter response provides idMeal, strMeal, strMealThumb
        const id = meal.idMeal;

        card.innerHTML = `
            <div class="recipe-thumbnail">
                ${imageHTML}
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${title}</h3>
                <p class="recipe-description">Recipe details available on the next page.</p>
                <a href="recipe-detail.html?id=${id}" class="view-details">View Details</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function renderCategoryDropdown() {
    const select = document.getElementById('categorySelect');
    if (!select) return;

    select.innerHTML = '';

    const categories = await fetchCategories();

    if (categories.length === 0) {
        select.innerHTML = `<option value="">Unable to load categories</option>`;
        return;
    }

    select.innerHTML = `
        <option value="">Select a category...</option>
        ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
    `;
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
    await renderCategoryDropdown();

    renderRecipeCards([]);
    updateRecipeCount(0, '');
});