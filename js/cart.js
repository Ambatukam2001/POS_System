/**
 * Cart & Order Panel State Management
 */

import { storage, formatCurrency } from './utils.js';
import { showToast } from './toast.js';

const DEFAULT_CUSTOMER = {
    id: 'CUST-000',
    name: 'Walk-in Customer',
    phone: 'N/A',
    email: 'walkin@pos.system'
};

export class CartManager {
    constructor() {
        this.cart = storage.get('current_cart', []);
        this.selectedCustomer = storage.get('selected_customer', DEFAULT_CUSTOMER);
        this.discount = { type: 'none', value: 0 }; // 'percentage' | 'fixed' | 'none'
        this.taxRate = 0; // 0% default or 0.12 (12% VAT)
        this.orderNotes = '';
    }

    save() {
        storage.set('current_cart', this.cart);
        storage.set('selected_customer', this.selectedCustomer);
    }

    getItems() {
        return this.cart;
    }

    getItemCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    addItem(product, qty = 1) {
        if (product.stock <= 0) {
            showToast(`${product.name} is currently out of stock!`, 'error');
            return false;
        }

        const existingIndex = this.cart.findIndex(item => item.product.id === product.id);

        if (existingIndex !== -1) {
            const currentQty = this.cart[existingIndex].quantity;
            if (currentQty + qty > product.stock) {
                showToast(`Cannot add more than available stock (${product.stock} available).`, 'warning');
                return false;
            }
            this.cart[existingIndex].quantity += qty;
        } else {
            if (qty > product.stock) {
                showToast(`Only ${product.stock} items available in stock.`, 'warning');
                return false;
            }
            this.cart.push({
                product,
                quantity: qty,
                price: product.price
            });
        }

        this.save();
        showToast(`✓ ${product.name} added to cart`, 'success');
        this._animateAdd = true;
        this.renderCartUI();
        return true;
    }

    updateQuantity(productId, newQty) {
        const index = this.cart.findIndex(item => item.product.id === productId);
        if (index !== -1) {
            if (newQty <= 0) {
                this.removeItem(productId);
                return;
            }

            const item = this.cart[index];
            if (newQty > item.product.stock) {
                showToast(`Only ${item.product.stock} items available.`, 'warning');
                return;
            }
            item.quantity = newQty;
            this.save();
            this.renderCartUI();
        }
    }

    removeItem(productId) {
        const item = this.cart.find(i => i.product.id === productId);
        this.cart = this.cart.filter(i => i.product.id !== productId);
        this.save();
        if (item) {
            showToast(`Removed ${item.product.name} from order`, 'info');
        }
        this.renderCartUI();
    }

    clearCart() {
        this.cart = [];
        this.discount = { type: 'none', value: 0 };
        this.orderNotes = '';
        this.save();
        this.renderCartUI();
    }

    setCustomer(customer) {
        this.selectedCustomer = customer || DEFAULT_CUSTOMER;
        this.save();
        this.renderCartUI();
    }

    setDiscount(type, value) {
        this.discount = { type, value: parseFloat(value) || 0 };
        this.renderCartUI();
    }

    getSubtotal() {
        return this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }

    getDiscountAmount() {
        const subtotal = this.getSubtotal();
        if (this.discount.type === 'percentage') {
            return subtotal * (this.discount.value / 100);
        } else if (this.discount.type === 'fixed') {
            return Math.min(subtotal, this.discount.value);
        }
        return 0;
    }

    getTaxAmount() {
        const taxable = this.getSubtotal() - this.getDiscountAmount();
        return taxable * this.taxRate;
    }

    getTotal() {
        const total = this.getSubtotal() - this.getDiscountAmount() + this.getTaxAmount();
        return Math.max(0, total);
    }

    renderCartUI() {
        const cartListContainer = document.getElementById('order-cart-items');
        const itemCountBadge = document.getElementById('cart-badge-count');
        const subtotalEl = document.getElementById('cart-subtotal');
        const discountEl = document.getElementById('cart-discount');
        const taxEl = document.getElementById('cart-tax');
        const totalEl = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('cart-checkout-btn');
        const customerNameEl = document.getElementById('cart-customer-name');

        if (!cartListContainer) return;

        // Render Cart Items
        if (this.cart.length === 0) {
            cartListContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-slate-400 space-y-3">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                        <i data-lucide="shopping-bag" class="w-8 h-8 text-slate-300"></i>
                    </div>
                    <p class="text-sm font-semibold text-slate-500">Your order is empty</p>
                    <p class="text-xs text-slate-400 text-center max-w-[200px]">Click any product from the menu to add it to your order</p>
                </div>
            `;
        } else {
            cartListContainer.innerHTML = [...this.cart].reverse().map(item => `
                <div class="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-all duration-200 group border border-transparent hover:border-slate-100 animate-slide-right" data-cart-item-id="${item.product.id}">
                    <div class="flex items-center gap-3 min-w-0">
                        <img src="${item.product.image}" alt="${item.product.name}" class="w-11 h-11 rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0">
                        <div class="min-w-0">
                            <h4 class="text-xs font-bold text-slate-800 truncate leading-tight">${item.product.name}</h4>
                            <p class="text-[11px] text-slate-400 font-medium">${item.product.weight || '1 pc'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        <div class="flex items-center bg-slate-100/80 rounded-full p-1 border border-slate-200/50">
                            <button class="w-5 h-5 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition-all text-xs font-bold btn-decrement" data-id="${item.product.id}">-</button>
                            <span class="w-6 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
                            <button class="w-5 h-5 rounded-full flex items-center justify-center text-slate-600 hover:bg-white hover:shadow-xs transition-all text-xs font-bold btn-increment" data-id="${item.product.id}">+</button>
                        </div>
                        <span class="text-xs font-bold text-slate-900 w-16 text-right">${formatCurrency(item.product.price * item.quantity)}</span>
                        <button class="text-slate-300 hover:text-rose-500 transition-colors p-1 btn-remove" data-id="${item.product.id}">
                            <i data-lucide="x" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            // Animate newest (first rendered) item when a product was just added
            if (this._animateAdd) {
                this._animateAdd = false;
                requestAnimationFrame(() => {
                    const firstItem = cartListContainer.querySelector('[data-cart-item-id]');
                    if (firstItem) {
                        firstItem.classList.remove('cart-item-pop');
                        void firstItem.offsetWidth; // force reflow so animation restarts
                        firstItem.classList.add('cart-item-pop');
                        firstItem.addEventListener('animationend', () => {
                            firstItem.classList.remove('cart-item-pop');
                        }, { once: true });
                    }
                });
            }
        }

        // Update Totals
        const subtotal = this.getSubtotal();
        const discount = this.getDiscountAmount();
        const tax = this.getTaxAmount();
        const total = this.getTotal();
        const itemCount = this.getItemCount();

        if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
        if (discountEl) discountEl.textContent = discount > 0 ? `-${formatCurrency(discount)}` : '₱0.00';
        if (taxEl) taxEl.textContent = formatCurrency(tax);
        if (totalEl) totalEl.textContent = formatCurrency(total);

        if (itemCountBadge) {
            itemCountBadge.textContent = itemCount;
            itemCountBadge.className = itemCount > 0 
                ? 'bg-emerald-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pop'
                : 'hidden';
        }

        // Mobile Cart Badge Updates
        const mobileBadge = document.getElementById('pos-mobile-cart-badge');
        if (mobileBadge) mobileBadge.textContent = itemCount;

        if (customerNameEl) {
            customerNameEl.textContent = this.selectedCustomer.name;
        }

        if (checkoutBtn) {
            if (this.cart.length === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed', 'shadow-none');
                checkoutBtn.classList.remove('shadow-green', 'hover:bg-emerald-600', 'hover:-translate-y-0.5');
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'shadow-none');
                checkoutBtn.classList.add('shadow-green', 'hover:bg-emerald-600', 'hover:-translate-y-0.5');
            }
        }

        // Re-bind click event handlers for cart item buttons
        this.bindCartEvents();

        // Refresh icons
        if (window.lucide) {
            window.lucide.createIcons({ nameAttr: 'data-lucide' });
        }
    }

    bindCartEvents() {
        const container = document.getElementById('order-cart-items');
        if (!container) return;

        container.querySelectorAll('.btn-increment').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.currentTarget.dataset.id;
                const item = this.cart.find(i => i.product.id === id);
                if (item) this.updateQuantity(id, item.quantity + 1);
            };
        });

        container.querySelectorAll('.btn-decrement').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.currentTarget.dataset.id;
                const item = this.cart.find(i => i.product.id === id);
                if (item) this.updateQuantity(id, item.quantity - 1);
            };
        });

        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.onclick = (e) => {
                const id = e.currentTarget.dataset.id;
                this.removeItem(id);
            };
        });
    }
}

export const cartInstance = new CartManager();
