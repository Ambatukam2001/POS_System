/**
 * Product Data Layer & Catalog Management
 */

import { storage, generateId } from './utils.js';
import { supabaseClient } from './supabase.js';

const INITIAL_PRODUCTS = [
    {
        id: 'PRD-101',
        name: 'Cabage salad',
        sku: 'SLD-001',
        barcode: '480651234001',
        category: 'Food',
        weight: '250g',
        price: 249.00,
        cost: 120.00,
        rating: 4.2,
        stock: 35,
        minStock: 10,
        bgColor: 'bg-pastel-pink',
        image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        favorite: true,
        status: 'In Stock'
    },
    {
        id: 'PRD-102',
        name: 'Noodle salad',
        sku: 'SLD-002',
        barcode: '480651234002',
        category: 'Food',
        weight: '300g',
        price: 315.00,
        cost: 150.00,
        rating: 4.5,
        stock: 22,
        minStock: 8,
        bgColor: 'bg-pastel-yellow',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
        favorite: false,
        status: 'In Stock'
    },
    {
        id: 'PRD-103',
        name: 'Vegetable mix',
        sku: 'SLD-003',
        barcode: '480651234003',
        category: 'Food',
        weight: '400g',
        price: 299.00,
        cost: 135.00,
        rating: 5.0,
        stock: 18,
        minStock: 5,
        bgColor: 'bg-pastel-blue',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
        favorite: true,
        status: 'In Stock'
    },
    {
        id: 'PRD-104',
        name: 'Seafood soup',
        sku: 'SOP-001',
        barcode: '480651234004',
        category: 'Food',
        weight: '350g',
        price: 385.00,
        cost: 190.00,
        rating: 4.4,
        stock: 14,
        minStock: 5,
        bgColor: 'bg-pastel-blue',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80',
        favorite: false,
        status: 'In Stock'
    },
    {
        id: 'PRD-105',
        name: 'Bean soup',
        sku: 'SOP-002',
        barcode: '480651234005',
        category: 'Food',
        weight: '350g',
        price: 220.00,
        cost: 95.00,
        rating: 4.9,
        stock: 5,
        minStock: 10,
        bgColor: 'bg-pastel-green',
        image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=400&q=80',
        favorite: true,
        status: 'Low Stock'
    },
    {
        id: 'PRD-106',
        name: 'Stewed vegetables',
        sku: 'SLD-004',
        barcode: '480651234006',
        category: 'Food',
        weight: '400g',
        price: 249.00,
        cost: 110.00,
        rating: 3.9,
        stock: 28,
        minStock: 10,
        bgColor: 'bg-pastel-purple',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        favorite: false,
        status: 'In Stock'
    },
    {
        id: 'PRD-107',
        name: 'Chicken soup',
        sku: 'SOP-003',
        barcode: '480651234007',
        category: 'Food',
        weight: '350g',
        price: 199.00,
        cost: 90.00,
        rating: 4.2,
        stock: 40,
        minStock: 15,
        bgColor: 'bg-pastel-pink',
        image: 'https://images.unsplash.com/photo-1588566565463-180a5b2090d2?auto=format&fit=crop&w=400&q=80',
        favorite: true,
        status: 'In Stock'
    },
    {
        id: 'PRD-108',
        name: 'Roast potatoes',
        sku: 'SD-001',
        barcode: '480651234008',
        category: 'Snacks',
        weight: '300g',
        price: 249.00,
        cost: 100.00,
        rating: 4.4,
        stock: 3,
        minStock: 10,
        bgColor: 'bg-pastel-yellow',
        image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=400&q=80',
        favorite: false,
        status: 'Low Stock'
    },
    {
        id: 'PRD-109',
        name: 'Okroshka cold soup',
        sku: 'SOP-004',
        barcode: '480651234009',
        category: 'Food',
        weight: '350g',
        price: 199.00,
        cost: 85.00,
        rating: 4.2,
        stock: 19,
        minStock: 5,
        bgColor: 'bg-pastel-pink',
        image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=400&q=80',
        favorite: true,
        status: 'In Stock'
    },
    {
        id: 'PRD-110',
        name: 'Fresh Iced Matcha',
        sku: 'DRK-001',
        barcode: '480651234010',
        category: 'Drinks',
        weight: '500ml',
        price: 185.00,
        cost: 70.00,
        rating: 4.8,
        stock: 50,
        minStock: 15,
        bgColor: 'bg-pastel-green',
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
        favorite: true,
        status: 'In Stock'
    },
    {
        id: 'PRD-111',
        name: 'Berry Cheesecake',
        sku: 'DST-001',
        barcode: '480651234011',
        category: 'Desserts',
        weight: '180g',
        price: 220.00,
        cost: 95.00,
        rating: 4.9,
        stock: 0,
        minStock: 5,
        bgColor: 'bg-pastel-purple',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=400&q=80',
        favorite: false,
        status: 'Out of Stock'
    }
];

export class ProductManager {
    constructor() {
        this.products = storage.get('products', INITIAL_PRODUCTS);
        this.syncFromSupabase();
        
        // Setup live sync polling every 4 seconds
        setInterval(() => this.syncFromSupabase(), 4000);

        // Setup real-time WebSocket subscription if available
        if (typeof window !== 'undefined') {
            supabaseClient.subscribeToRealtime((table) => {
                if (table === 'products') {
                    console.log('[Realtime] Live product update received');
                    this.syncFromSupabase();
                }
            });
        }
    }

    async syncFromSupabase() {
        try {
            const cloudProducts = await supabaseClient.getProducts();

            // Network error — keep local data as-is
            if (cloudProducts === null) return;

            if (cloudProducts.length === 0) {
                // ── Supabase is EMPTY: seed all local products ──
                console.log('[Supabase] Products table empty — seeding', this.products.length, 'products...');
                for (const product of this.products) {
                    await supabaseClient.addProduct(product);
                }
                // Re-sync to get the real integer IDs Supabase assigned
                const seeded = await supabaseClient.getProducts();
                if (seeded && seeded.length > 0) {
                    this.products = this._mapCloudProducts(seeded);
                    this.save();
                    console.log('[Supabase] Seeded & synced', this.products.length, 'products.');
                }
            } else {
                // ── Supabase has data: use it as source of truth ──
                const updatedProducts = this._mapCloudProducts(cloudProducts);
                const hasChanged = JSON.stringify(this.products) !== JSON.stringify(updatedProducts);
                this.products = updatedProducts;
                this.save();

                if (hasChanged && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('supabase-products-updated', { detail: this.products }));
                }
            }

            if (typeof window !== 'undefined') {
                if (window._renderPOSProducts) window._renderPOSProducts();
                if (window._renderAdminProducts) window._renderAdminProducts();
            }
        } catch (e) {
            console.warn('[Supabase] Product sync notice:', e.message);
        }
    }

    _mapCloudProducts(cloudProducts) {
        return cloudProducts.map(p => ({
            id: p.id ? String(p.id) : generateId('PRD'),
            sku: p.sku || `SKU-${p.id}`,
            barcode: p.barcode || `48065${p.id || 100}`,
            name: p.name,
            category: p.category || 'Food',
            weight: p.weight || '300g',
            price: parseFloat(p.price) || 0,
            cost: parseFloat(p.cost) || 0,
            rating: parseFloat(p.rating) || 4.5,
            stock: parseInt(p.stock) || 0,
            minStock: parseInt(p.min_stock || p.minStock) || 5,
            bgColor: p.bg_color || p.bgColor || 'bg-pastel-pink',
            image: p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
            favorite: Boolean(p.favorite),
            status: p.status || (parseInt(p.stock) <= 0 ? 'Out of Stock' : 'In Stock')
        }));
    }

    save() {
        storage.set('products', this.products);
    }

    getAll() {
        return this.products;
    }

    getById(id) {
        return this.products.find(p => p.id === id);
    }

    addProduct(data) {
        const tempId = generateId('PRD'); // temporary local ID
        const newProduct = {
            id: tempId,
            sku: data.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
            barcode: data.barcode || `48065${Math.floor(1000000 + Math.random() * 9000000)}`,
            name: data.name,
            category: data.category || 'Food',
            weight: data.weight || '300g',
            price: parseFloat(data.price) || 0,
            cost: parseFloat(data.cost) || 0,
            rating: parseFloat(data.rating) || 5.0,
            stock: parseInt(data.stock) || 0,
            minStock: parseInt(data.minStock) || 5,
            bgColor: data.bgColor || 'bg-pastel-pink',
            image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
            favorite: false,
            status: parseInt(data.stock) === 0 ? 'Out of Stock' : (parseInt(data.stock) <= parseInt(data.minStock) ? 'Low Stock' : 'In Stock')
        };
        this.products.unshift(newProduct);
        this.save();

        // Push to Supabase and replace temp ID with real Supabase integer ID
        supabaseClient.addProduct(newProduct).then(inserted => {
            if (inserted && inserted.id) {
                const idx = this.products.findIndex(p => p.id === tempId);
                if (idx !== -1) {
                    this.products[idx].id = String(inserted.id);
                    this.save();
                    if (window._renderPOSProducts) window._renderPOSProducts();
                }
            }
        }).catch(e => console.warn('[Supabase] addProduct async error:', e));

        return newProduct;
    }

    updateProduct(id, data) {
        const index = this.products.findIndex(p => p.id === id);
        if (index !== -1) {
            const current = this.products[index];
            const updatedStock = data.stock !== undefined ? parseInt(data.stock) : current.stock;
            const updatedMin = data.minStock !== undefined ? parseInt(data.minStock) : current.minStock;

            let status = 'In Stock';
            if (updatedStock <= 0) status = 'Out of Stock';
            else if (updatedStock <= updatedMin) status = 'Low Stock';

            this.products[index] = {
                ...current,
                ...data,
                stock: updatedStock,
                minStock: updatedMin,
                price: data.price !== undefined ? parseFloat(data.price) : current.price,
                cost: data.cost !== undefined ? parseFloat(data.cost) : current.cost,
                status
            };
            this.save();
            // Sync full product record — pass SKU as fallback for non-numeric IDs
            supabaseClient.updateProduct(id, this.products[index]);
            return this.products[index];
        }
        return null;
    }

    deductStock(id, qty) {
        const product = this.getById(id);
        if (product) {
            const newStock = Math.max(0, product.stock - qty);
            product.stock = newStock;
            product.status = newStock <= 0 ? 'Out of Stock' : (newStock <= product.minStock ? 'Low Stock' : 'In Stock');
            this.save();
            // Pass SKU as fallback so write succeeds even for non-numeric IDs
            supabaseClient.updateProductStock(id, newStock, product.sku);
        }
    }

    deleteProduct(id) {
        const product = this.getById(id);
        const sku = product ? product.sku : null;
        this.products = this.products.filter(p => p.id !== id);
        this.save();
        supabaseClient.deleteProduct(id, sku); // pass SKU as fallback
    }

    toggleFavorite(id) {
        const product = this.getById(id);
        if (product) {
            product.favorite = !product.favorite;
            this.save();
        }
        return product;
    }

    filter({ search = '', category = 'All', stockStatus = 'All', sortBy = 'recommended' }) {
        return this.products.filter(p => {
            const matchesSearch = search === '' || 
                p.name.toLowerCase().includes(search.toLowerCase()) || 
                p.sku.toLowerCase().includes(search.toLowerCase()) ||
                p.barcode.includes(search) ||
                p.category.toLowerCase().includes(search.toLowerCase());

            const matchesCategory = category === 'All' || p.category === category || (category === 'Favorites' && p.favorite);
            
            let matchesStock = true;
            if (stockStatus === 'In Stock') matchesStock = p.stock > p.minStock;
            else if (stockStatus === 'Low Stock') matchesStock = p.stock > 0 && p.stock <= p.minStock;
            else if (stockStatus === 'Out of Stock') matchesStock = p.stock === 0;

            return matchesSearch && matchesCategory && matchesStock;
        }).sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0; // Default Recommended
        });
    }
}

export const productsInstance = new ProductManager();
