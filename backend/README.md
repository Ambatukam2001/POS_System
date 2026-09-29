# Fresh Bites POS — Laravel API Backend

This is the Laravel API Backend for the Fresh Bites POS system, connected to your **Supabase PostgreSQL** cloud database.

---

## 🛠️ Quick Start Instructions

### 1. Prerequisites
- **PHP 8.2+** installed on your system
- **Composer** installed on your system
- **PostgreSQL extension** enabled in `php.ini` (`extension=pdo_pgsql`)

---

### 2. Setup Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Your `.env` database configuration is pre-configured for Supabase:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=db.ezviolctwqrvnbmgjbtn.supabase.co
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
   ```

---

### 3. Run the Laravel Backend Server
```bash
composer install
php artisan key:generate
php artisan serve
```

The API will run locally at: **`http://127.0.0.1:8000`**

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Fetch all menu catalog products |
| `POST` | `/api/products` | Create a new product item |
| `POST` | `/api/orders` | Process sale transaction & update stock |
| `GET` | `/api/orders` | Fetch transaction sales history |
| `POST` | `/api/auth/login` | Authenticate cashier / admin user |
