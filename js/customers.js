/**
 * Customer Directory Module
 */

import { storage, generateId } from './utils.js';
import { showToast } from './toast.js';
import { supabaseClient } from './supabase.js';

const INITIAL_CUSTOMERS = [
    {
        id: 'CUST-000',
        name: 'Walk-in Customer',
        phone: 'N/A',
        email: 'walkin@pos.system',
        address: 'Over the counter',
        totalPurchases: 15420.00,
        lastTransaction: 'Today, 10:30 AM'
    },
    {
        id: 'CUST-001',
        name: 'Maria Clara',
        phone: '+63 917 123 4567',
        email: 'maria.clara@gmail.com',
        address: '69 7th Ave S, New York, NY 10014',
        totalPurchases: 4850.00,
        lastTransaction: 'Today, 11:15 AM'
    },
    {
        id: 'CUST-002',
        name: 'Juan Dela Cruz',
        phone: '+63 918 987 6543',
        email: 'juan.delacruz@yahoo.com',
        address: '123 Rizal St, Makati City',
        totalPurchases: 6200.00,
        lastTransaction: 'Yesterday, 3:45 PM'
    },
    {
        id: 'CUST-003',
        name: 'Andres Bonifacio',
        phone: '+63 920 555 8899',
        email: 'andres.b@katipunan.ph',
        address: '45 Monumento Circle, Caloocan City',
        totalPurchases: 2950.00,
        lastTransaction: 'Sep 24, 2026'
    }
];

export class CustomerManager {
    constructor() {
        this.customers = storage.get('customers', INITIAL_CUSTOMERS);
        this.syncFromSupabase();

        // Setup live sync polling every 4 seconds
        setInterval(() => this.syncFromSupabase(), 4000);

        // Setup real-time WebSocket subscription if available
        if (typeof window !== 'undefined') {
            supabaseClient.subscribeToRealtime((table) => {
                if (table === 'customers') {
                    console.log('[Realtime] Live customer update received');
                    this.syncFromSupabase();
                }
            });
        }
    }

    async syncFromSupabase() {
        try {
            const cloudData = await supabaseClient.getCustomers();

            if (cloudData === null) return; // network error

            if (cloudData.length === 0) {
                // Supabase empty — seed local customers (skip walk-in)
                await supabaseClient.seedCustomers(this.customers);
                const seeded = await supabaseClient.getCustomers();
                if (seeded && seeded.length > 0) {
                    this.customers = this._mapCloud(seeded);
                    this.save();
                }
            } else {
                const cloudMapped = this._mapCloud(cloudData);
                const cloudNames = new Set(cloudMapped.map(c => c.name.toLowerCase()));
                const localOnly = this.customers.filter(c => !cloudNames.has(c.name.toLowerCase()));
                const updatedCustomers = [...cloudMapped, ...localOnly];
                const hasChanged = JSON.stringify(this.customers) !== JSON.stringify(updatedCustomers);
                this.customers = updatedCustomers;
                this.save();

                if (hasChanged && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('supabase-customers-updated', { detail: this.customers }));
                }
            }

            if (typeof window !== 'undefined' && window._renderCustomerDirectory) {
                window._renderCustomerDirectory();
            }
        } catch (e) {
            console.warn('[Supabase] Customer sync notice:', e.message);
        }
    }

    _mapCloud(cloudData) {
        return cloudData.map(c => ({
            id: c.id ? String(c.id) : generateId('CUST'),
            name: c.name,
            phone: c.phone || 'N/A',
            email: c.email || 'N/A',
            address: c.address || 'N/A',
            totalPurchases: parseFloat(c.total_purchases || c.totalPurchases) || 0,
            lastTransaction: c.last_transaction || c.lastTransaction || 'N/A'
        }));
    }

    save() {
        storage.set('customers', this.customers);
    }

    getAll() {
        return this.customers;
    }

    getById(id) {
        return this.customers.find(c => c.id === id);
    }

    addCustomer(data) {
        const customer = {
            id: generateId('CUST'),
            name: data.name,
            phone: data.phone || 'N/A',
            email: data.email || 'N/A',
            address: data.address || 'N/A',
            totalPurchases: 0,
            lastTransaction: 'New Customer'
        };

        this.customers.unshift(customer);
        this.save();
        supabaseClient.upsertCustomer(customer).then(inserted => {
            if (inserted && inserted.id) {
                const idx = this.customers.findIndex(c => c.name.toLowerCase() === customer.name.toLowerCase());
                if (idx !== -1) {
                    this.customers[idx].id = String(inserted.id);
                    this.save();
                }
            }
        });
        showToast(`Added customer ${customer.name}`, 'success');
        return customer;
    }

    addOrUpdateCustomer(data) {
        if (!data || !data.name || data.name === 'Walk-in Guest' || data.name === 'Walk-in Customer') {
            return null;
        }

        const cleanName = data.name.trim();
        let existing = this.customers.find(c => c.name.toLowerCase() === cleanName.toLowerCase());

        if (existing) {
            if (data.phone && data.phone !== 'N/A') existing.phone = data.phone;
            if (data.email && data.email !== 'N/A') existing.email = data.email;
            if (data.purchaseAmount) existing.totalPurchases = (parseFloat(existing.totalPurchases) || 0) + (parseFloat(data.purchaseAmount) || 0);
            existing.lastTransaction = 'Just now';
            this.save();
            supabaseClient.upsertCustomer({ ...existing, purchaseAmount: data.purchaseAmount }).then(updated => {
                if (updated && updated.id) {
                    existing.id = String(updated.id);
                    this.save();
                }
            });
            return existing;
        } else {
            const newCust = {
                id: generateId('CUST'),
                name: cleanName,
                phone: data.phone || 'N/A',
                email: data.email || 'N/A',
                address: data.address || 'Standard Order',
                totalPurchases: parseFloat(data.purchaseAmount) || 0,
                lastTransaction: 'Just now'
            };
            this.customers.unshift(newCust);
            this.save();
            supabaseClient.upsertCustomer({ ...newCust, purchaseAmount: data.purchaseAmount }).then(inserted => {
                if (inserted && inserted.id) {
                    newCust.id = String(inserted.id);
                    this.save();
                }
            });
            return newCust;
        }
    }

    search(query) {
        if (!query) return this.customers;
        const q = query.toLowerCase();
        return this.customers.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.phone.toLowerCase().includes(q) || 
            c.email.toLowerCase().includes(q)
        );
    }
}

export const customersInstance = new CustomerManager();
