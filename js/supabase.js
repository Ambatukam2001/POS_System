/**
 * Supabase Cloud Database Client Service
 * Handles all 5 tables: products, orders, order_items, customers, users
 */

import { ENV } from './env.js';

const SUPABASE_URL = ENV.SUPABASE_URL;
const SUPABASE_KEY = ENV.SUPABASE_ANON_KEY;

export const supabase = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

// ─────────────────────────────────────────────
// REST helper — always works even without SDK
// ─────────────────────────────────────────────
async function restFetch(path, options = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) }
    });
    if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText);
        throw new Error(`Supabase REST ${res.status}: ${errText}`);
    }
    if (res.status === 204) return null;
    return res.json();
}

export const supabaseClient = {

    // ════════════════════════════════════════
    // PRODUCTS
    // ════════════════════════════════════════

    async getProducts() {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
                if (!error && Array.isArray(data)) return data;
            }
            const data = await restFetch('products?select=*&order=id.asc');
            return Array.isArray(data) ? data : [];
        } catch (err) { console.warn('[Supabase] getProducts:', err.message); return null; }
    },

    async addProduct(product) {
        try {
            const payload = {
                sku: product.sku, name: product.name, category: product.category,
                weight: product.weight || '300g',
                price: parseFloat(product.price) || 0,
                cost: parseFloat(product.cost) || 0,
                rating: parseFloat(product.rating) || 5.0,
                stock: parseInt(product.stock) || 0,
                min_stock: parseInt(product.minStock) || 5,
                bg_color: product.bgColor || 'bg-pastel-pink',
                image: product.image || '',
                favorite: product.favorite || false,
                status: product.status || 'In Stock'
            };
            if (supabase) {
                const { data, error } = await supabase.from('products').insert([payload]).select();
                if (error) throw new Error(error.message);
                if (data && data[0]) return data[0];
            }
            const inserted = await restFetch('products', { method: 'POST', body: JSON.stringify([payload]) });
            return inserted ? inserted[0] : null;
        } catch (err) { console.error('[Supabase] addProduct:', err.message); return null; }
    },

    // Update product by numeric ID OR by SKU as fallback
    async updateProduct(productId, product) {
        try {
            const numId = !isNaN(Number(productId)) && Number(productId) > 0 ? Number(productId) : null;
            const stockVal = parseInt(product.stock) || 0;
            const minVal = parseInt(product.minStock) || 5;
            const status = stockVal <= 0 ? 'Out of Stock' : (stockVal <= minVal ? 'Low Stock' : 'In Stock');
            const payload = {
                name: product.name, category: product.category,
                weight: product.weight || '300g',
                price: parseFloat(product.price) || 0,
                cost: parseFloat(product.cost) || 0,
                stock: stockVal, min_stock: minVal,
                bg_color: product.bgColor || 'bg-pastel-pink',
                image: product.image || '', status
            };

            if (numId) {
                if (supabase) { await supabase.from('products').update(payload).eq('id', numId); return; }
                await restFetch(`products?id=eq.${numId}`, { method: 'PATCH', body: JSON.stringify(payload) });
            } else if (product.sku) {
                // Fallback: match by SKU when ID is a local string like PRD-101
                if (supabase) { await supabase.from('products').update(payload).eq('sku', product.sku); return; }
                await restFetch(`products?sku=eq.${encodeURIComponent(product.sku)}`, { method: 'PATCH', body: JSON.stringify(payload) });
            }
        } catch (err) { console.error('[Supabase] updateProduct:', err.message); }
    },

    async updateProductStock(productId, newStock, sku) {
        try {
            const numId = !isNaN(Number(productId)) && Number(productId) > 0 ? Number(productId) : null;
            const status = newStock <= 0 ? 'Out of Stock' : (newStock <= 5 ? 'Low Stock' : 'In Stock');
            const payload = { stock: newStock, status };

            if (numId) {
                if (supabase) { await supabase.from('products').update(payload).eq('id', numId); return; }
                await restFetch(`products?id=eq.${numId}`, { method: 'PATCH', body: JSON.stringify(payload) });
            } else if (sku) {
                if (supabase) { await supabase.from('products').update(payload).eq('sku', sku); return; }
                await restFetch(`products?sku=eq.${encodeURIComponent(sku)}`, { method: 'PATCH', body: JSON.stringify(payload) });
            }
        } catch (err) { console.error('[Supabase] updateProductStock:', err.message); }
    },

    async deleteProduct(productId, sku) {
        try {
            const numId = !isNaN(Number(productId)) && Number(productId) > 0 ? Number(productId) : null;
            if (numId) {
                if (supabase) { await supabase.from('products').delete().eq('id', numId); return; }
                await restFetch(`products?id=eq.${numId}`, { method: 'DELETE', headers: { 'Prefer': '' } });
            } else if (sku) {
                if (supabase) { await supabase.from('products').delete().eq('sku', sku); return; }
                await restFetch(`products?sku=eq.${encodeURIComponent(sku)}`, { method: 'DELETE', headers: { 'Prefer': '' } });
            }
        } catch (err) { console.error('[Supabase] deleteProduct:', err.message); }
    },

    // ════════════════════════════════════════
    // ORDERS + ORDER_ITEMS
    // ════════════════════════════════════════

    async createOrder(orderData, items) {
        try {
            const cleanOrder = {
                order_number: orderData.order_number || `ORD-${Date.now()}`,
                cashier_id: (!isNaN(Number(orderData.cashier_id)) && Number(orderData.cashier_id) > 0) ? Number(orderData.cashier_id) : null,
                customer_id: (!isNaN(Number(orderData.customer_id)) && Number(orderData.customer_id) > 0) ? Number(orderData.customer_id) : null,
                subtotal: parseFloat(orderData.subtotal) || 0,
                discount: parseFloat(orderData.discount) || 0,
                tax: parseFloat(orderData.tax) || 0,
                total: parseFloat(orderData.total) || 0,
                payment_method: orderData.payment_method || 'Cash',
                payment_status: orderData.payment_status || 'Paid'
            };

            let createdOrder = null;
            if (supabase) {
                const { data: orders, error } = await supabase.from('orders').insert([cleanOrder]).select();
                if (error) throw new Error(error.message);
                if (orders && orders[0]) createdOrder = orders[0];
            } else {
                const inserted = await restFetch('orders', { method: 'POST', body: JSON.stringify([cleanOrder]) });
                createdOrder = inserted ? inserted[0] : null;
            }

            if (createdOrder && items && items.length > 0) {
                const lineItems = items.map(item => ({
                    order_id: createdOrder.id,
                    product_id: (!isNaN(Number(item.product.id)) && Number(item.product.id) > 0)
                        ? Number(item.product.id) : null,
                    product_name: item.product.name,
                    price: parseFloat(item.product.price) || 0,
                    quantity: parseInt(item.quantity) || 1,
                    subtotal: (parseFloat(item.product.price) || 0) * (parseInt(item.quantity) || 1)
                }));
                if (supabase) { await supabase.from('order_items').insert(lineItems); }
                else { await restFetch('order_items', { method: 'POST', body: JSON.stringify(lineItems) }); }
            }
            return createdOrder;
        } catch (err) { console.error('[Supabase] createOrder:', err.message); return null; }
    },

    // ════════════════════════════════════════
    // CUSTOMERS
    // ════════════════════════════════════════

    async getCustomers() {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('customers').select('*').order('id', { ascending: true });
                if (!error && Array.isArray(data)) return data;
            }
            const data = await restFetch('customers?select=*&order=id.asc');
            return Array.isArray(data) ? data : [];
        } catch (err) { console.warn('[Supabase] getCustomers:', err.message); return null; }
    },

    async upsertCustomer(customer) {
        try {
            const payload = {
                name: customer.name,
                phone: customer.phone || 'N/A',
                email: customer.email || 'N/A',
                address: customer.address || 'N/A',
                total_purchases: parseFloat(customer.totalPurchases || customer.total_purchases) || 0
            };
            if (supabase) {
                const { data: existing } = await supabase
                    .from('customers').select('*').ilike('name', customer.name).maybeSingle();
                if (existing && existing.id) {
                    const { data: updated } = await supabase.from('customers').update({
                        ...payload,
                        total_purchases: (parseFloat(existing.total_purchases) || 0) + (parseFloat(customer.purchaseAmount) || 0)
                    }).eq('id', existing.id).select();
                    return updated ? updated[0] : existing;
                } else {
                    const { data: inserted } = await supabase.from('customers').insert([payload]).select();
                    return inserted ? inserted[0] : null;
                }
            }
            const search = await restFetch(
                `customers?name=ilike.${encodeURIComponent(customer.name)}&select=*`
            ).catch(() => null);
            if (search && search[0] && search[0].id) {
                const existing = search[0];
                const updated = await restFetch(`customers?id=eq.${existing.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        ...payload,
                        total_purchases: (parseFloat(existing.total_purchases) || 0) + (parseFloat(customer.purchaseAmount) || 0)
                    })
                });
                return updated ? updated[0] : existing;
            } else {
                const inserted = await restFetch('customers', { method: 'POST', body: JSON.stringify([payload]) });
                return inserted ? inserted[0] : null;
            }
        } catch (err) { console.error('[Supabase] upsertCustomer:', err.message); return null; }
    },

    async seedCustomers(customers) {
        try {
            const toSeed = customers
                .filter(c => c.name && c.name !== 'Walk-in Customer' && c.name !== 'Walk-in Guest')
                .map(c => ({
                    name: c.name,
                    phone: c.phone || 'N/A',
                    email: c.email || 'N/A',
                    address: c.address || 'N/A',
                    total_purchases: parseFloat(c.totalPurchases) || 0
                }));
            if (!toSeed.length) return;
            if (supabase) {
                await supabase.from('customers').insert(toSeed);
            } else {
                await restFetch('customers', { method: 'POST', body: JSON.stringify(toSeed) });
            }
        } catch (err) { console.error('[Supabase] seedCustomers:', err.message); }
    },

    // ════════════════════════════════════════
    // USERS
    // ════════════════════════════════════════

    async getUsers() {
        try {
            if (supabase) {
                const { data, error } = await supabase.from('users').select('*').order('id', { ascending: true });
                if (!error && Array.isArray(data)) return data;
            }
            const data = await restFetch('users?select=*&order=id.asc');
            return Array.isArray(data) ? data : [];
        } catch (err) { console.warn('[Supabase] getUsers:', err.message); return null; }
    },

    async upsertUser(user) {
        try {
            const payload = {
                name: user.name, username: user.username,
                email: user.email || `${user.username}@pos.system`,
                role: user.role, status: user.status || 'Active',
                last_login: user.lastLogin || 'Never'
            };
            if (supabase) {
                const { data: existing } = await supabase
                    .from('users').select('id').eq('username', user.username).maybeSingle();
                if (existing && existing.id) {
                    await supabase.from('users').update(payload).eq('id', existing.id);
                } else {
                    await supabase.from('users').insert([payload]).select();
                }
                return;
            }
            const search = await restFetch(
                `users?username=eq.${encodeURIComponent(user.username)}&select=id`
            ).catch(() => null);
            if (search && search[0] && search[0].id) {
                await restFetch(`users?id=eq.${search[0].id}`, { method: 'PATCH', body: JSON.stringify(payload) });
            } else {
                await restFetch('users', { method: 'POST', body: JSON.stringify([payload]) });
            }
        } catch (err) { console.error('[Supabase] upsertUser:', err.message); }
    },

    async seedUsers(users) {
        try {
            const toSeed = users.map(u => ({
                name: u.name, username: u.username,
                email: u.email || `${u.username}@pos.system`,
                role: u.role, status: u.status || 'Active',
                last_login: u.lastLogin || 'Never'
            }));
            if (!toSeed.length) return;
            if (supabase) {
                await supabase.from('users').insert(toSeed);
            } else {
                await restFetch('users', { method: 'POST', body: JSON.stringify(toSeed) });
            }
        } catch (err) { console.error('[Supabase] seedUsers:', err.message); }
    },

    // ════════════════════════════════════════
    // REALTIME SUBSCRIPTIONS
    // ════════════════════════════════════════

    subscribeToRealtime(onTableChange) {
        if (!supabase) return null;
        try {
            const channel = supabase.channel('pos-realtime-changes')
                .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                    console.log('[Supabase Realtime] Event:', payload.table, payload.eventType);
                    if (typeof onTableChange === 'function') {
                        onTableChange(payload.table, payload);
                    }
                })
                .subscribe();
            return channel;
        } catch (e) {
            console.warn('[Supabase Realtime] Failed to subscribe:', e.message);
            return null;
        }
    }
};
