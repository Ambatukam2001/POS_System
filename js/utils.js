/**
 * Utility functions for POS System
 */

export function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return '₱' + num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

export function formatDate(dateInput = new Date()) {
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

export function formatTime(dateInput = new Date()) {
    const d = new Date(dateInput);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

export function formatDateTime(dateInput = new Date()) {
    return `${formatDate(dateInput)} ${formatTime(dateInput)}`;
}

export function generateId(prefix = 'ID') {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomNum}`;
}

export const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`pos_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Error reading ${key} from storage:`, e);
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(`pos_${key}`, JSON.stringify(value));
        } catch (e) {
            console.error(`Error saving ${key} to storage:`, e);
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(`pos_${key}`);
        } catch (e) {
            console.error(`Error removing ${key} from storage:`, e);
        }
    }
};

export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
