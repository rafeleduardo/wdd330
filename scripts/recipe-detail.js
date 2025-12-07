// Lógica exclusiva para recipe-detail.html

// Get recipe ID from URL parameter
function getRecipeIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Fetch recipe data from JSON
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

// Render recipe header (title, author, stats)
function renderRecipeHeader(recipe) {
    const titleElement = document.querySelector('.recipe-main-title');
    const authorElement = document.querySelector('.recipe-author');
    const statsElement = document.querySelector('.recipe-stats');

    if (titleElement) titleElement.textContent = recipe.title;
    if (authorElement) authorElement.textContent = `By ${recipe.author}`;

    if (statsElement) {
        statsElement.innerHTML = `
            <span class="stat-item">⏱ ${recipe.totalTime}</span>
            <span class="stat-item">👥 Serves ${recipe.servings}</span>
            <span class="stat-item">📊 ${recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)} difficulty</span>
        `;
    }
}

// Render recipe image
function renderRecipeImage(recipe) {
    const photoSection = document.querySelector('.recipe-photo-section');
    if (!photoSection) return;

    const placeholder = photoSection.querySelector('.recipe-photo-placeholder');
    if (placeholder && recipe.image) {
        // Replace placeholder with responsive image
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
        img.loading = 'eager'; // Load immediately on detail page

        placeholder.replaceWith(img);
    }
}

// Render cultural context
function renderCulturalContext(recipe) {
    const culturalSection = document.querySelector('.cultural-context');
    if (culturalSection && recipe.culturalContext) {
        const paragraph = culturalSection.querySelector('p');
        if (paragraph) {
            paragraph.textContent = recipe.culturalContext;
        }
    }
}

// Render ingredients list
function renderIngredients(recipe) {
    const ingredientsList = document.querySelector('.ingredients-list');
    if (!ingredientsList || !recipe.detailedIngredients) return;

    ingredientsList.innerHTML = '';
    recipe.detailedIngredients.forEach((ingredient, index) => {
        const li = document.createElement('li');
        li.className = 'ingredient-item';
        li.innerHTML = `
            <input type="checkbox" id="ingredient${index + 1}" class="ingredient-checkbox">
            <label for="ingredient${index + 1}">${ingredient.amount} ${ingredient.name}</label>
        `;
        ingredientsList.appendChild(li);
    });
}

// Render cooking steps
function renderSteps(recipe) {
    const instructionsSection = document.querySelector('.instructions-section');
    if (!instructionsSection || !recipe.steps) return;

    // Clear existing steps except the heading
    const heading = instructionsSection.querySelector('h3');
    instructionsSection.innerHTML = '';
    if (heading) {
        instructionsSection.appendChild(heading);
    }

    recipe.steps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `step-item${index === 0 ? ' active' : ''}`;
        stepDiv.setAttribute('data-step', step.step);
        stepDiv.innerHTML = `
            <div class="step-header">
                <input type="checkbox" id="step${step.step}" class="step-checkbox">
                <label for="step${step.step}" class="step-number">Step ${step.step}</label>
                <span class="step-time">${step.time}</span>
            </div>
            <div class="step-content">
                <p class="step-text">${step.description}</p>
            </div>
        `;
        instructionsSection.appendChild(stepDiv);
    });
}

// Update progress indicators
function updateProgressIndicators(recipe) {
    const totalStepsSpan = document.getElementById('totalSteps');
    if (totalStepsSpan && recipe.steps) {
        totalStepsSpan.textContent = recipe.steps.length;
    }

    const stepIndicator = document.getElementById('stepIndicator');
    if (stepIndicator && recipe.steps) {
        stepIndicator.textContent = `Step 1 of ${recipe.steps.length}`;
    }
}

// Initialize all interactive features
function initializeRecipeDetails() {
    const stepCheckboxes = document.querySelectorAll('.step-checkbox');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const progressFill = document.getElementById('progressFill');
    const currentStepSpan = document.getElementById('currentStep');
    const stepIndicator = document.getElementById('stepIndicator');

    if (!stepCheckboxes.length) return;

    let currentStepIndex = 0;
    const totalSteps = stepCheckboxes.length;

    updateProgress();

    // Step checkbox handlers
    stepCheckboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('change', function() {
            const stepItem = this.closest('.step-item');
            if (this.checked) {
                stepItem.classList.add('completed');
                stepItem.classList.remove('active');
                if (index < totalSteps - 1) {
                    setTimeout(() => {
                        currentStepIndex = index + 1;
                        updateActiveStep();
                        updateProgress();
                    }, 500);
                } else {
                    setTimeout(() => {
                        showNotification('🎉 Congratulations! You\'ve completed the recipe!', 'success');
                    }, 500);
                }
            } else {
                stepItem.classList.remove('completed');
            }
            updateProgress();
        });
    });

    // Previous button
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                updateActiveStep();
                updateProgress();
            }
        });
    }

    // Next button
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (currentStepIndex < totalSteps - 1) {
                currentStepIndex++;
                updateActiveStep();
                updateProgress();
            }
        });
    }

    function updateActiveStep() {
        const stepItems = document.querySelectorAll('.step-item');
        stepItems.forEach((item, index) => {
            item.classList.remove('active');
            if (index === currentStepIndex) {
                item.classList.add('active');
                // Scroll to active step
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });

        prevButton.disabled = currentStepIndex === 0;
        nextButton.disabled = currentStepIndex === totalSteps - 1;

        if (stepIndicator) {
            stepIndicator.textContent = `Step ${currentStepIndex + 1} of ${totalSteps}`;
        }
    }

    function updateProgress() {
        const completedSteps = document.querySelectorAll('.step-checkbox:checked').length;
        const progressPercentage = (completedSteps / totalSteps) * 100;

        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        if (currentStepSpan) {
            currentStepSpan.textContent = `Step ${completedSteps + 1}`;
        }

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            progressText.innerHTML = `<span id="currentStep">Step ${completedSteps + 1}</span> of <span id="totalSteps">${totalSteps}</span>`;
        }
    }

    // Ingredient checkbox handlers
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

// Main initialization function
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

    // Render all recipe sections
    renderRecipeHeader(recipe);
    renderRecipeImage(recipe);
    renderCulturalContext(recipe);
    renderIngredients(recipe);
    renderSteps(recipe);
    updateProgressIndicators(recipe);

    // Initialize interactive features
    initializeRecipeDetails();

    // Update page title
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

// Load recipe when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Update footer date
    if (typeof updateFooterDate === 'function') {
        updateFooterDate();
    }

    loadRecipeDetails();
});

