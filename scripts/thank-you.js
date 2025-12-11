function displaySharedMemory() {
    // Get memory data from sessionStorage
    const memoryDataStr = sessionStorage.getItem('lastSharedMemory');

    if (!memoryDataStr) {
        // No memory found, redirect to share page
        window.location.href = 'share.html';
        return;
    }

    try {
        const memoryData = JSON.parse(memoryDataStr);

        // Display memory preview
        document.getElementById('previewName').textContent = memoryData.name;
        document.getElementById('previewRecipe').textContent = memoryData.recipe;
        document.getElementById('previewCategory').textContent = formatCategory(memoryData.category);
        document.getElementById('previewMemoryText').textContent = memoryData.memory;

        // Clear sessionStorage after displaying
        sessionStorage.removeItem('lastSharedMemory');

    } catch (error) {
        console.error('Error parsing memory data:', error);
        window.location.href = 'share.html';
    }
}

function formatCategory(category) {
    // Format category for display
    const categoryMap = {
        'appetizer': 'Appetizer',
        'main-course': 'Main Course',
        'dessert': 'Dessert',
        'beverage': 'Beverage',
        'side-dish': 'Side Dish',
        'holiday-special': 'Holiday Special'
    };
    return categoryMap[category] || category;
}

document.addEventListener('DOMContentLoaded', () => {
    // Update footer date
    if (typeof updateFooterDate === 'function') {
        updateFooterDate();
    }

    displaySharedMemory();
});
function displayFormData() {
    try {
        const lastSharedMemory = sessionStorage.getItem('lastSharedMemory');

        if (!lastSharedMemory) {
            console.warn('No memory data found in sessionStorage');
            return;
        }

        const memoryData = JSON.parse(lastSharedMemory);

        const name = memoryData.name || 'N/A';
        const recipe = memoryData.recipe || 'N/A';
        const category = memoryData.category || 'N/A';
        const memory = memoryData.memory || 'N/A';

        const previewName = document.getElementById('previewName');
        const previewRecipe = document.getElementById('previewRecipe');
        const previewCategory = document.getElementById('previewCategory');
        const previewMemoryText = document.getElementById('previewMemoryText');

        if (previewName) previewName.textContent = name;
        if (previewRecipe) previewRecipe.textContent = recipe;
        if (previewCategory) {
            const formattedCategory = category
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            previewCategory.textContent = formattedCategory;
        }
        if (previewMemoryText) previewMemoryText.textContent = memory;

        sessionStorage.removeItem('lastSharedMemory');
    } catch (error) {
        console.error('Error displaying form data:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    displayFormData();
});