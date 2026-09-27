/**
 * Product Data Layer & Catalog Management
 */

import { storage, generateId } from './utils.js';

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
        const newProduct = {
            id: generateId('PRD'),
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
            return this.products[index];
        }
        return null;
    }

    deductStock(id, qty) {
        const product = this.getById(id);
        if (product) {
            const newStock = Math.max(0, product.stock - qty);
            this.updateProduct(id, { stock: newStock });
        }
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.save();
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
