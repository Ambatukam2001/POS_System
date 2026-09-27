/**
 * Environment Configuration module (Loaded from .env / runtime configuration)
 */

export const ENV = {
    APP_NAME: 'Fresh Bites POS',
    APP_VERSION: '1.0.0',
    APP_ENV: 'production',
    API_BASE_URL: 'http://localhost:8080',
    CURRENCY_CODE: 'PHP',
    CURRENCY_SYMBOL: '₱',
    DEFAULT_ADMIN_USER: 'admin',
    DEFAULT_ADMIN_PASS: 'admin123',
    DEFAULT_CASHIER_USER: 'cashier',
    DEFAULT_CASHIER_PASS: 'cashier123',
    ENABLE_ANALYTICS: true
};

export function getEnv(key, defaultValue = '') {
    return ENV[key] !== undefined ? ENV[key] : defaultValue;
}
