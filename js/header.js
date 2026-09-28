/**
 * Header Action Bar Functions (Filters, Notifications, User Profile Modal)
 */

import { authInstance, ROLES } from './auth.js';
import { openModal, closeModal } from './modal.js';
import { showToast } from './toast.js';

export function initHeaderFunctions() {
    setupFilterButton();
    setupNotificationBell();
    setupUserProfileModal();
}

function setupFilterButton() {
    const filterBtn = document.getElementById('header-filter-btn');
    if (filterBtn) {
        filterBtn.onclick = () => {
            openModal('filter-modal');
        };
    }

    const filterForm = document.getElementById('filter-modal-form');
    if (filterForm) {
        filterForm.onsubmit = (e) => {
            e.preventDefault();
            const category = document.getElementById('filter-category-select').value;
            const stockStatus = document.getElementById('filter-stock-select').value;
            const sortBy = document.getElementById('filter-sort-select').value;

            // Trigger product grid filtering
            const categoryBtns = document.querySelectorAll('#pos-filter-pills [data-category]');
            categoryBtns.forEach(b => {
                if (b.dataset.category === category) {
                    b.click();
                }
            });

            closeModal('filter-modal');
            showToast(`Filter applied: ${category} • ${stockStatus}`, 'info');
        };
    }
}

function setupNotificationBell() {
    const bellBtn = document.getElementById('header-bell-btn');
    const popover = document.getElementById('notification-popover');
    const badge = document.getElementById('header-bell-badge');

    if (bellBtn && popover) {
        bellBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = !popover.classList.contains('hidden');

            if (badge) badge.classList.add('hidden');

            if (isOpen) {
                popover.classList.add('opacity-0', 'scale-95');
                setTimeout(() => popover.classList.add('hidden'), 200);
            } else {
                popover.classList.remove('hidden');
                requestAnimationFrame(() => {
                    popover.classList.remove('opacity-0', 'scale-95');
                });
            }
        };

        document.addEventListener('click', (e) => {
            if (!popover.contains(e.target) && !bellBtn.contains(e.target)) {
                if (!popover.classList.contains('hidden')) {
                    popover.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => popover.classList.add('hidden'), 200);
                }
            }
        });
    }

    const clearBtn = document.getElementById('clear-notifications-popover-btn');
    const unreadCount = document.getElementById('notification-unread-count');
    if (clearBtn) {
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            const list = document.getElementById('notifications-popover-list');
            if (list) {
                list.innerHTML = `
                    <div class="text-center py-8 text-slate-400 text-xs space-y-1">
                        <i data-lucide="check-circle-2" class="w-8 h-8 mx-auto text-emerald-500"></i>
                        <p class="font-extrabold text-slate-700">All notifications marked as read</p>
                    </div>
                `;
            }
            if (unreadCount) unreadCount.textContent = '0 unread';
            if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
            showToast('Marked all notifications as read', 'info');
        };
    }
}

function setupUserProfileModal() {
    const profileTriggers = [
        document.getElementById('header-user-profile-trigger'),
        document.getElementById('btn-mobile-nav-profile')
    ];

    const openProfileModal = () => {
        const user = authInstance.getCurrentUser() || { name: 'Dimacaling', email: 'admin@pos.system', role: 'ADMIN' };
        const nameEl = document.getElementById('profile-modal-name');
        const emailEl = document.getElementById('profile-modal-email');
        const roleEl = document.getElementById('profile-modal-role');

        const nameInput = document.getElementById('profile-input-name');
        const emailInput = document.getElementById('profile-input-email');
        const passInput = document.getElementById('profile-input-password');

        if (nameEl) nameEl.textContent = user.name;
        if (emailEl) emailEl.textContent = user.email;
        if (roleEl) roleEl.textContent = user.role === ROLES.ADMIN ? 'Administrator' : 'Cashier';

        if (nameInput) nameInput.value = user.name || '';
        if (emailInput) emailInput.value = user.email || '';
        if (passInput) passInput.value = '';

        openModal('user-profile-modal');
    };

    profileTriggers.forEach(btn => {
        if (btn) btn.onclick = openProfileModal;
    });

    // Profile Modal Log Out Button
    const modalLogoutBtn = document.getElementById('modal-profile-logout-btn');
    if (modalLogoutBtn) {
        modalLogoutBtn.onclick = () => {
            closeModal('user-profile-modal');
            authInstance.logout();
            const loginView = document.getElementById('view-login');
            const mainApp = document.getElementById('main-app-container');
            if (loginView) loginView.classList.remove('hidden');
            if (mainApp) mainApp.classList.add('hidden');
            showToast('Logged out successfully.', 'info');
        };
    }
}
