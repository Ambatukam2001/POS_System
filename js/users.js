/**
 * User & Staff Management Module (Admin Only)
 */

import { storage, generateId } from './utils.js';
import { showToast } from './toast.js';
import { ROLES } from './auth.js';

const INITIAL_USERS = [
    {
        id: 'USR-001',
        name: 'Dimacaling',
        username: 'admin',
        password: 'admin123',
        email: 'admin@pos.system',
        role: ROLES.ADMIN,
        status: 'Active',
        lastLogin: 'Today, 12:30 PM'
    },
    {
        id: 'USR-002',
        name: 'Maria Santos',
        username: 'cashier',
        password: 'cashier123',
        email: 'maria@pos.system',
        role: ROLES.CASHIER,
        status: 'Active',
        lastLogin: 'Today, 11:45 AM'
    },
    {
        id: 'USR-003',
        name: 'Carlos Reyes',
        username: 'creyes',
        password: 'cashier123',
        email: 'carlos@pos.system',
        role: ROLES.CASHIER,
        status: 'Active',
        lastLogin: 'Yesterday, 6:00 PM'
    },
    {
        id: 'USR-004',
        name: 'Ana Ramos',
        username: 'aramos',
        password: 'cashier123',
        email: 'ana@pos.system',
        role: ROLES.CASHIER,
        status: 'Inactive',
        lastLogin: 'Sep 20, 2026'
    }
];

export class UserAdminManager {
    constructor() {
        this.users = storage.get('users', INITIAL_USERS);
    }

    save() {
        storage.set('users', this.users);
    }

    getAll() {
        return this.users;
    }

    addUser(data) {
        const newUser = {
            id: generateId('USR'),
            name: data.name,
            username: data.username || data.name.toLowerCase().replace(/\s+/g, ''),
            password: data.password || (data.role === ROLES.ADMIN ? 'admin123' : 'cashier123'),
            email: data.email || `${(data.username || 'staff').toLowerCase()}@pos.system`,
            role: data.role || ROLES.CASHIER,
            status: data.status || 'Active',
            lastLogin: 'Never'
        };

        this.users.push(newUser);
        this.save();
        showToast(`Staff account ${newUser.name} created successfully`, 'success');
        return newUser;
    }

    updateUser(id, data) {
        const index = this.users.findIndex(u => u.id === id);
        if (index !== -1) {
            this.users[index] = { ...this.users[index], ...data };
            this.save();
            showToast(`User details updated`, 'info');
            return this.users[index];
        }
        return null;
    }

    toggleStatus(id) {
        const user = this.users.find(u => u.id === id);
        if (user) {
            user.status = user.status === 'Active' ? 'Inactive' : 'Active';
            this.save();
            showToast(`User ${user.name} is now ${user.status}`, 'warning');
        }
    }
}

export const usersAdminInstance = new UserAdminManager();
