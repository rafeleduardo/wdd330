// Lógica exclusiva para share.html

const MEMORIES_STORAGE_KEY = 'saborDeCasaMemories';

function getMemoriesFromStorage() {
    try {
        const memories = localStorage.getItem(MEMORIES_STORAGE_KEY);
        return memories ? JSON.parse(memories) : [];
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return [];
    }
}

function saveMemoriesToStorage(memories) {
    try {
        localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(memories));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function addMemory(memoryData) {
    const memories = getMemoriesFromStorage();
    const newMemory = {
        id: Date.now(),
        userName: memoryData.name,
        recipeName: memoryData.recipe,
        memory: memoryData.memory,
        category: memoryData.category,
        ingredients: memoryData.ingredients,
        date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        timestamp: Date.now()
    };

    memories.unshift(newMemory);
    return saveMemoriesToStorage(memories);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderUserMemories() {
    const grid = document.getElementById('masonryGrid');
    if (!grid) return;

    const memories = getMemoriesFromStorage();

    grid.innerHTML = '';

    if (memories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p class="empty-state-message">No memories shared yet. Be the first to share your culinary story!</p>
            </div>
        `;
        return;
    }

    memories.forEach(memory => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `
            <div class="card-header">
                <span class="user-name">${escapeHtml(memory.userName)}</span>
                <span class="date">${memory.date}</span>
            </div>
            <div class="card-content">
                <h3 class="memory-recipe-title">${escapeHtml(memory.recipeName)}</h3>
                <p class="memory-text">${escapeHtml(memory.memory)}</p>
                <a href="#" class="read-more" data-memory-id="${memory.id}">Read More</a>
            </div>
        `;
        grid.appendChild(card);
    });

    attachReadMoreListeners();
}

function attachReadMoreListeners() {
    const readMoreLinks = document.querySelectorAll('.read-more');
    readMoreLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const memoryId = this.getAttribute('data-memory-id');
            if (memoryId) {
                showMemoryDetail(parseInt(memoryId));
            } else {
                const card = this.closest('.memory-card');
                const userName = card.querySelector('.user-name').textContent;
                showNotification(`Opening full memory from ${userName}...`);
            }
        });
    });
}

function showMemoryDetail(memoryId) {
    const memories = getMemoriesFromStorage();
    const memory = memories.find(m => m.id === memoryId);

    if (memory) {
        const ingredientsText = memory.ingredients ? `\nIngredients: ${memory.ingredients}` : '';
        alert(`Memory from ${memory.userName}\n\nRecipe: ${memory.recipeName}\n\nStory:\n${memory.memory}\n\nCategory: ${memory.category}${ingredientsText}`);
    }
}

function addSharePageHandlers() {
    renderUserMemories();

    initializeMasonryLayout();

    const shareForm = document.getElementById('shareForm');
    if (shareForm) {
        shareForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleFormSubmission();
        });
        const cancelButton = document.querySelector('.cancel-button');
        if (cancelButton) {
            cancelButton.addEventListener('click', function() {
                if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
                    shareForm.reset();
                }
            });
        }
    }

    attachReadMoreListeners();
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof updateFooterDate === 'function') {
        updateFooterDate();
    }

    addSharePageHandlers();
});

function initializeMasonryLayout() {
    const cards = document.querySelectorAll('.memory-card');
    cards.forEach((card, index) => {
        const memoryText = card.querySelector('.memory-text');
        if (memoryText) {
            const baseText = memoryText.textContent;
            if (index % 3 === 1) {
                memoryText.textContent = baseText.substring(0, baseText.length - 50) + '...';
            } else if (index % 3 === 2) {
                memoryText.textContent = baseText + ' These moments define our culinary heritage.';
            }
        }
    });
}

function handleFormSubmission() {
    const form = document.getElementById('shareForm');
    const formData = new FormData(form);
    const requiredFields = ['name', 'recipe', 'memory', 'category'];
    let isValid = true;

    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.style.borderColor = '#e0e0e0';
        }
    });

    requiredFields.forEach(field => {
        const input = document.getElementById(field);
        if (input && (!formData.get(field) || formData.get(field).trim() === '')) {
            input.style.borderColor = '#ff4444';
            isValid = false;
        }
    });

    if (!isValid) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }

    const submitButton = document.querySelector('.submit-button');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Sharing...';
    submitButton.disabled = true;

    setTimeout(() => {
        const memoryData = {
            name: formData.get('name').trim(),
            recipe: formData.get('recipe').trim(),
            memory: formData.get('memory').trim(),
            category: formData.get('category'),
            ingredients: formData.get('ingredients') ? formData.get('ingredients').trim() : ''
        };

        const saved = addMemory(memoryData);

        if (saved) {
            sessionStorage.setItem('lastSharedMemory', JSON.stringify(memoryData));

            window.location.href = 'thank-you.html';
        } else {
            showNotification('Error saving your memory. Please try again.', 'error');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }, 1500);
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

