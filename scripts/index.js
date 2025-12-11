function updateFooterDate() {
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        lastUpdateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburgerMenu');
    const navigation = document.getElementById('navigation');
    const overlay = document.getElementById('navOverlay');

    if (!hamburger || !navigation || !overlay) return;

    function toggleMenu() {
        hamburger.classList.toggle('active');
        navigation.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = navigation.classList.contains('active') ? 'hidden' : '';
    }

    function closeMenu() {
        hamburger.classList.remove('active');
        navigation.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', toggleMenu);

    overlay.addEventListener('click', closeMenu);

    const navLinks = navigation.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navigation.classList.contains('active')) {
            closeMenu();
        }
    });
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

function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function pickTopRecipes(recipes, count = 3, poolSize = 8) {
    const sorted = recipes.slice().sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
    const pool = sorted.slice(0, poolSize);
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, count);
}

function renderRecipeSpotlights(recipes) {
    const container = document.getElementById('recipe-spotlights');
    if (!container) return;

    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());

    recipes.forEach((recipe, index) => {
        const card = document.createElement('article');
        card.className = 'recipe-card';

        const imageHTML = recipe.image
            ? `<img
                src="images/recipes/${recipe.image}-320.webp"
                alt="${recipe.title}"
                width="320"
                height="240"
                fetchpriority="high"
                class="recipe-image"
                decoding="async"
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
                <a href="recipe-detail.html?id=${recipe.id}" class="view-details">View Details</a>
            </div>
        `;
        container.appendChild(card);
    });
}

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

async function fetchRandomMeal() {
    try {
        const res = await fetch(`${THEMEALDB_BASE}/random.php`);
        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data.meals) && data.meals.length ? data.meals[0] : null;
    } catch (err) {
        console.error('Error loading random meal:', err);
        return null;
    }
}

async function fetchSpotlightMeals(count = 3) {
    const results = [];
    const seen = new Set();

    // avoid duplicates if API returns the same meal twice
    while (results.length < count) {
        const meal = await fetchRandomMeal();
        if (!meal || !meal.idMeal) break;

        if (seen.has(meal.idMeal)) continue;
        seen.add(meal.idMeal);
        results.push(meal);
    }

    return results;
}

function renderRecipeSpotlights(meals) {
    const container = document.getElementById('recipe-spotlights');
    if (!container) return;

    const skeletons = container.querySelectorAll('.skeleton-card');
    skeletons.forEach(skeleton => skeleton.remove());

    meals.forEach((meal) => {
        const card = document.createElement('article');
        card.className = 'recipe-card';

        const title = meal.strMeal || 'Recipe';
        const thumb = meal.strMealThumb || '';
        const area = meal.strArea || '';
        const category = meal.strCategory || '';

        const imageHTML = thumb
            ? `<img
                src="${thumb}"
                alt="${title}"
                width="320"
                height="240"
                fetchpriority="high"
                class="recipe-image"
                decoding="async"
              >`
            : `<div class="thumbnail-placeholder">${title}</div>`;

        const metaParts = [area, category].filter(Boolean).join(' • ');

        card.innerHTML = `
            <div class="recipe-thumbnail">
                ${imageHTML}
            </div>
            <div class="recipe-content">
                <h3 class="recipe-title">${title}</h3>
                <p class="recipe-description">${metaParts || 'Discover this recipe in detail.'}</p>
                <div class="recipe-meta">
                    <span class="recipe-author">${area ? `From ${area}` : 'From TheMealDB'}</span>
                </div>
                <a href="recipe-detail.html?id=${meal.idMeal}" class="view-details">View Details</a>
            </div>
        `;
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    updateFooterDate();
    initHamburgerMenu();

    const spotlights = await fetchSpotlightMeals(3);
    renderRecipeSpotlights(spotlights);
});
