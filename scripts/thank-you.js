// Lógica para thank-you.html

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
