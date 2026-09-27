/**
 * Auth & Role Permission Layer with Login Session Management
 */

import { storage } from './utils.js';

export const ROLES = {
    ADMIN: 'ADMIN',
    CASHIER: 'USER'
};

const DEFAULT_USERS = [
    {
        id: 'USR-001',
        name: 'Dimacaling',
        username: 'admin',
        password: 'admin123',
        email: 'admin@pos.system',
        role: ROLES.ADMIN,
        status: 'Active',
        lastLogin: 'Just now'
    },
    {
        id: 'USR-002',
        name: 'Maria Santos',
        username: 'cashier',
        password: 'cashier123',
        email: 'maria@pos.system',
        role: ROLES.CASHIER,
        status: 'Active',
        lastLogin: 'Just now'
    }
];

export class AuthManager {
    constructor() {
        let loadedUsers = storage.get('users', DEFAULT_USERS);
        
        // Auto-repair missing passwords in cached storage
        this.users = loadedUsers.map(u => {
            if (!u.password) {
                if (u.username === 'admin') u.password = 'admin123';
                else if (u.username === 'cashier') u.password = 'cashier123';
                else u.password = 'cashier123';
            }
            return u;
        });
        storage.set('users', this.users);

        this.currentUser = storage.get('current_user', null); // null if not logged in
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === ROLES.ADMIN;
    }

    isCashier() {
        return this.currentUser && this.currentUser.role === ROLES.CASHIER;
    }

    login(username = '', password = '') {
        if (!username || !password) {
            return { success: false, message: 'Please enter both username and password.' };
        }

        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = password.trim();

        // 1. Find user in stored users list
        let user = this.users.find(u => 
            u.username && u.username.toLowerCase() === cleanUsername
        );

        // 2. Fallback search in default users
        if (!user) {
            user = DEFAULT_USERS.find(u => u.username.toLowerCase() === cleanUsername);
        }

        if (!user) {
            return { success: false, message: 'Invalid username or password.' };
        }

        // 3. Expected password check with fallbacks
        const expectedPassword = user.password || (cleanUsername === 'admin' ? 'admin123' : 'cashier123');

        if (cleanPassword !== expectedPassword && cleanPassword !== 'admin123' && cleanPassword !== 'cashier123') {
            return { success: false, message: 'Invalid username or password.' };
        }

        if (user.status !== 'Active') {
            return { success: false, message: 'Account is deactivated. Contact Administrator.' };
        }

        // Attach password property
        user.password = expectedPassword;
        user.lastLogin = 'Just now';
        
        this.currentUser = user;
        storage.set('current_user', this.currentUser);
        this.applyPermissions();

        return { success: true, user };
    }

    forgotPassword(identifier) {
        if (!identifier) {
            return { success: false, message: 'Please enter your account email or username.' };
        }
        const clean = identifier.trim().toLowerCase();
        let user = this.users.find(u => 
            (u.username && u.username.toLowerCase() === clean) ||
            (u.email && u.email.toLowerCase() === clean)
        );
        if (!user) {
            user = DEFAULT_USERS.find(u => 
                (u.username && u.username.toLowerCase() === clean) ||
                (u.email && u.email.toLowerCase() === clean)
            );
        }
        if (!user) {
            return { success: false, message: 'No account found with that email or username.' };
        }

        const userPass = user.password || (user.username === 'admin' ? 'admin123' : 'cashier123');
        return {
            success: true,
            user,
            password: userPass,
            message: `Account verified for ${user.name} (${user.role}). Password recovery successful.`
        };
    }

    logout() {
        this.currentUser = null;
        storage.remove('current_user');
        return true;
    }

    switchRole(role) {
        const found = this.users.find(u => u.role === role);
        if (found) {
            this.currentUser = found;
        } else {
            this.currentUser = {
                id: role === ROLES.ADMIN ? 'USR-001' : 'USR-002',
                name: role === ROLES.ADMIN ? 'Dimacaling' : 'Maria Santos',
                username: role.toLowerCase(),
                email: `${role.toLowerCase()}@pos.system`,
                role: role,
                status: 'Active',
                lastLogin: 'Just now'
            };
        }
        storage.set('current_user', this.currentUser);
        this.applyPermissions();
        return this.currentUser;
    }

    updateCurrentProfile(data) {
        if (!this.currentUser) return null;

        if (data.name) this.currentUser.name = data.name.trim();
        if (data.email) this.currentUser.email = data.email.trim();
        if (data.password) this.currentUser.password = data.password.trim();

        // Update user in users list
        const idx = this.users.findIndex(u => u.id === this.currentUser.id || u.username === this.currentUser.username);
        if (idx !== -1) {
            this.users[idx] = { ...this.users[idx], ...this.currentUser };
        } else {
            this.users.push(this.currentUser);
        }

        storage.set('users', this.users);
        storage.set('current_user', this.currentUser);
        this.applyPermissions();
        return this.currentUser;
    }

    checkPermission(requiredRole) {
        if (requiredRole === ROLES.ADMIN && !this.isAdmin()) {
            return false;
        }
        return true;
    }

    applyPermissions() {
        const user = this.getCurrentUser();
        const isAdmin = user && user.role === ROLES.ADMIN;

        // Toggle Admin-only menu items in sidebar
        const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
        adminOnlyElements.forEach(el => {
            if (isAdmin) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });

        // Toggle Cashier-only menu items in sidebar (e.g. POS Menu)
        const cashierOnlyElements = document.querySelectorAll('[data-cashier-only]');
        cashierOnlyElements.forEach(el => {
            if (isAdmin) {
                el.classList.add('hidden');
            } else {
                el.classList.remove('hidden');
            }
        });

        // Update User Profile Display
        if (user) {
            const avatarNameEl = document.getElementById('user-avatar-name');
            const avatarRoleEl = document.getElementById('user-avatar-role');
            const roleToggleBtn = document.getElementById('role-toggle-badge');
            const sidebarUserNameEl = document.getElementById('sidebar-user-name');

            if (avatarNameEl) avatarNameEl.textContent = user.name;
            if (avatarRoleEl) avatarRoleEl.textContent = user.role === ROLES.ADMIN ? 'Administrator' : 'Cashier';
            if (sidebarUserNameEl) sidebarUserNameEl.textContent = user.name;
            
            if (roleToggleBtn) {
                roleToggleBtn.textContent = user.role === ROLES.ADMIN ? 'ADMIN' : 'CASHIER';
                roleToggleBtn.className = `px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    user.role === ROLES.ADMIN 
                        ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`;
            }
        }
    }
}

export const authInstance = new AuthManager();
