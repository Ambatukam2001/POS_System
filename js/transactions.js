/**
 * Transaction History & Ledger Management
 */

import { storage, generateId, formatDate, formatTime } from './utils.js';

const INITIAL_TRANSACTIONS = [
    {
        id: 'TXN-883901',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        cashier: 'Dimacaling',
        customer: 'Maria Clara',
        items: [
            { name: 'Noodle salad', qty: 2, price: 315.00 },
            { name: 'Fresh Iced Matcha', qty: 1, price: 185.00 }
        ],
        subtotal: 815.00,
        discount: 0,
        tax: 0,
        total: 815.00,
        paymentMethod: 'GCash',
        amountReceived: 815.00,
        change: 0,
        status: 'Completed'
    },
    {
        id: 'TXN-883902',
        date: new Date(Date.now() - 3600000 * 5).toISOString(),
        cashier: 'Maria Santos',
        customer: 'Juan Dela Cruz',
        items: [
            { name: 'Seafood soup', qty: 1, price: 385.00 },
            { name: 'Cabage salad', qty: 1, price: 249.00 }
        ],
        subtotal: 634.00,
        discount: 34.00,
        tax: 0,
        total: 600.00,
        paymentMethod: 'Cash',
        amountReceived: 1000.00,
        change: 400.00,
        status: 'Completed'
    },
    {
        id: 'TXN-883903',
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        cashier: 'Maria Santos',
        customer: 'Walk-in Customer',
        items: [
            { name: 'Roast potatoes', qty: 2, price: 249.00 },
            { name: 'Chicken soup', qty: 2, price: 199.00 }
        ],
        subtotal: 896.00,
        discount: 0,
        tax: 0,
        total: 896.00,
        paymentMethod: 'Card',
        amountReceived: 896.00,
        change: 0,
        status: 'Completed'
    }
];

export class TransactionManager {
    constructor() {
        this.transactions = storage.get('transactions', INITIAL_TRANSACTIONS);
    }

    save() {
        storage.set('transactions', this.transactions);
    }

    getAll() {
        return this.transactions;
    }

    getById(id) {
        return this.transactions.find(t => t.id === id);
    }

    createTransaction({ cashier, customer, cartItems, subtotal, discount, tax, total, paymentMethod, amountReceived, change }) {
        const transaction = {
            id: generateId('TXN'),
            date: new Date().toISOString(),
            cashier: cashier || 'Dimacaling',
            customer: (typeof customer === 'object' && customer && customer.name) 
                ? customer.name 
                : (typeof customer === 'string' && customer ? customer : 'Walk-in Customer'),
            items: cartItems.map(item => ({
                id: item.product.id,
                name: item.product.name,
                qty: item.quantity,
                price: item.product.price
            })),
            subtotal,
            discount,
            tax,
            total,
            paymentMethod,
            amountReceived: parseFloat(amountReceived) || total,
            change: parseFloat(change) || 0,
            status: 'Completed'
        };

        this.transactions.unshift(transaction);
        this.save();
        return transaction;
    }

    getTodaySales() {
        const today = new Date().toDateString();
        return this.transactions
            .filter(t => t.status === 'Completed' && new Date(t.date).toDateString() === today)
            .reduce((sum, t) => sum + t.total, 0);
    }

    getTodayCount() {
        const today = new Date().toDateString();
        return this.transactions.filter(t => new Date(t.date).toDateString() === today).length;
    }

    filter({ search = '', dateFilter = 'All', paymentFilter = 'All', cashierFilter = 'All' }) {
        return this.transactions.filter(t => {
            const matchesSearch = search === '' ||
                t.id.toLowerCase().includes(search.toLowerCase()) ||
                t.customer.toLowerCase().includes(search.toLowerCase()) ||
                t.cashier.toLowerCase().includes(search.toLowerCase());

            const matchesPayment = paymentFilter === 'All' || t.paymentMethod === paymentFilter;
            const matchesCashier = cashierFilter === 'All' || t.cashier === cashierFilter;

            let matchesDate = true;
            if (dateFilter === 'Today') {
                matchesDate = new Date(t.date).toDateString() === new Date().toDateString();
            }

            return matchesSearch && matchesPayment && matchesCashier && matchesDate;
        });
    }
}

export const transactionsInstance = new TransactionManager();
