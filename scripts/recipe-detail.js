const RESTCOUNTRIES_BASE = 'https://restcountries.com/v3.1';

function mapAreaToCountryQuery(area) {
    const normalized = String(area || '').trim();
    if (!normalized || normalized.toLowerCase() === 'unknown') return '';
    return AREA_TO_COUNTRY[normalized] || normalized;
}

const AREA_TO_COUNTRY = {
    'Algerian': 'Algeria',
    'American': 'United States',
    'Argentinian': 'Argentina',
    'Australian': 'Australia',
    'British': 'United Kingdom',
    'Canadian': 'Canada',
    'Chinese': 'China',
    'Croatian': 'Croatia',
    'Dutch': 'Netherlands',
    'Egyptian': 'Egypt',
    'Filipino': 'Philippines',
    'French': 'France',
    'Greek': 'Greece',
    'Indian': 'India',
    'Irish': 'Ireland',
    'Italian': 'Italy',
    'Jamaican': 'Jamaica',
    'Japanese': 'Japan',
    'Kenyan': 'Kenya',
    'Malaysian': 'Malaysia',
    'Mexican': 'Mexico',
    'Moroccan': 'Morocco',
    'Norwegian': 'Norway',
    'Polish': 'Poland',
    'Portuguese': 'Portugal',
    'Russian': 'Russia',
    'Saudi Arabian': 'Saudi Arabia',
    'Slovakian': 'Slovakia',
    'Spanish': 'Spain',
    'Syrian': 'Syria',
    'Thai': 'Thailand',
    'Tunisian': 'Tunisia',
    'Turkish': 'Turkey',
    'Ukrainian': 'Ukraine',
    'Uruguayan': 'Uruguay',

    // NOTE: TheMealDB has a typo: "Venezulan"
    'Venezulan': 'Venezuela',

    'Vietnamese': 'Vietnam'
};

async function fetchCountryByName(name) {
    try {
        const query = String(name || '').trim();
        if (!query) return null;

        // Required endpoint (no fields)
        const url = `${RESTCOUNTRIES_BASE}/name/${encodeURIComponent(query)}`;

        let res = await fetch(url);

        // Fallback: sometimes "fullText" helps with exact matches
        if (!res.ok) {
            res = await fetch(`${url}?fullText=true`);
        }

        if (!res.ok) return null;

        const data = await res.json();
        if (!Array.isArray(data) || !data.length) return null;

        return data[0];
    } catch (err) {
        console.error('Error fetching country:', err);
        return null;
    }
}

function formatCountryDetails(country) {
    const capital = Array.isArray(country?.capital) ? country.capital[0] : '';
    const region = country?.region || '';
    const subregion = country?.subregion || '';

    const languagesObj = country?.languages || {};
    const languages = Object.values(languagesObj).filter(Boolean).slice(0, 3).join(', ');

    const currenciesObj = country?.currencies || {};
    const currencyCodes = Object.keys(currenciesObj);
    const currency =
        currencyCodes.length
            ? `${currencyCodes[0]} (${currenciesObj[currencyCodes[0]]?.name || ''})`.trim()
            : '';

    const parts = [];
    if (capital) parts.push(`Capital: ${capital}`);
    if (region || subregion) parts.push(`Region: ${[subregion, region].filter(Boolean).join(', ')}`);
    if (languages) parts.push(`Languages: ${languages}`);
    if (currency) parts.push(`Currency: ${currency}`);

    return parts.join(' • ');
}

function renderCountryCard(area, country) {
    const card = document.getElementById('countryCard');
    const flag = document.getElementById('countryFlag');
    const name = document.getElementById('countryName');
    const details = document.getElementById('countryDetails');

    if (!card || !flag || !name || !details) return;

    if (!country) {
        card.hidden = true;
        return;
    }

    const countryName = country?.name?.common || country?.name?.official || mapAreaToCountryQuery(area) || 'Country';
    const flagUrl = country?.flags?.png || country?.flags?.svg || '';

    name.textContent = `Origin: ${area || 'Unknown'} • ${countryName}`;
    details.textContent = formatCountryDetails(country);

    if (flagUrl) {
        flag.src = flagUrl;
        flag.alt = `${countryName} flag`;
        flag.hidden = false;
    } else {
        flag.removeAttribute('src');
        flag.alt = '';
        flag.hidden = true;
    }

    card.hidden = false;
}

function getRecipeIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function fetchRecipeById(id) {
    try {
        const numericId = String(id || '').trim();
        if (!/^\d+$/.test(numericId)) return null;

        const url = `${THEMEALDB_BASE}/lookup.php?i=${numericId}`;
        const res = await fetch(url);
        if (!res.ok) return null;

        const data = await res.json();
        return Array.isArray(data.meals) && data.meals.length ? data.meals[0] : null;
    } catch (err) {
        console.error('Error fetching recipe:', err);
        return null;
    }
}

function extractIngredients(meal) {
    const list = [];
    for (let i = 1; i <= 20; i++) {
        const ingRaw = String(meal?.[`strIngredient${i}`] || '').trim();
        const measureRaw = String(meal?.[`strMeasure${i}`] || '').trim();

        const ing = ingRaw.replace(/\s+/g, ' ');
        const measure = measureRaw.replace(/\s+/g, ' ');

        const ingLower = ing.toLowerCase();
        if (!ing) continue;
        if (ingLower === 'null' || ingLower === 'n/a' || ingLower === 'na' || ingLower === '-') continue;

        const measureLower = measure.toLowerCase();
        const safeMeasure = (measureLower === 'null' || measureLower === 'n/a' || measureLower === 'na' || measureLower === '-') ? '' : measure;

        list.push({ ing, measure: safeMeasure });
    }
    return list;
}

function parseInstructionsToSteps(instructions) {
    const text = String(instructions || '').trim();
    if (!text) return [];

    let lines = text
        .split(/\r?\n+/)
        .map(s => s.trim())
        .filter(Boolean);

    // fallback if API returns a single blob with no line breaks
    if (lines.length <= 1) {
        lines = text
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(Boolean);
    }

    // Remove leading numbering like "1) ", "1. ", "1: ", "1- "
    return lines.map(line => line.replace(/^\s*\d+\s*[.)\-:]\s*/, ''));
}

function updateBreadcrumb(meal) {
    const el = document.getElementById('breadcrumbRecipeName');
    if (el) el.textContent = meal?.strMeal || 'Recipe';
}

function renderRecipeHeader(meal) {
    const titleElement = document.querySelector('.recipe-main-title');
    const authorElement = document.querySelector('.recipe-author');
    const statsElement = document.querySelector('.recipe-stats');

    if (titleElement) titleElement.textContent = meal?.strMeal || 'Recipe';

    // TheMealDB doesn't provide "author". Use Area as an origin label.
    if (authorElement) {
        authorElement.textContent = meal?.strArea ? `Cuisine: ${meal.strArea}` : 'Cuisine: Unknown';
    }

    if (statsElement) {
        const category = meal?.strCategory || 'Unknown';
        const area = meal?.strArea || 'Unknown';
        statsElement.innerHTML = `
            <span class="stat-item">🏷️ ${category}</span>
            <span class="stat-item">🌍 ${area}</span>
        `;
    }
}

function renderRecipeImage(meal) {
    const photoSection = document.querySelector('.recipe-photo-section');
    if (!photoSection) return;

    const placeholder = photoSection.querySelector('.recipe-photo-placeholder');
    if (!placeholder) return;

    const thumb = String(meal?.strMealThumb || '').trim();
    if (!thumb) {
        placeholder.textContent = 'No photo available';
        return;
    }

    const img = document.createElement('img');
    img.src = thumb;
    img.alt = meal?.strMeal || 'Recipe photo';
    img.className = 'recipe-photo';
    img.loading = 'eager';

    placeholder.replaceWith(img);
}

function renderCulturalContext(meal) {
    const culturalSection = document.querySelector('.cultural-context');
    if (!culturalSection) return;

    const paragraph = culturalSection.querySelector('p');
    if (!paragraph) return;

    // TheMealDB doesn't have a story field; show useful metadata.
    const bits = [];
    if (meal?.strCategory) bits.push(`Category: ${meal.strCategory}`);
    if (meal?.strArea) bits.push(`Origin: ${meal.strArea}`);
    if (meal?.strSource) bits.push(`Source: ${meal.strSource}`);
    if (meal?.strYoutube) bits.push(`Video: ${meal.strYoutube}`);

    paragraph.textContent = bits.length ? bits.join(' • ') : 'No additional context available for this recipe.';
}

function renderIngredients(meal) {
    const ingredientsList = document.querySelector('.ingredients-list');
    if (!ingredientsList) return;

    const items = extractIngredients(meal);
    ingredientsList.innerHTML = '';

    if (!items.length) {
        const li = document.createElement('li');
        li.className = 'ingredient-item';
        li.textContent = 'No ingredients available.';
        ingredientsList.appendChild(li);
        return;
    }

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'ingredient-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `ingredient${index + 1}`;
        checkbox.className = 'ingredient-checkbox';

        const label = document.createElement('label');
        label.setAttribute('for', checkbox.id);
        label.textContent = (item.measure ? `${item.measure} ${item.ing}` : item.ing).trim();

        li.appendChild(checkbox);
        li.appendChild(label);
        ingredientsList.appendChild(li);
    });
}

function renderSteps(meal) {
    const instructionsSection = document.querySelector('.instructions-section');
    if (!instructionsSection) return;

    const steps = parseInstructionsToSteps(meal?.strInstructions);

    const heading = instructionsSection.querySelector('h3');
    instructionsSection.innerHTML = '';
    if (heading) instructionsSection.appendChild(heading);

    if (!steps.length) {
        const p = document.createElement('p');
        p.className = 'step-text';
        p.textContent = 'No instructions available for this recipe.';
        instructionsSection.appendChild(p);
        return;
    }

    steps.forEach((stepText, index) => {
        const stepNumber = index + 1;

        const stepDiv = document.createElement('div');
        stepDiv.className = `step-item${index === 0 ? ' active' : ''}`;
        stepDiv.setAttribute('data-step', String(stepNumber));

        stepDiv.innerHTML = `
            <div class="step-header">
                <input type="checkbox" id="step${stepNumber}" class="step-checkbox">
                <label for="step${stepNumber}" class="step-number">Step ${stepNumber}</label>
                <span class="step-time">—</span>
            </div>
            <div class="step-content">
                <p class="step-text"></p>
            </div>
        `;

        const p = stepDiv.querySelector('.step-text');
        if (p) p.textContent = stepText;

        instructionsSection.appendChild(stepDiv);
    });
}

function updateProgressIndicators(meal) {
    const stepsCount = parseInstructionsToSteps(meal?.strInstructions).length;

    const totalStepsSpan = document.getElementById('totalSteps');
    if (totalStepsSpan) totalStepsSpan.textContent = String(stepsCount);

    const currentStepSpan = document.getElementById('currentStep');
    if (currentStepSpan) currentStepSpan.textContent = stepsCount ? 'Step 1' : 'Step 0';
}

function initializeRecipeDetails() {
    const stepCheckboxes = document.querySelectorAll('.step-checkbox');
    const progressFill = document.getElementById('progressFill');

    const totalSteps = stepCheckboxes.length;

    function updateProgress() {
        const completed = document.querySelectorAll('.step-checkbox:checked').length;
        const percent = totalSteps ? (completed / totalSteps) * 100 : 0;

        if (progressFill) progressFill.style.width = `${percent}%`;

        const currentDisplayStep = totalSteps ? Math.min(completed + 1, totalSteps) : 0;
        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.innerHTML = `<span id="currentStep">Step ${currentDisplayStep}</span> of <span id="totalSteps">${totalSteps}</span>`;
        }
    }

    updateProgress();

    stepCheckboxes.forEach((cb, index) => {
        cb.addEventListener('change', () => {
            const stepItem = cb.closest('.step-item');
            if (cb.checked) stepItem?.classList.add('completed');
            else stepItem?.classList.remove('completed');

            updateProgress();

            const allCompleted = totalSteps > 0 && document.querySelectorAll('.step-checkbox:checked').length === totalSteps;
            if (allCompleted && index === totalSteps - 1) {
                setTimeout(() => openModal(), 400);
            }
        });
    });

    const ingredientCheckboxes = document.querySelectorAll('.ingredient-checkbox');
    ingredientCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allPrepared =
                ingredientCheckboxes.length > 0 &&
                document.querySelectorAll('.ingredient-checkbox:checked').length === ingredientCheckboxes.length;
            if (allPrepared) showNotification('All ingredients prepared!', 'success');
        });
    });
}

function openModal() {
    const modal = document.getElementById('completionModal');
    if (!modal) return;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('completionModal');
    if (!modal) return;

    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function initializeModal() {
    const modal = document.getElementById('completionModal');
    if (!modal) return;

    const closeBtn = document.getElementById('modalClose');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareRecipeBtn = document.getElementById('shareRecipeBtn');

    closeBtn?.addEventListener('click', closeModal);
    closeModalBtn?.addEventListener('click', closeModal);

    shareRecipeBtn?.addEventListener('click', () => {
        closeModal();
        window.location.href = 'share.html';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    const backgroundColor =
        type === 'error' ? '#ff4444' :
            type === 'success' ? '#44aa44' :
                '#333';

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
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

async function loadRecipeDetails() {
    const recipeId = getRecipeIdFromURL();

    if (!recipeId) {
        showNotification('No recipe ID provided. Redirecting to recipes page...', 'error');
        setTimeout(() => window.location.href = 'recipes.html', 1200);
        return;
    }

    const meal = await fetchRecipeById(recipeId);

    if (!meal) {
        showNotification('Recipe not found. Redirecting to recipes page...', 'error');
        setTimeout(() => window.location.href = 'recipes.html', 1200);
        return;
    }

    updateBreadcrumb(meal);
    renderRecipeHeader(meal);
    renderRecipeImage(meal);
    renderCulturalContext(meal);
    renderIngredients(meal);
    renderSteps(meal);
    updateProgressIndicators(meal);

    // NEW: Rest Countries enrichment
    const area = meal?.strArea || '';
    const countryQuery = mapAreaToCountryQuery(area);
    const country = await fetchCountryByName(countryQuery);
    renderCountryCard(area, country);

    initializeRecipeDetails();
    initializeModal();

    document.title = `${meal.strMeal || 'Recipe'} - Sabor de Casa`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateFooterDate === 'function') updateFooterDate();
    if (typeof initHamburgerMenu === 'function') initHamburgerMenu();

    loadRecipeDetails();
});