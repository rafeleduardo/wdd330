// Lógica exclusiva para recipe-detail.html
function addRecipeDetailHandlers() {
    initializeRecipeDetails();
}
document.addEventListener('DOMContentLoaded', addRecipeDetailHandlers);

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
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                updateActiveStep();
                updateProgress();
            }
        });
    }
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

