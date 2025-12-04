// Funciones utilitarias globales para Sabor de Casa
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

// Lógica exclusiva para index.html (home)
function addHomePageHandlers() {
    // Aquí puedes agregar lógica exclusiva para la home si es necesario
    // Por ahora solo ejemplo de mensaje de bienvenida
    console.log('Página principal cargada');
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
    // Combine likes and views for ranking
    const sorted = recipes.slice().sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
    const pool = sorted.slice(0, poolSize);
    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, count);
}

function renderRecipeSpotlights(recipes) {
    const container = document.getElementById('recipe-spotlights');
    if (!container) return;
    container.innerHTML = '';
    recipes.forEach(recipe => {
        const card = document.createElement('article');
        card.className = 'recipe-card';
        card.innerHTML = `
            <div class="recipe-thumbnail">
                <div class="thumbnail-placeholder">${recipe.title}</div>
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

document.addEventListener('DOMContentLoaded', async () => {
    addHomePageHandlers();
    const recipes = await fetchRecipes();
    const spotlights = pickTopRecipes(recipes, 3, 8);
    renderRecipeSpotlights(spotlights);
});
