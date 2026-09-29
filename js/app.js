/**
 * Main Application Orchestrator, Auth Session Guard & View Router
 */

import { authInstance, ROLES } from './auth.js';
import { cartInstance } from './cart.js';
import { productsInstance } from './products.js';
import { transactionsInstance } from './transactions.js';
import { inventoryInstance } from './inventory.js';
import { usersAdminInstance } from './users.js';
import { customersInstance } from './customers.js';
import { initPOSView, setupScrollToTopButton } from './pos.js';
import { renderDashboardSummary, exportReportsCSV } from './reports.js';
import { initHeaderFunctions } from './header.js';
import { openModal, closeModal, initCheckoutModal } from './modal.js';
import { formatCurrency, formatDateTime } from './utils.js';
import { showToast } from './toast.js';

class App {
    constructor() {
        this.currentView = 'pos';
    }

    init() {
        console.log('Initializing Modern POS Application...');

        // 1. Setup Authentication Session Guard & Login Screen
        this.setupAuthSession();

        // 2. Setup Navigation View Router
        this.setupNavigation();

        // 3. Setup Role Switcher & Logout Buttons
        this.setupRoleSwitcherAndLogout();

        // 4. Initialize Cart UI
        cartInstance.renderCartUI();

        // 5. Initialize Modals & Header Functions
        initCheckoutModal();
        initHeaderFunctions();

        // 6. Initialize POS View & Scroll To Top
        initPOSView();
        setupScrollToTopButton();

        // 7. Setup Modal Listeners & File Uploader
        this.setupModalEvents();

        // 8. Setup Drag & Drop Zone Handler
        this.setupDragAndDrop();

        // 9. Setup Customer Search Listener
        const customerSearchInput = document.getElementById('customer-search-input');
        if (customerSearchInput) {
            customerSearchInput.oninput = (e) => {
                this.renderCustomersTable(e.target.value.trim());
            };
        }

        // 10. Initial Lucide Icon compilation
        if (window.lucide) {
            window.lucide.createIcons({
                nameAttr: 'data-lucide',
                attrs: { strokeWidth: 2 }
            });
        }

        // 11. Dismiss skeleton loading overlay now that app is ready
        this.dismissSkeleton();

        // 12. Live Supabase Realtime & Auto-Sync Update Handlers
        window._renderAdminProducts = () => {
            if (this.currentView === 'products') this.renderProductsTable();
            if (this.currentView === 'inventory') this.renderInventoryTable();
        };
        window._renderCustomerDirectory = () => {
            if (this.currentView === 'customers') this.renderCustomersTable();
        };

        window.addEventListener('supabase-products-updated', () => {
            if (this.currentView === 'products') this.renderProductsTable();
            if (this.currentView === 'inventory') this.renderInventoryTable();
            initPOSView();
        });

        window.addEventListener('supabase-customers-updated', () => {
            if (this.currentView === 'customers') this.renderCustomersTable();
        });
    }

    dismissSkeleton() {
        const skeleton = document.getElementById('app-skeleton-loader');
        if (!skeleton) return;
        // Fade out smoothly
        skeleton.classList.add('skeleton-fade-out');
        // Remove from DOM after transition
        setTimeout(() => {
            if (skeleton.parentNode) skeleton.parentNode.removeChild(skeleton);
        }, 450);
    }

    setupAuthSession() {
        const loginOverlay = document.getElementById('view-login');
        const mainApp = document.getElementById('main-app-container');

        if (!authInstance.isLoggedIn()) {
            // Not authenticated — redirect to login page
            window.location.replace('login.html');
            return;
        }

        // User is logged in — hide login overlay and show main app
        if (loginOverlay) loginOverlay.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
        authInstance.applyPermissions();
        const initialView = authInstance.isAdmin() ? 'dashboard' : 'pos';
        this.navigateTo(initialView);

        // Bind Inline Login Form & Quick Buttons
        const loginForm = document.getElementById('inline-login-form');
        const usernameInput = document.getElementById('inline-username');
        const passwordInput = document.getElementById('inline-password');
        const errorAlert = document.getElementById('inline-login-error');

        const btnAdmin = document.getElementById('inline-login-admin');
        const btnCashier = document.getElementById('inline-login-cashier');

        if (btnAdmin) {
            btnAdmin.onclick = () => {
                usernameInput.value = 'admin';
                passwordInput.value = 'admin123';
                this.executeLogin('admin', 'admin123');
            };
        }

        if (btnCashier) {
            btnCashier.onclick = () => {
                usernameInput.value = 'cashier';
                passwordInput.value = 'cashier123';
                this.executeLogin('cashier', 'cashier123');
            };
        }

        if (loginForm) {
            loginForm.onsubmit = (e) => {
                e.preventDefault();
                this.executeLogin(usernameInput.value.trim(), passwordInput.value.trim());
            };
        }

        // Bind Forgot Password Link & Reset Handler
        const forgotLink = document.getElementById('forgot-password-link');
        const forgotForm = document.getElementById('forgot-password-form');
        const forgotInput = document.getElementById('forgot-user-input');
        const forgotResult = document.getElementById('forgot-password-result');

        if (forgotLink) {
            forgotLink.onclick = (e) => {
                e.preventDefault();
                if (forgotForm) forgotForm.reset();
                if (forgotResult) {
                    forgotResult.classList.add('hidden');
                    forgotResult.innerHTML = '';
                }
                openModal('forgot-password-modal');
            };
        }

        if (forgotForm) {
            forgotForm.onsubmit = (e) => {
                e.preventDefault();
                const identifier = forgotInput ? forgotInput.value.trim() : '';
                const res = authInstance.forgotPassword(identifier);
                if (forgotResult) {
                    forgotResult.classList.remove('hidden');
                    if (res.success) {
                        forgotResult.className = 'p-3.5 rounded-2xl text-xs font-bold leading-relaxed bg-emerald-50 text-emerald-800 border border-emerald-200';
                        forgotResult.innerHTML = `
                            <div class="flex items-start gap-2">
                                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
                                <div class="space-y-1">
                                    <p class="font-extrabold text-emerald-900">${res.message}</p>
                                    <p class="text-[11px] text-emerald-700">Email: <span class="font-mono font-bold">${res.user.email}</span></p>
                                    <div class="mt-2 p-2 rounded-xl bg-emerald-100/70 border border-emerald-300/50 flex items-center justify-between">
                                        <span class="text-[11px] font-bold text-emerald-900">Password: <span class="font-mono text-xs bg-white px-2 py-0.5 rounded border border-emerald-300 font-black">${res.password}</span></span>
                                        <button type="button" class="text-[10px] font-extrabold text-emerald-800 underline uppercase tracking-wide cursor-pointer" onclick="document.getElementById('inline-username').value='${res.user.username}'; document.getElementById('inline-password').value='${res.password}'; const m = document.getElementById('forgot-password-modal'); if(m){ m.classList.add('hidden'); m.classList.remove('flex'); }">Fill Login</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        forgotResult.className = 'p-3.5 rounded-2xl text-xs font-bold leading-relaxed bg-rose-50 text-rose-800 border border-rose-200';
                        forgotResult.innerHTML = `
                            <div class="flex items-center gap-2">
                                <i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 shrink-0"></i>
                                <span>${res.message}</span>
                            </div>
                        `;
                    }
                    if (window.lucide) window.lucide.createIcons();
                }
            };
        }
    }

    executeLogin(username, password) {
        const loginOverlay = document.getElementById('view-login');
        const mainApp = document.getElementById('main-app-container');
        const errorAlert = document.getElementById('inline-login-error');

        const res = authInstance.login(username, password);
        if (res.success) {
            if (errorAlert) errorAlert.classList.add('hidden');
            
            // Polished entrance transition animation
            if (loginOverlay && mainApp) {
                loginOverlay.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                loginOverlay.style.opacity = '0';
                loginOverlay.style.transform = 'scale(1.02)';

                mainApp.classList.remove('hidden');
                mainApp.style.opacity = '0';
                mainApp.style.transform = 'scale(0.98)';
                mainApp.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s';

                void mainApp.offsetWidth; // Force layout recalculation

                mainApp.style.opacity = '1';
                mainApp.style.transform = 'scale(1)';

                setTimeout(() => {
                    loginOverlay.classList.add('hidden');
                    loginOverlay.style.opacity = '';
                    loginOverlay.style.transform = '';
                    loginOverlay.style.transition = '';
                    mainApp.style.opacity = '';
                    mainApp.style.transform = '';
                    mainApp.style.transition = '';
                }, 450);
            } else {
                if (loginOverlay) loginOverlay.classList.add('hidden');
                if (mainApp) mainApp.classList.remove('hidden');
            }

            authInstance.applyPermissions();
            const targetView = authInstance.isAdmin() ? 'dashboard' : 'pos';
            this.navigateTo(targetView);
            showToast(`Welcome back, ${res.user.name}! Signed in as ${res.user.role}.`, 'success');
        } else {
            if (errorAlert) {
                const textSpan = errorAlert.querySelector('#inline-login-error-text');
                if (textSpan) {
                    textSpan.textContent = res.message;
                } else {
                    errorAlert.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4 text-rose-600 shrink-0"></i><span id="inline-login-error-text">${res.message}</span>`;
                }
                errorAlert.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons();
            }
        }
    }

    setupRoleSwitcherAndLogout() {
        // Role Switcher Badge
        const toggleBtn = document.getElementById('role-toggle-badge');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                const current = authInstance.getCurrentUser()?.role;
                const newRole = current === ROLES.ADMIN ? ROLES.CASHIER : ROLES.ADMIN;
                authInstance.switchRole(newRole);
                showToast(`Switched active role to: ${newRole}`, 'info');

                if (newRole === ROLES.CASHIER && ['products', 'inventory', 'users', 'reports', 'settings'].includes(this.currentView)) {
                    this.navigateTo('pos');
                }
            };
        }

        // Sidebar Logout Button
        const logoutBtn = document.getElementById('sidebar-logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                if (confirm('Are you sure you want to log out of the terminal?')) {
                    authInstance.logout();
                    showToast('Logged out of POS terminal.', 'info');
                    setTimeout(() => { window.location.replace('login.html'); }, 400);
                }
            };
        }
    }

    setupNavigation() {
        // Mobile Sidebar Drawer Toggles
        const btnMobileMenu = document.getElementById('btn-mobile-menu');
        const btnCloseSidebar = document.getElementById('btn-close-mobile-sidebar');
        const sidebar = document.getElementById('app-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-mobile-overlay');

        const openSidebar = () => {
            if (sidebar) sidebar.classList.remove('max-lg:-translate-x-full');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('hidden');
                requestAnimationFrame(() => {
                    sidebarOverlay.classList.remove('opacity-0');
                    sidebarOverlay.classList.add('opacity-100');
                });
            }
        };

        const closeSidebar = () => {
            if (sidebar) sidebar.classList.add('max-lg:-translate-x-full');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('opacity-100');
                sidebarOverlay.classList.add('opacity-0');
                setTimeout(() => {
                    sidebarOverlay.classList.add('hidden');
                }, 300);
            }
        };

        if (btnMobileMenu) btnMobileMenu.onclick = openSidebar;
        if (btnCloseSidebar) btnCloseSidebar.onclick = closeSidebar;
        if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;

        const navLinks = document.querySelectorAll('[data-view-target]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetView = link.dataset.viewTarget;

                // Check Admin permission for Admin-only views
                const isAdminOnly = link.hasAttribute('data-admin-only');
                if (isAdminOnly && !authInstance.isAdmin()) {
                    showToast('Access denied: Admin permissions required.', 'error');
                    return;
                }

                // Check Cashier-only permission for Cashier views
                const isCashierOnly = link.hasAttribute('data-cashier-only');
                if (isCashierOnly && authInstance.isAdmin()) {
                    showToast('POS Menu is restricted to Cashiers.', 'info');
                    return;
                }

                closeSidebar();
                this.navigateTo(targetView);
            });
        });
    }

    navigateTo(viewName) {
        // Auto-close mobile sidebar drawer on navigation
        const sidebar = document.getElementById('app-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-mobile-overlay');

        if (sidebar) sidebar.classList.add('max-lg:-translate-x-full');
        if (sidebarOverlay) {
            sidebarOverlay.classList.remove('opacity-100');
            sidebarOverlay.classList.add('opacity-0', 'hidden');
        }

        if (viewName === 'pos' && authInstance.isAdmin()) {
            viewName = 'dashboard';
        }
        this.currentView = viewName;

        // Hide all views
        const views = document.querySelectorAll('.app-view');
        views.forEach(v => v.classList.add('hidden'));

        // Show target view
        const targetViewEl = document.getElementById(`view-${viewName}`);
        if (targetViewEl) {
            targetViewEl.classList.remove('hidden');
        }

        // Show right order panel ONLY on POS view; hide on Admin management views
        const orderPanel = document.getElementById('order-panel');
        const productSection = document.getElementById('pos-product-section');
        if (orderPanel) {
            if (viewName === 'pos') {
                // Desktop: always show both panels side-by-side
                // Mobile: start with menu tab visible, order panel hidden (tabs control it)
                if (window.innerWidth >= 1024) {
                    orderPanel.classList.remove('hidden');
                } else {
                    // Reset to menu-first state on mobile
                    if (productSection) productSection.classList.remove('hidden');
                    orderPanel.classList.add('hidden');
                    if (typeof window._posTabReset === 'function') window._posTabReset();
                }
            } else {
                orderPanel.classList.add('hidden');
                // Also reset mobile tab state when leaving POS
                if (productSection) productSection.classList.remove('hidden');
            }
        }

        // Update active sidebar nav button highlighting & concave cutout styling
        const navLinks = document.querySelectorAll('aside [data-view-target]');
        navLinks.forEach(link => {
            const isMatch = link.dataset.viewTarget === viewName;
            if (isMatch) {
                link.classList.add('nav-item-active', 'text-emerald-700', 'font-extrabold');
                link.classList.remove('text-white/80', 'hover:bg-white/10', 'hover:text-white', 'rounded-l-full');
            } else {
                link.classList.remove('nav-item-active', 'text-emerald-700', 'font-extrabold');
                link.classList.add('text-white/80', 'hover:bg-white/10', 'hover:text-white', 'rounded-l-full');
            }
        });

        // Update active state on mobile bottom navbar buttons
        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileNavBtns.forEach(btn => {
            const isMatch = btn.dataset.viewTarget === viewName;
            const indicator = btn.querySelector('.mobile-nav-indicator');
            if (isMatch) {
                btn.classList.add('mobile-nav-active');
                if (indicator) indicator.classList.remove('opacity-0');
            } else {
                btn.classList.remove('mobile-nav-active');
                if (indicator) indicator.classList.add('opacity-0');
            }
        });

        // Update Header View Title
        const headerTitleEl = document.getElementById('header-view-title');
        if (headerTitleEl) {
            const titleMap = {
                pos: 'Fresh Bites Terminal',
                dashboard: 'Executive Dashboard',
                reports: 'Sales & Revenue Reports',
                products: 'Product Catalog',
                inventory: 'Inventory & Stock Tracking',
                transactions: 'Transaction History',
                users: 'User & Staff Management',
                customers: 'Customer Directory'
            };
            headerTitleEl.textContent = titleMap[viewName] || 'Fresh Bites Terminal';
        }

        // Trigger view-specific render handlers
        if (viewName === 'pos') {
            initPOSView();
        } else if (viewName === 'dashboard') {
            renderDashboardSummary();
        } else if (viewName === 'products') {
            this.renderProductsTable();
        } else if (viewName === 'inventory') {
            this.renderInventoryTable();
        } else if (viewName === 'transactions') {
            this.renderTransactionsTable();
        } else if (viewName === 'reports') {
            renderDashboardSummary();
        } else if (viewName === 'users') {
            this.renderUsersTable();
        } else if (viewName === 'customers') {
            this.renderCustomersTable();
        }

        if (window.lucide) {
            window.lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('order-drag-drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('drag-over-active');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over-active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over-active');
            
            const productId = e.dataTransfer.getData('text/plain');
            if (productId) {
                const product = productsInstance.getById(productId);
                if (product) {
                    const added = cartInstance.addItem(product, 1);
                    if (added) {
                        showToast(`✓ Dropped ${product.name} into order`, 'success');
                    }
                }
            }
        });
    }

    setupModalEvents() {
        // Global modal close triggers
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.onclick = () => {
                const modalId = btn.dataset.modalClose;
                closeModal(modalId);
            };
        });

        // Order Panel Header Edit Trigger
        const editOrderBtn = document.getElementById('order-panel-edit-btn');
        if (editOrderBtn) {
            editOrderBtn.onclick = () => {
                if (cartInstance.getItems().length === 0) {
                    showToast('Order cart is currently empty.', 'info');
                    return;
                }
                if (confirm('Clear current order cart?')) {
                    cartInstance.clearCart();
                    showToast('Cleared order cart.', 'info');
                }
            };
        }

        // Image File Uploader Handler
        const fileInput = document.getElementById('prod-image-file');
        const previewImg = document.getElementById('prod-image-preview');
        const dataInput = document.getElementById('prod-image-data');

        if (fileInput) {
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const result = evt.target.result;
                        if (previewImg) previewImg.src = result;
                        if (dataInput) dataInput.value = result;
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        // Add Product Form Trigger
        const addProductBtn = document.getElementById('btn-add-product');
        const triggerProductDrawer = () => {
            const form = document.getElementById('product-form');
            if (form) form.reset();
            document.getElementById('product-form-title').textContent = 'Create New Product';
            document.getElementById('product-id-input').value = '';
            if (dataInput) dataInput.value = '';
            if (previewImg) previewImg.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
            openModal('product-modal');
        };

        if (addProductBtn) {
            addProductBtn.onclick = triggerProductDrawer;
        }

        // Admin Executive Dashboard Quick Action Buttons
        const adminAddProd = document.getElementById('admin-action-add-product');
        if (adminAddProd) {
            adminAddProd.onclick = triggerProductDrawer;
        }

        const btnAddStaff = document.getElementById('btn-add-staff');
        const triggerStaffModal = () => {
            const form = document.getElementById('add-staff-form');
            if (form) form.reset();
            openModal('add-staff-modal');
        };

        if (btnAddStaff) {
            btnAddStaff.onclick = triggerStaffModal;
        }

        const adminAddStaff = document.getElementById('admin-action-add-staff');
        if (adminAddStaff) {
            adminAddStaff.onclick = triggerStaffModal;
        }

        // Add Staff Form Submission Handler
        const addStaffForm = document.getElementById('add-staff-form');
        if (addStaffForm) {
            addStaffForm.onsubmit = (e) => {
                e.preventDefault();
                const name = document.getElementById('staff-input-name').value.trim();
                const username = document.getElementById('staff-input-username').value.trim();
                const email = document.getElementById('staff-input-email').value.trim();
                const password = document.getElementById('staff-input-password').value.trim();
                const role = document.getElementById('staff-input-role').value;
                const status = document.getElementById('staff-input-status').value;

                usersAdminInstance.addUser({ name, username, email, password, role, status });
                addStaffForm.reset();
                closeModal('add-staff-modal');
                this.renderUsersTable();
            };
        }

        const adminExport = document.getElementById('admin-action-export-report');
        if (adminExport) {
            adminExport.onclick = () => {
                exportReportsCSV();
            };
        }

        const adminRestock = document.getElementById('admin-action-restock');
        if (adminRestock) {
            adminRestock.onclick = () => {
                this.navigateTo('inventory');
            };
        }

        // Save User Profile Handler
        const userProfileForm = document.getElementById('user-profile-form');
        if (userProfileForm) {
            userProfileForm.onsubmit = (e) => {
                e.preventDefault();
                const name = document.getElementById('profile-input-name').value;
                const email = document.getElementById('profile-input-email').value;
                const password = document.getElementById('profile-input-password').value;

                authInstance.updateCurrentProfile({ name, email, password });
                showToast('Profile details updated successfully!', 'success');
                closeModal('user-profile-modal');
                authInstance.applyPermissions();

                if (this.currentView === 'users') {
                    this.renderUsersTable();
                }
            };
        }

        // Save Product Handler (Supports uploaded image source file & explicit Stock Status)
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.onsubmit = (e) => {
                e.preventDefault();
                const id = document.getElementById('product-id-input').value;
                const uploadedImg = dataInput ? dataInput.value : '';
                const prodStatusEl = document.getElementById('prod-status');
                
                const formData = {
                    name: document.getElementById('prod-name').value,
                    sku: document.getElementById('prod-sku').value,
                    barcode: document.getElementById('prod-barcode').value,
                    category: document.getElementById('prod-category').value,
                    weight: document.getElementById('prod-weight').value,
                    price: parseFloat(document.getElementById('prod-price').value),
                    cost: parseFloat(document.getElementById('prod-cost').value),
                    stock: parseInt(document.getElementById('prod-stock').value),
                    minStock: parseInt(document.getElementById('prod-min-stock').value),
                    status: prodStatusEl ? prodStatusEl.value : 'In Stock',
                    bgColor: document.getElementById('prod-bgcolor').value,
                    image: uploadedImg || (id ? productsInstance.getById(id)?.image : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80')
                };

                if (id) {
                    productsInstance.updateProduct(id, formData);
                    showToast('Product details updated successfully', 'success');
                } else {
                    productsInstance.addProduct(formData);
                    showToast('Product created successfully', 'success');
                }

                closeModal('product-modal');
                this.renderProductsTable();
                initPOSView();
            };
        }
    }

    renderProductsTable() {
        const tableBody = document.getElementById('products-table-body');
        if (!tableBody) return;

        const products = productsInstance.getAll();
        tableBody.innerHTML = products.map(p => `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                <td class="py-3 px-4 flex items-center gap-3">
                    <img src="${p.image}" alt="${p.name}" class="w-10 h-10 rounded-full object-cover shadow-xs">
                    <div>
                        <h4 class="text-xs font-bold text-slate-900">${p.name}</h4>
                        <p class="text-[11px] text-slate-400 font-mono">${p.sku}</p>
                    </div>
                </td>
                <td class="py-3 px-4 text-xs font-semibold text-slate-600">${p.category}</td>
                <td class="py-3 px-4 text-xs font-bold text-slate-900">${formatCurrency(p.price)}</td>
                <td class="py-3 px-4 text-xs font-semibold text-slate-500">${formatCurrency(p.cost)}</td>
                <td class="py-3 px-4 text-xs font-bold ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-800'}">${p.stock} pcs</td>
                <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                        p.status === 'Out of Stock' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                        (p.status === 'Low Stock' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')
                    }">
                        <span class="w-1.5 h-1.5 rounded-full ${
                            p.status === 'Out of Stock' ? 'bg-rose-500' : (p.status === 'Low Stock' ? 'bg-amber-500' : 'bg-emerald-500')
                        }"></span>
                        ${p.status}
                    </span>
                </td>
                <td class="py-3 px-4 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors btn-edit-product" data-id="${p.id}">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                        </button>
                        <button class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors btn-delete-product" data-id="${p.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Bind Table Action buttons (Full Product Edit Handler)
        tableBody.querySelectorAll('.btn-edit-product').forEach(btn => {
            btn.onclick = () => {
                const product = productsInstance.getById(btn.dataset.id);
                if (product) {
                    document.getElementById('product-form-title').textContent = 'Edit Product Details';
                    document.getElementById('product-id-input').value = product.id;
                    document.getElementById('prod-name').value = product.name;
                    document.getElementById('prod-sku').value = product.sku;
                    document.getElementById('prod-barcode').value = product.barcode;
                    document.getElementById('prod-category').value = product.category;
                    document.getElementById('prod-weight').value = product.weight || '';
                    document.getElementById('prod-price').value = product.price;
                    document.getElementById('prod-cost').value = product.cost;
                    document.getElementById('prod-stock').value = product.stock;
                    document.getElementById('prod-min-stock').value = product.minStock;
                    
                    const prodStatusEl = document.getElementById('prod-status');
                    if (prodStatusEl) prodStatusEl.value = product.status || 'In Stock';

                    document.getElementById('prod-bgcolor').value = product.bgColor || 'bg-pastel-pink';
                    
                    const previewImg = document.getElementById('prod-image-preview');
                    const dataInput = document.getElementById('prod-image-data');
                    if (previewImg) previewImg.src = product.image;
                    if (dataInput) dataInput.value = product.image;

                    openModal('product-modal');
                }
            };
        });

        tableBody.querySelectorAll('.btn-delete-product').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const p = productsInstance.getById(id);
                if (confirm(`Are you sure you want to delete ${p?.name}?`)) {
                    productsInstance.deleteProduct(id);
                    showToast(`Deleted ${p?.name}`, 'info');
                    this.renderProductsTable();
                    initPOSView();
                }
            };
        });

        if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }

    renderInventoryTable(filterStatus = 'All') {
        const tableBody = document.getElementById('inventory-table-body');
        if (!tableBody) return;

        const allProducts = productsInstance.getAll();
        const stats = inventoryInstance.getStats();

        // Update Summary Cards
        const totalEl = document.getElementById('inv-stat-total');
        const inStockEl = document.getElementById('inv-stat-instock');
        const lowStockEl = document.getElementById('inv-stat-lowstock');
        const outStockEl = document.getElementById('inv-stat-outstock');

        if (totalEl) totalEl.textContent = stats.totalProducts;
        if (inStockEl) inStockEl.textContent = stats.inStockCount;
        if (lowStockEl) lowStockEl.textContent = stats.lowStockCount;
        if (outStockEl) outStockEl.textContent = stats.outOfStockCount;

        // Filter products based on selected stock status
        let products = allProducts;
        if (filterStatus === 'In Stock') {
            products = allProducts.filter(p => p.status === 'In Stock' || (p.stock > p.minStock));
        } else if (filterStatus === 'Low Stock') {
            products = allProducts.filter(p => p.status === 'Low Stock' || (p.stock > 0 && p.stock <= p.minStock));
        } else if (filterStatus === 'Out of Stock') {
            products = allProducts.filter(p => p.status === 'Out of Stock' || (p.stock === 0));
        }

        // Highlight active filter pill
        const filterBtns = document.querySelectorAll('#inventory-filter-pills [data-inv-status]');
        filterBtns.forEach(btn => {
            const isSelected = btn.dataset.invStatus === filterStatus;
            btn.className = `inv-filter-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                isSelected 
                    ? 'bg-emerald-500 text-white shadow-xs border border-transparent' 
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`;
            const icon = btn.querySelector('i[data-lucide]');
            if (icon) {
                if (isSelected) {
                    icon.className = 'w-3.5 h-3.5 text-white';
                } else {
                    if (btn.dataset.invStatus === 'In Stock') icon.className = 'w-3.5 h-3.5 text-emerald-500';
                    else if (btn.dataset.invStatus === 'Low Stock') icon.className = 'w-3.5 h-3.5 text-amber-500';
                    else if (btn.dataset.invStatus === 'Out of Stock') icon.className = 'w-3.5 h-3.5 text-rose-500';
                    else icon.className = 'w-3.5 h-3.5 text-slate-400';
                }
            }
            btn.onclick = () => {
                this.renderInventoryTable(btn.dataset.invStatus);
            };
        });
        if (window.lucide) lucide.createIcons();

        // Bind Card click filters
        document.querySelectorAll('.inv-card-filter').forEach(card => {
            card.onclick = () => {
                const status = card.dataset.status;
                this.renderInventoryTable(status);
            };
        });

        // Bind Auto-restock low stock items button
        const restockBtn = document.getElementById('btn-restock-low-all');
        if (restockBtn) {
            restockBtn.onclick = () => {
                let restockedCount = 0;
                allProducts.forEach(p => {
                    if (p.stock <= p.minStock || p.status !== 'In Stock') {
                        inventoryInstance.adjustStock(p.id, 10);
                        restockedCount++;
                    }
                });
                if (restockedCount > 0) {
                    showToast(`Restocked +10 units to ${restockedCount} items!`, 'success');
                    this.renderInventoryTable(filterStatus);
                    initPOSView();
                } else {
                    showToast('All items are already well stocked!', 'info');
                }
            };
        }

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-8 text-center text-slate-400">
                        <i data-lucide="boxes" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-xs font-semibold">No products matching "${filterStatus}" status</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = products.map(p => `
                <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td class="py-3 px-4 flex items-center gap-3">
                        <img src="${p.image}" alt="${p.name}" class="w-10 h-10 rounded-full object-cover shadow-xs">
                        <div>
                            <h4 class="text-xs font-bold text-slate-900">${p.name}</h4>
                            <p class="text-[11px] text-slate-400 font-mono">${p.sku}</p>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-xs font-bold text-slate-900">${p.stock} units</td>
                    <td class="py-3 px-4 text-xs font-semibold text-slate-500">${p.minStock} units</td>
                    <td class="py-3 px-4">
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${
                            p.status === 'Out of Stock' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                            (p.status === 'Low Stock' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200')
                        }">
                            <span class="w-1.5 h-1.5 rounded-full ${
                                p.status === 'Out of Stock' ? 'bg-rose-500' : (p.status === 'Low Stock' ? 'bg-amber-500' : 'bg-emerald-500')
                            }"></span>
                            ${p.status}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-xs text-slate-400">Just now</td>
                    <td class="py-3 px-4 text-right">
                        <div class="flex items-center justify-end gap-1">
                            <button class="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors btn-adjust-stock" data-id="${p.id}" data-delta="5">+5</button>
                            <button class="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors btn-adjust-stock" data-id="${p.id}" data-delta="10">+10</button>
                            <button class="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors btn-adjust-stock" data-id="${p.id}" data-delta="-1">-1</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        tableBody.querySelectorAll('.btn-adjust-stock').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const delta = parseInt(btn.dataset.delta);
                inventoryInstance.adjustStock(id, delta);
                this.renderInventoryTable(filterStatus);
                initPOSView();
            };
        });

        if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }

    renderTransactionsTable() {
        const tableBody = document.getElementById('transactions-table-body');
        if (!tableBody) return;

        const txns = transactionsInstance.getAll();
        tableBody.innerHTML = txns.map(t => `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                <td class="py-3 px-4 font-mono font-bold text-xs text-slate-900">${t.id}</td>
                <td class="py-3 px-4 text-xs text-slate-600">${formatDateTime(t.date)}</td>
                <td class="py-3 px-4 text-xs font-semibold text-slate-800">${t.cashier}</td>
                <td class="py-3 px-4 text-xs text-slate-600">${t.customer}</td>
                <td class="py-3 px-4 text-xs font-medium text-slate-500">${t.items.length} items</td>
                <td class="py-3 px-4">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">${t.paymentMethod}</span>
                </td>
                <td class="py-3 px-4 text-xs font-extrabold text-slate-900">${formatCurrency(t.total)}</td>
                <td class="py-3 px-4 text-right">
                    <button class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors btn-view-receipt" data-id="${t.id}">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-view-receipt').forEach(btn => {
            btn.onclick = () => {
                const txn = transactionsInstance.getById(btn.dataset.id);
                if (txn) {
                    import('./modal.js').then(m => m.showReceiptModal(txn));
                }
            };
        });

        if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }

    renderUsersTable() {
        const tableBody = document.getElementById('users-table-body');
        if (!tableBody) return;

        const users = usersAdminInstance.getAll();
        tableBody.innerHTML = users.map(u => `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                <td class="py-3 px-4 flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        ${u.name.charAt(0)}
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-slate-900">${u.name}</h4>
                        <p class="text-[11px] text-slate-400">@${u.username}</p>
                    </div>
                </td>
                <td class="py-3 px-4 text-xs text-slate-600">${u.email}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${u.role === ROLES.ADMIN ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}">${u.role}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${u.status}</span>
                </td>
                <td class="py-3 px-4 text-xs text-slate-400">${u.lastLogin}</td>
                <td class="py-3 px-4 text-right">
                    <button class="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors btn-toggle-user-status" data-id="${u.id}">
                        ${u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                </td>
            </tr>
        `).join('');

        tableBody.querySelectorAll('.btn-toggle-user-status').forEach(btn => {
            btn.onclick = () => {
                usersAdminInstance.toggleStatus(btn.dataset.id);
                this.renderUsersTable();
            };
        });

        if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }

    renderCustomersTable(query = '') {
        const tableBody = document.getElementById('customers-table-body');
        if (!tableBody) return;

        const searchInput = document.getElementById('customer-search-input');
        const searchVal = query !== '' ? query : (searchInput ? searchInput.value.trim() : '');
        const customers = searchVal ? customersInstance.search(searchVal) : customersInstance.getAll();

        if (customers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-8 text-center text-slate-400">
                        <i data-lucide="search-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                        <p class="text-xs font-semibold">No matching customers found</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = customers.map(c => `
                <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td class="py-3 px-4 flex items-center gap-3">
                        <div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                            ${c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-slate-900">${c.name}</h4>
                            <p class="text-[11px] text-slate-400 font-mono">${c.id}</p>
                        </div>
                    </td>
                    <td class="py-3 px-4 text-xs font-semibold text-slate-600">${c.phone || 'N/A'}</td>
                    <td class="py-3 px-4 text-xs font-semibold text-slate-600">${c.email || 'N/A'}</td>
                    <td class="py-3 px-4 text-xs text-slate-500 truncate max-w-[180px]">${c.address || 'N/A'}</td>
                    <td class="py-3 px-4 text-xs font-bold text-slate-900">${formatCurrency(c.totalPurchases || 0)}</td>
                </tr>
            `).join('');
        }

        if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }
}

// Instantiate and initialize on DOM Ready or immediately if DOM is already loaded
function startApp() {
    window.app = new App();
    window.app.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
