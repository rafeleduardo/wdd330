function getRecipeIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function fetchRecipeById(id) {
    try {
        const response = await fetch('data/recipes.json');
        if (!response.ok) {
            throw new Error('Failed to load recipes');
        }
        const recipes = await response.json();
        return recipes.find(recipe => recipe.id === parseInt(id));
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return null;
    }
}

function updateBreadcrumb(recipe) {
    const breadcrumbRecipeName = document.getElementById('breadcrumbRecipeName');
    if (breadcrumbRecipeName) {
        breadcrumbRecipeName.textContent = recipe.title || 'Recipe';
    }
}

function renderRecipeHeader(recipe) {
    const titleElement = document.querySelector('.recipe-main-title');
    const authorElement = document.querySelector('.recipe-author');
    const statsElement = document.querySelector('.recipe-stats');

    if (titleElement) titleElement.textContent = recipe.title || 'Recipe';
    if (authorElement) authorElement.textContent = `By ${recipe.author || 'Unknown'}`;

    if (statsElement) {
        const totalTime = recipe.totalTime || recipe.prepTime || '45 min';
        const servings = recipe.servings || '6';
        const difficulty = recipe.difficulty || 'medium';

        statsElement.innerHTML = `
            <span class="stat-item">⏱ ${totalTime}</span>
            <span class="stat-item">👥 Serves ${servings}</span>
            <span class="stat-item">📊 ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} difficulty</span>
        `;
    }
}

function renderRecipeImage(recipe) {
    const photoSection = document.querySelector('.recipe-photo-section');
    if (!photoSection) return;

    const placeholder = photoSection.querySelector('.recipe-photo-placeholder');
    if (placeholder && recipe.image) {
        const img = document.createElement('img');
        img.srcset = `
            images/recipes/${recipe.image}-400.webp 400w,
            images/recipes/${recipe.image}-800.webp 800w,
            images/recipes/${recipe.image}-1200.webp 1200w
        `;
        img.sizes = '(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px';
        img.src = `images/recipes/${recipe.image}-1200.webp`;
        img.alt = recipe.title;
        img.className = 'recipe-photo';
        img.loading = 'eager';

        placeholder.replaceWith(img);
    }
}

function renderCulturalContext(recipe) {
    const culturalSection = document.querySelector('.cultural-context');
    if (culturalSection && recipe.culturalContext) {
        const paragraph = culturalSection.querySelector('p');
        if (paragraph) {
            paragraph.textContent = recipe.culturalContext;
        }
    }
}

function renderIngredients(recipe) {
    const ingredientsList = document.querySelector('.ingredients-list');
    if (!ingredientsList) return;

    const ingredients = recipe.detailedIngredients || recipe.ingredients;
    if (!ingredients || !Array.isArray(ingredients)) return;

    ingredientsList.innerHTML = '';
    ingredients.forEach((ingredient, index) => {
        const li = document.createElement('li');
        li.className = 'ingredient-item';

        const ingredientText = typeof ingredient === 'string'
            ? ingredient
            : `${ingredient.amount || ''} ${ingredient.name || ingredient}`.trim();

        li.innerHTML = `
            <input type="checkbox" id="ingredient${index + 1}" class="ingredient-checkbox">
            <label for="ingredient${index + 1}">${ingredientText}</label>
        `;
        ingredientsList.appendChild(li);
    });
}

function renderSteps(recipe) {
    const instructionsSection = document.querySelector('.instructions-section');
    if (!instructionsSection) return;

    const steps = recipe.steps || recipe.instructions;
    if (!steps || !Array.isArray(steps)) return;

    const heading = instructionsSection.querySelector('h3');
    instructionsSection.innerHTML = '';
    if (heading) {
        instructionsSection.appendChild(heading);
    }

    steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `step-item${index === 0 ? ' active' : ''}`;
        const stepNumber = index + 1;
        stepDiv.setAttribute('data-step', stepNumber);

        const stepText = typeof step === 'string' ? step : step.description || step.text || step;
        const stepTime = typeof step === 'object' ? (step.time || '10 min') : '10 min';

        stepDiv.innerHTML = `
            <div class="step-header">
                <input type="checkbox" id="step${stepNumber}" class="step-checkbox">
                <label for="step${stepNumber}" class="step-number">Step ${stepNumber}</label>
                <span class="step-time">${stepTime}</span>
            </div>
            <div class="step-content">
                <p class="step-text">${stepText}</p>
            </div>
        `;
        instructionsSection.appendChild(stepDiv);
    });
}

function updateProgressIndicators(recipe) {
    const steps = recipe.steps || recipe.instructions || [];
    const totalSteps = Array.isArray(steps) ? steps.length : 0;

    const totalStepsSpan = document.getElementById('totalSteps');
    if (totalStepsSpan) {
        totalStepsSpan.textContent = totalSteps;
    }

    const stepIndicator = document.getElementById('stepIndicator');
    if (stepIndicator) {
        stepIndicator.textContent = `Step 1 of ${totalSteps}`;
    }
}

function initializeRecipeDetails() {
    const stepCheckboxes = document.querySelectorAll('.step-checkbox');
    const progressFill = document.getElementById('progressFill');
    const currentStepSpan = document.getElementById('currentStep');

    if (!stepCheckboxes.length) return;

    const totalSteps = stepCheckboxes.length;

    updateProgress();

    stepCheckboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', function() {
            const stepItem = this.closest('.step-item');
            if (this.checked) {
                stepItem.classList.add('completed');
                if (index === totalSteps - 1) {
                    const allCompleted = document.querySelectorAll('.step-checkbox:checked').length === totalSteps;
                    if (allCompleted) {
                        setTimeout(() => {
                            openModal();
                        }, 500);
                    }
                }
            } else {
                stepItem.classList.remove('completed');
            }
            updateProgress();
        });
    });

    function updateProgress() {
        const completedSteps = document.querySelectorAll('.step-checkbox:checked').length;
        const progressPercentage = (completedSteps / totalSteps) * 100;

        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        const currentDisplayStep = Math.min(completedSteps + 1, totalSteps);

        if (currentStepSpan) {
            currentStepSpan.textContent = `Step ${currentDisplayStep}`;
        }

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.innerHTML = `<span id="currentStep">Step ${currentDisplayStep}</span> of <span id="totalSteps">${totalSteps}</span>`;
        }
    }

    const ingredientCheckboxes = document.querySelectorAll('.ingredient-checkbox');
    ingredientCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const completedIngredients = document.querySelectorAll('.ingredient-checkbox:checked').length;
            const totalIngredients = ingredientCheckboxes.length;
            if (completedIngredients === totalIngredients) {
                showNotification('✅ All ingredients prepared!', 'success');
            }
        });
    });
}

function openModal() {
    const modal = document.getElementById('completionModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        const focusableElements = modal.querySelectorAll('button, a');
        const firstElement = focusableElements[0];

        if (firstElement) {
            firstElement.focus();
        }

        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('completionModal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');

        document.body.style.overflow = '';
    }
}

function initializeModal() {
    const modal = document.getElementById('completionModal');
    const closeBtn = document.getElementById('modalClose');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const shareRecipeBtn = document.getElementById('shareRecipeBtn');
    const overlay = modal;

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (shareRecipeBtn) {
        shareRecipeBtn.addEventListener('click', () => {
            closeModal();
            window.location.href = 'share.html';
        });
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

async function loadRecipeDetails() {
    const recipeId = getRecipeIdFromURL();

    if (!recipeId) {
        showNotification('No recipe ID provided. Redirecting to recipes page...', 'error');
        setTimeout(() => {
            window.location.href = 'recipes.html';
        }, 2000);
        return;
    }

    const recipe = await fetchRecipeById(recipeId);

    if (!recipe) {
        showNotification('Recipe not found. Redirecting to recipes page...', 'error');
        setTimeout(() => {
            window.location.href = 'recipes.html';
        }, 2000);
        return;
    }

    updateBreadcrumb(recipe);
    renderRecipeHeader(recipe);
    renderRecipeImage(recipe);
    renderCulturalContext(recipe);
    renderIngredients(recipe);
    renderSteps(recipe);
    updateProgressIndicators(recipe);

    initializeRecipeDetails();
    initializeModal();

    document.title = `${recipe.title} - Sabor de Casa`;
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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateFooterDate === 'function') {
        updateFooterDate();
    }

    loadRecipeDetails();
});

