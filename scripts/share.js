// Lógica exclusiva para share.html
function addSharePageHandlers() {
    // Masonry layout para memories
    initializeMasonryLayout();
    // Formulario de compartir
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
    // Read More links
    const readMoreLinks = document.querySelectorAll('.read-more');
    readMoreLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.memory-card');
            const userName = card.querySelector('.user-name').textContent;
            showNotification(`Opening full memory from ${userName}...`);
        });
    });
}

document.addEventListener('DOMContentLoaded', addSharePageHandlers);

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
        if (!formData.get(field) || formData.get(field).trim() === '') {
            input.style.borderColor = '#ff4444';
            isValid = false;
        } else {
            input.style.borderColor = '#e0e0e0';
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
        showNotification('Thank you for sharing your memory! It will be reviewed and published soon.', 'success');
        form.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }, 2000);
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

