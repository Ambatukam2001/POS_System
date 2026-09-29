# 🍽️ Fresh Bites — Modern Point of Sale (POS) & Business Management System

[![Build Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-HTML5%20%7C%20TailwindCSS%20%7C%20JavaScript-blue.svg)]()
[![Backend & DB](https://img.shields.io/badge/database-Supabase%20Cloud-emerald.svg)]()
[![Deployment](https://img.shields.io/badge/hosted%20on-Netlify-00C7B7.svg)]()

> A sleek, high-performance, real-time Point of Sale (POS) and inventory management web application built for modern food establishments, cafes, and retail stores. Designed with rich aesthetics, real-time cloud synchronization, seamless payment processing, and responsive mobile-first views.

---

## 🎨 Design & Aesthetic Highlights

The application follows state-of-the-art modern UI/UX design principles:

- **✨ Rich Aesthetics & Glassmorphism:** Styled with curated HSL color palettes, soft glassmorphism shadows, backdrop blurs, and vibrant pastel accents (`bg-pastel-pink`, `bg-pastel-orange`, `bg-pastel-emerald`).
- **📱 Responsive Mobile-First Architecture:** Tailored layout for both desktop POS terminals and mobile devices. Features dedicated tab navigation (`Menu List` vs. `Cart & Checkout`) on mobile screens to maximize screen real estate.
- **⚡ Micro-Animations & Skeleton Loaders:** Smooth micro-interactions, active tab switches, dynamic total price updates, and elegant skeleton loaders while syncing data.
- **🏷️ Interactive Visual Badges & QR Payments:** Color-coded stock badges (`In Stock`, `Low Stock`, `Out of Stock`), custom QR code tab switchers for GCash & Maya payments, and quick-cash calculator pills.

---

## 🚀 Key Features

### 🛒 1. Point of Sale (POS) Cashier Terminal
- **Fast Search & Category Filtering:** Instant live search across products by SKU, name, or barcode with category pills (Food, Drinks, Snacks, Desserts).
- **Interactive Cart & Order Panel:** Real-time quantity adjustments, tax & discount calculation (percentage or fixed amount), and customer assignment.
- **Multi-Payment Checkout Modal:** Support for Cash, GCash, Maya, and Credit/Debit Cards with automatic change calculator and reference code generators.
- **Digital Thermal Receipts:** Instant receipt generation ready for printing or previewing upon order completion.

### 📦 2. Real-Time Inventory & Product Management
- **Product Directory:** Full CRUD operations for products with custom images, cost, retail price, stock level thresholds, and minimum stock alerts.
- **Automatic Stock Deduction:** Automatic stock reduction on checkout with real-time low stock / out of stock warnings.
- **Cloud Seeding & Real-Time Sync:** Automatic database seeding on first startup and instant bi-directional updates via Supabase WebSockets.

### 👥 3. Customer Relationship Management (CRM)
- **Customer Directory:** Track customer purchases, contact numbers, email addresses, and total spent.
- **Automatic Customer Upsert:** Seamless customer creation or history update directly from the POS checkout flow.

### 📊 4. Sales Analytics & Reports
- **Interactive Dashboards:** Daily total sales, transaction counts, category distribution breakdowns, and cashier performance charts powered by ApexCharts.
- **Data Export:** One-click CSV export for transaction records and sales summaries.

### 🔒 5. Multi-Role User Authentication & Security
- **Role-Based Access Control (RBAC):** Admin, Manager, and Cashier access levels with tailored permission controls.
- **Auth Session Management:** Secure local session handling with password update capability.

---

## 🛠️ Technology Stack

| Layer | Technology Used |
|---|---|
| **Frontend Framework** | HTML5, JavaScript (ES6+ Modules), Vanilla CSS |
| **Styling & Design** | Tailwind CSS CDN, Custom CSS3 Animations, Google Fonts (*Plus Jakarta Sans*) |
| **Icons & Charts** | Lucide Icons, ApexCharts JS |
| **Database & Cloud Backend** | Supabase Cloud Database (PostgreSQL + REST API + Realtime WebSockets) |
| **Hosting & Deployment** | Netlify / Vercel Edge Cloud Network |

---

## 📁 Project Structure

```
POS System/
├── index.html              # Main POS & Admin Web Application Layout
├── login.html              # Secure Authentication Portal
├── css/
│   └── styles.css          # Custom Styles, Pastels & Responsive Overrides
├── js/
│   ├── app.js              # Application Orchestrator & Router
│   ├── auth.js             # User Auth & Role Management
│   ├── cart.js             # Shopping Cart State & Calculations
│   ├── customers.js        # Customer Directory Manager
│   ├── env.js              # Environment Configuration Reader
│   ├── header.js           # Header, Time Display & Quick Actions
│   ├── modal.js            # Modal Dialogs & Checkout Flow
│   ├── pos.js              # POS Product Grid & Mobile View Handlers
│   ├── products.js         # Product Inventory & Stock Deductions
│   ├── reports.js          # Sales Analytics & ApexCharts Integration
│   ├── supabase.js         # Supabase REST & Realtime Cloud Client
│   ├── toast.js            # Notification Toasts System
│   ├── transactions.js     # Transaction Ledger & History
│   └── utils.js            # Currency & Date Helpers
├── backend/
│   └── .env.example        # Environment Variable Reference Template
└── _redirects              # Netlify Routing Rules
```

---

## 🌐 Database Connection & Configuration

The application uses **Supabase Cloud Database** for persistent real-time storage across 5 core tables:
- `products` — Product catalog, prices, stock levels, and images.
- `customers` — Customer contact directory and accumulated spend.
- `orders` — Master transaction ledger.
- `order_items` — Line items breakdown per order.
- `users` — Staff credentials, roles, and status.

To configure your own Supabase instance, update `js/env.js` or `.env`:

```javascript
export const ENV = {
    SUPABASE_URL: "https://your-supabase-project.supabase.co",
    SUPABASE_ANON_KEY: "your-supabase-anon-key"
};
```

---

## 📥 Local Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Ambatukam2001/POS_System.git
   cd POS_System
   ```

2. **Serve the Application locally:**
   You can run any static web server (e.g. VS Code Live Server or Node `npx serve`):
   ```bash
   npx serve ./
   ```

3. **Open in Browser:**
   Navigate to `http://localhost:3000` to launch the POS terminal.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.