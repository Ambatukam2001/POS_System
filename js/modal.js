/**
 * Modal System (Checkout, Thermal Receipt Printer Animation, Product Form, Confirmation, etc.)
 */

import { formatCurrency, formatDateTime } from './utils.js';
import { cartInstance } from './cart.js';
import { transactionsInstance } from './transactions.js';
import { productsInstance } from './products.js';
import { inventoryInstance } from './inventory.js';
import { authInstance } from './auth.js';
import { customersInstance } from './customers.js';
import { showToast } from './toast.js';
import { supabaseClient } from './supabase.js';

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden', 'pointer-events-none');
    modal.classList.add('flex');
    requestAnimationFrame(() => {
        const backdrop = modal.querySelector('.modal-backdrop');
        const content = modal.querySelector('.modal-content');
        if (backdrop) backdrop.classList.add('opacity-100');
        if (content) {
            content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
            if (modalId === 'product-modal' || content.classList.contains('translate-x-full')) {
                content.classList.remove('translate-x-full');
                content.classList.add('translate-x-0');
            }
        }
    });
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const backdrop = modal.querySelector('.modal-backdrop');
    const content = modal.querySelector('.modal-content');

    if (backdrop) backdrop.classList.remove('opacity-100');
    if (content) {
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
        if (modalId === 'product-modal' || content.classList.contains('translate-x-0')) {
            content.classList.remove('translate-x-0');
            content.classList.add('translate-x-full');
        }
    }

    setTimeout(() => {
        modal.classList.add('hidden', 'pointer-events-none');
        modal.classList.remove('flex');
    }, 250);
}

export function initCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (!modal) return;

    let selectedPayment = 'Cash';

    // Bind Cart Checkout Button (Proceed to Checkout / Pay Now)
    const checkoutTriggerBtn = document.getElementById('cart-checkout-btn');
    if (checkoutTriggerBtn) {
        checkoutTriggerBtn.onclick = () => {
            const items = cartInstance.getItems();
            if (!items || items.length === 0) {
                showToast('Cart is currently empty. Add items to order.', 'warning');
                return;
            }

            const total = cartInstance.getTotal();
            const modalTotalEl = document.getElementById('checkout-modal-total');
            if (modalTotalEl) modalTotalEl.textContent = formatCurrency(total);

            const customerNameInput = document.getElementById('checkout-customer-name-input');
            const customerPhoneInput = document.getElementById('checkout-customer-phone-input');
            const customerEmailInput = document.getElementById('checkout-customer-email-input');

            // selectedCustomer can be an object {id, name, ...} or a plain string — handle both
            const selCust = cartInstance.selectedCustomer;
            const activeName = (selCust && typeof selCust === 'object' && selCust.name)
                ? selCust.name
                : (typeof selCust === 'string' && selCust ? selCust : 'Walk-in Guest');
            if (customerNameInput) customerNameInput.value = activeName;

            // Lookup existing customer info if present
            const existingCust = customersInstance.getAll().find(c => c.name.toLowerCase() === activeName.toLowerCase());
            if (customerPhoneInput) customerPhoneInput.value = existingCust ? existingCust.phone : '';
            if (customerEmailInput) customerEmailInput.value = existingCust ? existingCust.email : '';

            const amountInput = document.getElementById('amount-received-input');
            if (amountInput) amountInput.value = total.toFixed(2);

            const onlineRefInput = document.getElementById('online-ref-input');
            if (onlineRefInput && !onlineRefInput.value) {
                onlineRefInput.value = `GCASH-${Math.floor(100000 + Math.random() * 900000)}`;
            }

            // Update QR code total badge
            const qrTotalEl = document.getElementById('online-qr-amount');
            if (qrTotalEl) qrTotalEl.textContent = total.toFixed(2);

            updateChangeCalculation();
            openModal('checkout-modal');
        };
    }

    // Payment method buttons setup
    const paymentButtons = modal.querySelectorAll('.payment-method-btn');
    const cashDetailsGroup = document.getElementById('cash-details-group');
    const onlineDetailsGroup = document.getElementById('online-details-group');

    // QR Tab Switcher Elements
    const qrTabGcash = document.getElementById('qr-tab-gcash');
    const qrTabMaya = document.getElementById('qr-tab-maya');
    const qrContainerGcash = document.getElementById('qr-container-gcash');
    const qrContainerMaya = document.getElementById('qr-container-maya');

    const activateQrTab = (tab) => {
        if (tab === 'GCash') {
            if (qrTabGcash) qrTabGcash.className = 'qr-tab-btn flex-1 py-1.5 px-3 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-xs transition-all flex items-center justify-center gap-1.5';
            if (qrTabMaya) qrTabMaya.className = 'qr-tab-btn flex-1 py-1.5 px-3 rounded-full text-xs font-extrabold bg-white text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5';
            if (qrContainerGcash) qrContainerGcash.classList.remove('hidden');
            if (qrContainerMaya) qrContainerMaya.classList.add('hidden');
        } else {
            if (qrTabMaya) qrTabMaya.className = 'qr-tab-btn flex-1 py-1.5 px-3 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-xs transition-all flex items-center justify-center gap-1.5';
            if (qrTabGcash) qrTabGcash.className = 'qr-tab-btn flex-1 py-1.5 px-3 rounded-full text-xs font-extrabold bg-white text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5';
            if (qrContainerMaya) qrContainerMaya.classList.remove('hidden');
            if (qrContainerGcash) qrContainerGcash.classList.add('hidden');
        }
        if (window.lucide) window.lucide.createIcons();
    };

    if (qrTabGcash) qrTabGcash.onclick = () => activateQrTab('GCash');
    if (qrTabMaya) qrTabMaya.onclick = () => activateQrTab('Maya');

    const cardDetailsGroup = document.getElementById('card-details-group');
    const cardNumberInput = document.getElementById('card-number-input');
    const cardExpInput = document.getElementById('card-exp-input');
    const cardCvvInput = document.getElementById('card-cvv-input');

    if (cardNumberInput) {
        cardNumberInput.oninput = (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 16);
            let formatted = v.match(/.{1,4}/g)?.join(' ') || v;
            e.target.value = formatted;
        };
    }

    if (cardExpInput) {
        cardExpInput.oninput = (e) => {
            let v = e.target.value.replace(/\D/g, '').substring(0, 4);
            if (v.length >= 3) {
                e.target.value = v.substring(0, 2) + '/' + v.substring(2);
            } else {
                e.target.value = v;
            }
        };
    }

    if (cardCvvInput) {
        cardCvvInput.oninput = (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        };
    }

    paymentButtons.forEach(btn => {
        btn.onclick = () => {
            paymentButtons.forEach(b => {
                b.classList.remove('border-emerald-500', 'bg-emerald-50', 'text-emerald-800', 'ring-2', 'ring-emerald-500/20');
                b.classList.add('border-slate-200', 'hover:border-slate-300', 'bg-white', 'text-slate-700');
            });
            btn.classList.remove('border-slate-200', 'hover:border-slate-300', 'bg-white', 'text-slate-700');
            btn.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-800', 'ring-2', 'ring-emerald-500/20');
            
            selectedPayment = btn.dataset.method;

            if (selectedPayment === 'Cash') {
                if (cashDetailsGroup) cashDetailsGroup.classList.remove('hidden');
                if (onlineDetailsGroup) onlineDetailsGroup.classList.add('hidden');
                if (cardDetailsGroup) cardDetailsGroup.classList.add('hidden');
            } else if (selectedPayment === 'Card') {
                if (cashDetailsGroup) cashDetailsGroup.classList.add('hidden');
                if (onlineDetailsGroup) onlineDetailsGroup.classList.add('hidden');
                if (cardDetailsGroup) cardDetailsGroup.classList.remove('hidden');
            } else {
                if (cashDetailsGroup) cashDetailsGroup.classList.add('hidden');
                if (onlineDetailsGroup) onlineDetailsGroup.classList.remove('hidden');
                if (cardDetailsGroup) cardDetailsGroup.classList.add('hidden');

                if (selectedPayment === 'GCash') {
                    activateQrTab('GCash');
                } else if (selectedPayment === 'Maya') {
                    activateQrTab('Maya');
                }
            }

            updateChangeCalculation();
        };
    });

    // Auto Ref Generator Button
    const btnGenerateRef = document.getElementById('btn-generate-ref');
    const onlineRefInput = document.getElementById('online-ref-input');
    if (btnGenerateRef && onlineRefInput) {
        btnGenerateRef.onclick = () => {
            const prefix = selectedPayment === 'GCash' ? 'GCASH' : (selectedPayment === 'Maya' ? 'MAYA' : (selectedPayment === 'Card' ? 'CARD' : 'QR'));
            onlineRefInput.value = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
            showToast('Generated transaction reference code.', 'info');
        };
    }

    // Quick cash suggestion buttons (+100, +500, +1000, Exact)
    const amountInput = document.getElementById('amount-received-input');
    const quickCashBtns = modal.querySelectorAll('.quick-cash-btn');
    quickCashBtns.forEach(btn => {
        btn.onclick = () => {
            const currentTotal = cartInstance.getTotal();
            const value = btn.dataset.value;
            if (value === 'exact') {
                amountInput.value = currentTotal.toFixed(2);
            } else {
                const add = parseFloat(value);
                const current = parseFloat(amountInput.value) || 0;
                amountInput.value = (current + add).toFixed(2);
            }
            updateChangeCalculation();
        };
    });

    if (amountInput) {
        amountInput.oninput = updateChangeCalculation;
    }

    function updateChangeCalculation() {
        const total = cartInstance.getTotal();
        const received = parseFloat(amountInput.value) || 0;
        const change = received - total;
        const changeDisplay = document.getElementById('checkout-change-display');
        const alertEl = document.getElementById('insufficient-payment-alert');
        const confirmBtn = document.getElementById('confirm-checkout-btn');

        if (selectedPayment === 'Cash') {
            if (received < total) {
                if (alertEl) alertEl.classList.remove('hidden');
                if (changeDisplay) {
                    changeDisplay.textContent = '₱0.00';
                    changeDisplay.className = 'text-lg font-bold text-rose-600';
                }
                if (confirmBtn) confirmBtn.disabled = true;
            } else {
                if (alertEl) alertEl.classList.add('hidden');
                if (changeDisplay) {
                    changeDisplay.textContent = formatCurrency(change);
                    changeDisplay.className = 'text-lg font-bold text-emerald-600';
                }
                if (confirmBtn) confirmBtn.disabled = false;
            }
        } else {
            if (alertEl) alertEl.classList.add('hidden');
            if (changeDisplay) changeDisplay.textContent = '₱0.00';
            if (confirmBtn) confirmBtn.disabled = false;
        }
    }

    // Confirm Checkout Handler
    const confirmBtn = document.getElementById('confirm-checkout-btn');
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            const total = cartInstance.getTotal();
            if (total <= 0) {
                showToast('Cart is empty.', 'error');
                return;
            }

            if (selectedPayment === 'Card') {
                const cardName = document.getElementById('card-name-input')?.value.trim();
                const cardNumber = document.getElementById('card-number-input')?.value.trim();
                const cardExp = document.getElementById('card-exp-input')?.value.trim();
                const cardCvv = document.getElementById('card-cvv-input')?.value.trim();

                if (!cardName || !cardNumber || cardNumber.length < 14 || !cardExp || cardExp.length < 5 || !cardCvv || cardCvv.length < 3) {
                    showToast('Please complete all required card fields (Cardholder Name, Number, MM/YY, CVV).', 'error');
                    return;
                }
            }

            const amountReceived = selectedPayment === 'Cash' 
                ? (parseFloat(amountInput.value) || total)
                : total;
            
            if (selectedPayment === 'Cash' && amountReceived < total) {
                showToast('Insufficient cash in amount.', 'error');
                return;
            }

            const change = selectedPayment === 'Cash' ? Math.max(0, amountReceived - total) : 0;
            const currentUser = authInstance.getCurrentUser() || { name: 'Dimacaling' };
            
            // Read edited customer details from checkout inputs
            const nameInput = document.getElementById('checkout-customer-name-input');
            const phoneInput = document.getElementById('checkout-customer-phone-input');
            const emailInput = document.getElementById('checkout-customer-email-input');

            // selectedCustomer can be an object {id, name, ...} or a plain string — handle both
            const rawCust = cartInstance.selectedCustomer;
            const customerName = (nameInput && nameInput.value.trim())
                ? nameInput.value.trim()
                : (rawCust && typeof rawCust === 'object' && rawCust.name)
                    ? rawCust.name
                    : (typeof rawCust === 'string' && rawCust ? rawCust : 'Walk-in Guest');
            const customerPhone = phoneInput ? phoneInput.value.trim() : '';
            const customerEmail = emailInput ? emailInput.value.trim() : '';
            
            // Update cart selected customer reference
            cartInstance.selectedCustomer = customerName;

            // Save/update customer details in Customer Directory database & sync to Supabase
            let customerRecord = null;
            if (customerName && customerName !== 'Walk-in Guest' && customerName !== 'Walk-in Customer') {
                customerRecord = customersInstance.addOrUpdateCustomer({
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    purchaseAmount: total
                });
            }

            const refCode = onlineRefInput ? onlineRefInput.value : '';
            const displayPaymentMethod = selectedPayment === 'Cash' 
                ? 'Cash In' 
                : `${selectedPayment}${refCode ? ' (' + refCode + ')' : ''}`;

            // 1. Create Transaction record
            const transaction = transactionsInstance.createTransaction({
                cashier: currentUser.name,
                customer: customerName,
                cartItems: cartInstance.getItems(),
                subtotal: cartInstance.getSubtotal(),
                discount: cartInstance.getDiscountAmount(),
                tax: cartInstance.getTaxAmount(),
                total: total,
                paymentMethod: displayPaymentMethod,
                amountReceived,
                change
            });

            // 2. Deduct Inventory Stock & Sync to Supabase
            const items = cartInstance.getItems();
            items.forEach(item => {
                productsInstance.deductStock(item.product.id, item.quantity);
                const updatedProduct = productsInstance.getById(item.product.id);
                if (updatedProduct) {
                    supabaseClient.updateProductStock(item.product.id, updatedProduct.stock, updatedProduct.sku);
                }
            });

            // 3. Sync Order to Supabase Cloud Database asynchronously
            const customerId = customerRecord && !isNaN(Number(customerRecord.id)) ? Number(customerRecord.id) : null;
            const cashierId = currentUser && !isNaN(Number(currentUser.id)) ? Number(currentUser.id) : null;

            supabaseClient.createOrder({
                order_number: transaction.id || `ORD-${Date.now()}`,
                cashier_id: cashierId,
                customer_id: customerId,
                subtotal: transaction.subtotal,
                discount: transaction.discount,
                tax: transaction.tax,
                total: transaction.total,
                payment_method: displayPaymentMethod,
                payment_status: 'Paid'
            }, items);

            // 4. Clear Cart
            cartInstance.clearCart();

            // 4. Close Checkout Modal & Show Digital Thermal Receipt
            closeModal('checkout-modal');
            showReceiptModal(transaction);

            showToast(`Transaction completed successfully!`, 'success');
        };
    }
}

export function showReceiptModal(transaction) {
    const modal = document.getElementById('receipt-modal');
    if (!modal) return;

    const receiptBody = document.getElementById('printable-receipt');
    const printerSlot = document.getElementById('printer-device-slot');
    const statusBadge = document.getElementById('printer-status-badge');
    const actionsEl = document.getElementById('receipt-actions');

    if (receiptBody) {
        const dateStr = transaction.date ? formatDateTime(transaction.date) : formatDateTime(new Date());
        const subtotalVal = transaction.subtotal || transaction.total || 0;
        const discountVal = transaction.discount || 0;
        const taxVal = transaction.tax || (subtotalVal * 0.12);
        const totalVal = transaction.total || (subtotalVal - discountVal + taxVal);
        const paidVal = transaction.amountReceived || totalVal;
        const changeVal = transaction.change || 0;
        const itemsList = transaction.items || [];

        // Force animation re-trigger by resetting HTML structure
        receiptBody.innerHTML = `
            <div id="receipt-sheet" class="bg-white p-5 rounded-b-2xl border-x border-b border-slate-200/90 font-sans shadow-xl relative animate-receipt-emerge receipt-scallop-edge text-slate-800 space-y-4">
                
                <!-- Receipt Header (Matching reference image with Payment Successful green checkmark) -->
                <div class="flex items-center justify-between border-b border-dashed border-slate-200 pb-3">
                    <div>
                        <h3 class="text-sm font-black text-slate-900 tracking-tight">Payment Successful</h3>
                        <p class="text-[11px] font-semibold text-slate-400 mt-0.5">${dateStr}</p>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                        <i data-lucide="check" class="w-5 h-5 stroke-[3]"></i>
                    </div>
                </div>

                <!-- Transaction Meta Info -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    <div>
                        <span class="text-slate-400 block text-[10px] uppercase font-bold">Receipt No.</span>
                        <span class="font-bold text-slate-900 font-mono">#${transaction.id || 'TXN-9982'}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block text-[10px] uppercase font-bold">Cashier</span>
                        <span class="font-bold text-slate-800">${transaction.cashier || 'Dimacaling'}</span>
                    </div>
                </div>

                <!-- Line Items Table -->
                <div class="space-y-2">
                    <div class="text-[10px] font-black tracking-wider uppercase text-slate-400 border-b border-slate-200 pb-1 flex justify-between">
                        <span>ITEM & QTY</span>
                        <span>AMOUNT</span>
                    </div>
                    <div class="divide-y divide-slate-100 text-[11px]">
                        ${itemsList.length > 0 ? itemsList.map(item => `
                            <div class="py-1.5 flex justify-between items-center">
                                <div class="pr-2">
                                    <span class="font-bold text-slate-800">${item.qty}x</span>
                                    <span class="font-semibold text-slate-700 ml-1">${item.name}</span>
                                </div>
                                <span class="font-bold text-slate-900 font-mono">${formatCurrency(item.price * item.qty)}</span>
                            </div>
                        `).join('') : `
                            <div class="py-1.5 flex justify-between items-center">
                                <div><span class="font-bold text-slate-800">1x</span> <span class="font-semibold text-slate-700">POS Order</span></div>
                                <span class="font-bold text-slate-900 font-mono">${formatCurrency(totalVal)}</span>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Totals Breakdown -->
                <div class="border-t border-dashed border-slate-300 pt-3 space-y-1 text-[11px]">
                    <div class="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span class="font-bold text-slate-800 font-mono">${formatCurrency(subtotalVal)}</span>
                    </div>
                    ${discountVal > 0 ? `
                        <div class="flex justify-between text-emerald-600 font-semibold">
                            <span>Discount</span>
                            <span class="font-mono">-${formatCurrency(discountVal)}</span>
                        </div>
                    ` : ''}
                    <div class="flex justify-between text-slate-500">
                        <span>VAT (12%)</span>
                        <span class="font-bold text-slate-800 font-mono">${formatCurrency(taxVal)}</span>
                    </div>
                    <div class="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>TOTAL</span>
                        <span class="text-emerald-600 font-black text-base font-mono">${formatCurrency(totalVal)}</span>
                    </div>
                </div>

                <!-- Payment Details -->
                <div class="bg-slate-100/80 rounded-xl p-2.5 text-[11px] space-y-1 font-medium text-slate-600">
                    <div class="flex justify-between">
                        <span>Payment Method</span>
                        <span class="font-extrabold text-slate-800 uppercase">${transaction.paymentMethod || 'Cash'}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Amount Paid</span>
                        <span class="font-bold text-slate-800 font-mono">${formatCurrency(paidVal)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Change</span>
                        <span class="font-bold text-slate-800 font-mono">${formatCurrency(changeVal)}</span>
                    </div>
                </div>

                <!-- Footer Smiley Message -->
                <div class="text-center text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-center gap-1">
                    <span>😄</span> <span>THANKS FOR SHOPPING!</span>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // Reset thermal printer vibration & status state
    if (printerSlot) {
        printerSlot.classList.add('animate-printer-vibrate');
    }
    if (statusBadge) {
        statusBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30';
        statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>PRINTING...</span>`;
    }
    if (actionsEl) {
        actionsEl.classList.add('opacity-0', 'translate-y-2');
        actionsEl.classList.remove('opacity-100', 'translate-y-0');
    }

    openModal('receipt-modal');

    // After 850ms (emerging animation completion):
    setTimeout(() => {
        if (printerSlot) {
            printerSlot.classList.remove('animate-printer-vibrate');
        }
        if (statusBadge) {
            statusBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            statusBadge.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3 text-emerald-400"></i><span>PRINT COMPLETE</span>`;
            if (window.lucide) window.lucide.createIcons();
        }
        if (actionsEl) {
            actionsEl.classList.remove('opacity-0', 'translate-y-2');
            actionsEl.classList.add('opacity-100', 'translate-y-0');
        }
    }, 850);
}
