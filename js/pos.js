/**
 * Main POS View Handler
 */

import { productsInstance } from './products.js';
import { cartInstance } from './cart.js';
import { formatCurrency, debounce } from './utils.js';
import { showToast } from './toast.js';

export function initPOSView() {
    let currentCategory = 'All';
    let currentSearch = '';
    let currentSort = 'recommended';

    const gridContainer = document.getElementById('pos-product-grid');
    const searchInput = document.getElementById('pos-search-input');
    const filterPillsContainer = document.getElementById('pos-filter-pills');
    const productCountEl = document.getElementById('pos-product-count');
    const sortSelect = document.getElementById('pos-sort-select');

    setupMobilePOSTabs();

    function renderProducts() {
        if (!gridContainer) return;

        const products = productsInstance.filter({
            search: currentSearch,
            category: currentCategory,
            sortBy: currentSort
        });

        if (productCountEl) {
            productCountEl.textContent = `${products.length} meals found`;
        }

        if (products.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-span-full py-16 text-center space-y-3">
                    <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <i data-lucide="search-x" class="w-8 h-8"></i>
                    </div>
                    <h4 class="text-base font-bold text-slate-700">No products found</h4>
                    <p class="text-xs text-slate-400">Try changing your search term or category filters</p>
                </div>
            `;
        } else {
            gridContainer.innerHTML = products.map(product => `
                <div draggable="true" class="
                    group relative rounded-[24px] ${product.bgColor || 'bg-pastel-pink'} p-4 
                    transition-all duration-300 ease-out 
                    hover:-translate-y-1 hover:shadow-xl cursor-grab active:cursor-grabbing 
                    flex flex-col justify-between overflow-hidden border border-white/60
                    animate-slide-up
                " data-product-id="${product.id}">
                    
                    <!-- Header Badges: Rating & Favorite -->
                    <div class="flex items-center justify-between w-full z-10">
                        <span class="inline-flex items-center gap-1 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs">
                            <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                            ${product.rating.toFixed(1)}
                        </span>
                        
                        <button class="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all duration-200 shadow-xs btn-favorite" data-id="${product.id}">
                            <i data-lucide="heart" class="w-4 h-4 ${product.favorite ? 'text-rose-500 fill-rose-500' : ''}"></i>
                        </button>
                    </div>

                    <!-- Centered Circular Food Image inspired by reference image -->
                    <div class="my-3 flex items-center justify-center relative py-2">
                        <div class="w-32 h-32 md:w-36 md:h-36 rounded-full bg-white/40 p-2 backdrop-blur-xs flex items-center justify-center shadow-inner">
                            <img src="${product.image}" alt="${product.name}" class="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-lg transition-transform duration-300 group-hover:scale-105 pointer-events-none">
                        </div>
                        ${product.stock <= 0 ? `
                            <span class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs rounded-[24px] flex items-center justify-center text-white font-extrabold text-xs tracking-wider uppercase">Out of Stock</span>
                        ` : ''}
                    </div>

                    <!-- Product Info Footer -->
                    <div class="space-y-1 z-10 pt-1">
                        <div class="flex items-baseline justify-between">
                            <h3 class="text-sm font-extrabold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">${product.name}</h3>
                            <span class="text-[11px] text-slate-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">${product.weight || '300g'}</span>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <span class="text-base font-extrabold text-slate-900">${formatCurrency(product.price)}</span>
                            <button class="w-8 h-8 rounded-full bg-slate-900 text-white group-hover:bg-emerald-500 flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-110 btn-add-cart" data-id="${product.id}">
                                <i data-lucide="plus" class="w-4.5 h-4.5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if (window.lucide) {
            window.lucide.createIcons({ nameAttr: 'data-lucide' });
        }

        bindProductGridEvents();
    }

    function bindProductGridEvents() {
        if (!gridContainer) return;

        // HTML5 Drag & Drop start listener
        gridContainer.querySelectorAll('[data-product-id]').forEach(card => {
            card.ondragstart = (e) => {
                const id = card.dataset.productId;
                e.dataTransfer.setData('text/plain', id);
                e.dataTransfer.effectAllowed = 'copy';
                card.classList.add('opacity-50', 'scale-95');
            };

            card.ondragend = () => {
                card.classList.remove('opacity-50', 'scale-95');
            };

            // Card Click -> Add to Cart
            card.onclick = (e) => {
                if (e.target.closest('.btn-favorite')) return; // Ignore if heart clicked
                const id = card.dataset.productId;
                const product = productsInstance.getById(id);
                if (product) {
                    cartInstance.addItem(product, 1);
                }
            };
        });

        // Favorite Button Toggle
        gridContainer.querySelectorAll('.btn-favorite').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const updated = productsInstance.toggleFavorite(id);
                showToast(updated.favorite ? `Saved ${updated.name} to favorites` : `Removed from favorites`, 'info');
                renderProducts();
            };
        });
    }

    // Bind Search Input
    if (searchInput) {
        searchInput.oninput = debounce((e) => {
            currentSearch = e.target.value.trim();
            renderProducts();
        }, 200);
    }

    // Bind Category Filter Pills
    if (filterPillsContainer) {
        const categoryButtons = filterPillsContainer.querySelectorAll('[data-category]');
        categoryButtons.forEach(btn => {
            btn.onclick = () => {
                categoryButtons.forEach(b => {
                    b.classList.remove('bg-emerald-500', 'text-white', 'shadow-md', 'shadow-emerald-500/20');
                    b.classList.add('bg-white/80', 'text-slate-600', 'hover:bg-white');
                });
                btn.classList.remove('bg-white/80', 'text-slate-600', 'hover:bg-white');
                btn.classList.add('bg-emerald-500', 'text-white', 'shadow-md', 'shadow-emerald-500/20');

                currentCategory = btn.dataset.category;
                renderProducts();
            };
        });
    }

    // Bind Sort Dropdown
    if (sortSelect) {
        sortSelect.onchange = (e) => {
            currentSort = e.target.value;
            renderProducts();
        };
    }

    // Initial render
    renderProducts();
}

function setupMobilePOSTabs() {
    const tabMenu = document.getElementById('pos-tab-menu');
    const tabOrder = document.getElementById('pos-tab-order');
    const prodSection = document.getElementById('pos-product-section');
    const orderPanel = document.getElementById('order-panel');
    const btnOpenFloatingCart = document.getElementById('btn-open-mobile-cart');

    if (!tabMenu || !tabOrder) return;

    function switchToMenu() {
        tabMenu.className = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';
        tabOrder.className = 'flex-1 py-2.5 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';

        if (prodSection) prodSection.classList.remove('max-lg:hidden');
        if (orderPanel) {
            orderPanel.classList.add('max-lg:hidden');
            orderPanel.classList.remove('max-lg:block');
        }
    }

    function switchToOrder() {
        tabOrder.className = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';
        tabMenu.className = 'flex-1 py-2.5 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';

        if (prodSection) prodSection.classList.add('max-lg:hidden');
        if (orderPanel) {
            orderPanel.classList.remove('max-lg:hidden');
            orderPanel.classList.add('max-lg:block');
        }
    }

    tabMenu.onclick = switchToMenu;
    tabOrder.onclick = switchToOrder;
    if (btnOpenFloatingCart) btnOpenFloatingCart.onclick = switchToOrder;
}
