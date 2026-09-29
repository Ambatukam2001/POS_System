/**
 * Environment Configuration module (Loaded from .env / runtime configuration)
 */

export const ENV = {
    APP_NAME: 'Fresh Bites POS',
    APP_VERSION: '1.0.0',
    APP_ENV: 'production',
    API_BASE_URL: 'https://ezviolctwqrvnbmgjbtn.supabase.co',
    SUPABASE_URL: 'https://ezviolctwqrvnbmgjbtn.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dmlvbGN0d3Fydm5ibWdqYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NDI2MjUsImV4cCI6MjEwNjIxODYyNX0.UvYrmT6WuD8YeUxQtnDzQvIzIoCo8EXBdgoTEYoqXwA',
    DB_HOST: 'db.ezviolctwqrvnbmgjbtn.supabase.co',
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
