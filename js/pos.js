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
    let selectedProductId = null;

    const gridContainer = document.getElementById('pos-product-grid');
    const searchInput = document.getElementById('pos-search-input');
    const filterPillsContainer = document.getElementById('pos-filter-pills');
    const productCountEl = document.getElementById('pos-product-count');
    const sortSelect = document.getElementById('pos-sort-select');

    setupMobilePOSTabs();
    setupScrollToTopButton();

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
            gridContainer.innerHTML = products.map(product => {
                const isSelected = product.id === selectedProductId;
                const itemInCart = cartInstance.getItems().find(i => i.product.id === product.id);
                const qtyInCart = itemInCart ? itemInCart.quantity : 0;

                return `
                <div draggable="true" class="
                    group relative rounded-[24px] ${product.bgColor || 'bg-pastel-pink'} p-4 
                    pos-product-card cursor-pointer
                    ${isSelected ? 'ring-2 ring-emerald-500 shadow-xl border-emerald-400 scale-[1.01]' : 'hover:-translate-y-1.5 hover:shadow-xl border-white/60'}
                    active:scale-[0.96] active:shadow-sm
                    flex flex-col justify-between overflow-hidden border
                    animate-slide-up transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
                " data-product-id="${product.id}">
                    
                    <!-- Header Badges: Rating, Selected Badge & Favorite -->
                    <div class="flex items-center justify-between w-full z-10">
                        <div class="flex items-center gap-1.5">
                            <span class="inline-flex items-center gap-1 bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs">
                                <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i>
                                ${product.rating.toFixed(1)}
                            </span>
                            ${isSelected ? `
                                <span class="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                    <i data-lucide="check-circle" class="w-3 h-3 text-white"></i>
                                    Selected
                                </span>
                            ` : ''}
                        </div>
                        
                        <button class="w-8 h-8 rounded-full bg-white/80 hover:bg-white active:scale-75 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all duration-200 shadow-xs btn-favorite" data-id="${product.id}">
                            <i data-lucide="heart" class="w-4 h-4 ${product.favorite ? 'text-rose-500 fill-rose-500 animate-heart-pop' : ''}"></i>
                        </button>
                    </div>

                    <!-- Centered Circular Food Image -->
                    <div class="my-3 flex items-center justify-center relative py-2">
                        <div class="w-32 h-32 md:w-36 md:h-36 rounded-full bg-white/40 p-2 backdrop-blur-xs flex items-center justify-center shadow-inner">
                            <img src="${product.image}" alt="${product.name}" class="product-img w-28 h-28 md:w-32 md:h-32 rounded-full object-cover shadow-lg pointer-events-none">
                        </div>
                        ${product.stock <= 0 ? `
                            <span class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs rounded-[24px] flex items-center justify-center text-white font-extrabold text-xs tracking-wider uppercase">Out of Stock</span>
                        ` : ''}
                    </div>

                    <!-- Product Info Footer & Quantity Controller -->
                    <div class="space-y-2 z-10 pt-1">
                        <div class="flex items-baseline justify-between">
                            <h3 class="text-sm font-extrabold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">${product.name}</h3>
                            <span class="text-[11px] text-slate-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">${product.weight || '300g'}</span>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <span class="text-base font-extrabold text-slate-900">${formatCurrency(product.price)}</span>
                            
                            ${product.stock <= 0 ? '' : (qtyInCart > 0 ? `
                                <div class="flex items-center gap-1.5 bg-white/95 backdrop-blur-md rounded-full p-1 border border-emerald-400 shadow-sm z-20">
                                    <button type="button" class="btn-card-minus w-7 h-7 rounded-full bg-slate-100 hover:bg-rose-500 hover:text-white flex items-center justify-center text-slate-700 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-90" data-id="${product.id}" title="Decrease quantity">
                                        <i data-lucide="minus" class="w-3.5 h-3.5 pointer-events-none"></i>
                                    </button>
                                    <span class="text-xs font-extrabold text-emerald-800 min-w-[20px] text-center select-none">${qtyInCart}</span>
                                    <button type="button" class="btn-card-plus w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-90" data-id="${product.id}" title="Increase quantity">
                                        <i data-lucide="plus" class="w-3.5 h-3.5 pointer-events-none"></i>
                                    </button>
                                </div>
                            ` : `
                                <button type="button" class="btn-card-add-initial text-xs font-extrabold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1 cursor-pointer transition-all z-20" data-id="${product.id}">
                                    <i data-lucide="plus" class="w-3.5 h-3.5 pointer-events-none"></i>
                                    Add
                                </button>
                            `)}
                        </div>
                    </div>

                </div>
                `;
            }).join('');
        }

        if (window.lucide) {
            window.lucide.createIcons({ nameAttr: 'data-lucide' });
        }

        bindProductGridEvents();
    }

    // Expose renderProducts globally so cart updates refresh card buttons
    window._renderPOSProducts = renderProducts;

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

            // Card Body Click → Toggle selection; add to cart on first select
            card.onclick = (e) => {
                if (e.target.closest('.btn-favorite') || e.target.closest('.btn-card-minus') || e.target.closest('.btn-card-plus') || e.target.closest('.btn-card-add-initial')) {
                    return; // Handled separately
                }

                const id = card.dataset.productId;
                const product = productsInstance.getById(id);
                if (!product) return;

                // Toggle: clicking the already-selected card deselects it
                if (selectedProductId === id) {
                    selectedProductId = null;
                    renderProducts();
                    return;
                }

                selectedProductId = id;

                if (product.stock <= 0) {
                    showToast(`${product.name} is currently out of stock`, 'warning');
                    selectedProductId = null;
                    renderProducts();
                    return;
                }

                cartInstance.addItem(product, 1);
                renderProducts();
            };
        });

        // Quantity Minus Button Click
        gridContainer.querySelectorAll('.btn-card-minus').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const item = cartInstance.getItems().find(i => i.product.id === id);
                if (item) {
                    cartInstance.updateQuantity(id, item.quantity - 1);
                    renderProducts();
                }
            };
        });

        // Quantity Plus Button Click
        gridContainer.querySelectorAll('.btn-card-plus').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const product = productsInstance.getById(id);
                if (product) {
                    cartInstance.addItem(product, 1);
                    renderProducts();
                }
            };
        });

        // Initial Add Button Click
        gridContainer.querySelectorAll('.btn-card-add-initial').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const product = productsInstance.getById(id);
                if (product) {
                    selectedProductId = id;
                    if (product.stock <= 0) {
                        showToast(`${product.name} is currently out of stock`, 'warning');
                        renderProducts();
                        return;
                    }
                    cartInstance.addItem(product, 1);
                    renderProducts();
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

    // Bind Load More Meals Button
    setupLoadMoreMealsButton(renderProducts);

    // Initial render
    renderProducts();
}

function setupLoadMoreMealsButton(onRefresh) {
    const btnLoadMore = document.getElementById('btn-load-more-meals');
    if (!btnLoadMore) return;

    let hasLoadedExtra = false;

    btnLoadMore.onclick = () => {
        if (hasLoadedExtra) {
            showToast('All available meals have already been loaded.', 'info');
            return;
        }

        const icon = btnLoadMore.querySelector('[data-lucide], svg');
        const spanText = btnLoadMore.querySelector('span');

        if (icon) icon.classList.add('animate-spin');
        if (spanText) spanText.textContent = 'Loading fresh meals...';
        btnLoadMore.disabled = true;

        setTimeout(() => {
            const extraMeals = [
                {
                    name: 'Gourmet Beef Burger',
                    sku: 'SLD-101',
                    category: 'Food',
                    weight: '350g',
                    price: 349.00,
                    cost: 160.00,
                    rating: 4.8,
                    stock: 25,
                    minStock: 5,
                    bgColor: 'bg-pastel-orange',
                    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80',
                    favorite: true
                },
                {
                    name: 'Crispy Chicken Wings',
                    sku: 'SNK-102',
                    category: 'Snacks',
                    weight: '300g',
                    price: 289.00,
                    cost: 120.00,
                    rating: 4.7,
                    stock: 30,
                    minStock: 8,
                    bgColor: 'bg-pastel-yellow',
                    image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=400&q=80',
                    favorite: false
                },
                {
                    name: 'Fresh Mango Smoothie',
                    sku: 'DRK-103',
                    category: 'Drinks',
                    weight: '450ml',
                    price: 149.00,
                    cost: 50.00,
                    rating: 4.9,
                    stock: 40,
                    minStock: 10,
                    bgColor: 'bg-pastel-yellow',
                    image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400&q=80',
                    favorite: true
                },
                {
                    name: 'Tiramisu Delight',
                    sku: 'DST-104',
                    category: 'Desserts',
                    weight: '200g',
                    price: 210.00,
                    cost: 80.00,
                    rating: 4.9,
                    stock: 15,
                    minStock: 5,
                    bgColor: 'bg-pastel-purple',
                    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=400&q=80',
                    favorite: false
                }
            ];

            extraMeals.forEach(m => productsInstance.addProduct(m));
            hasLoadedExtra = true;

            onRefresh();

            if (icon) icon.classList.remove('animate-spin');
            btnLoadMore.disabled = false;
            btnLoadMore.classList.add('opacity-60', 'cursor-not-allowed');
            if (spanText) spanText.textContent = 'All meals loaded';

            showToast('Loaded 4 new gourmet meals into the POS catalog!', 'success');
        }, 600);
    };
}

function setupMobilePOSTabs() {
    const tabMenu        = document.getElementById('pos-tab-menu');
    const tabOrder       = document.getElementById('pos-tab-order');
    const orderPanel     = document.getElementById('order-panel');
    const productSection = document.getElementById('pos-product-section');
    const btnCloseDrawer = document.getElementById('btn-close-mobile-cart-drawer');

    const TAB_ACTIVE   = 'flex-1 py-2.5 px-3 rounded-xl bg-emerald-500 text-white shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';
    const TAB_INACTIVE = 'flex-1 py-2.5 px-3 rounded-xl text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition-all cursor-pointer font-bold';

    /** Show the order panel — hides product catalog on mobile */
    function showOrderView() {
        if (window.innerWidth < 1024) {
            if (productSection) productSection.classList.add('hidden');
            if (orderPanel) {
                orderPanel.classList.remove('hidden');
                orderPanel.classList.add('flex'); // must add flex since it was removed from static classes
            }
        }
        if (tabOrder) tabOrder.className = TAB_ACTIVE;
        if (tabMenu)  tabMenu.className  = TAB_INACTIVE;
    }

    /** Show the product catalog — hides order panel on mobile */
    function showMenuView() {
        if (window.innerWidth < 1024) {
            if (productSection) productSection.classList.remove('hidden');
            if (orderPanel) {
                orderPanel.classList.add('hidden');
                orderPanel.classList.remove('flex');
            }
        }
        if (tabMenu)  tabMenu.className  = TAB_ACTIVE;
        if (tabOrder) tabOrder.className = TAB_INACTIVE;
    }

    if (tabOrder)       tabOrder.onclick       = showOrderView;
    if (tabMenu)        tabMenu.onclick        = showMenuView;
    if (btnCloseDrawer) btnCloseDrawer.onclick = showMenuView;

    // Expose reset so navigateTo can call it when leaving POS view
    window._posTabReset = showMenuView;
}

export function setupScrollToTopButton() {
    // Find the main scrollable container (the <main> element with overflow-y-auto)
    const mainEl = document.querySelector('main');
    const btnScrollToTop = document.getElementById('btn-scroll-to-top');

    if (!btnScrollToTop) return;

    function show() {
        btnScrollToTop.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-6', 'scale-90');
        btnScrollToTop.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
    }

    function hide() {
        btnScrollToTop.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0', 'scale-100');
        btnScrollToTop.classList.add('opacity-0', 'pointer-events-none', 'translate-y-6', 'scale-90');
    }

    function handleScroll() {
        // Check all possible scroll containers
        const mainScroll  = mainEl ? mainEl.scrollTop : 0;
        const winScroll   = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const totalScroll = Math.max(mainScroll, winScroll);
        if (totalScroll > 120) {
            show();
        } else {
            hide();
        }
    }

    // Attach to the main scrollable container exactly once
    if (mainEl && !mainEl._scrollToTopAttached) {
        mainEl.addEventListener('scroll', handleScroll, { passive: true });
        mainEl._scrollToTopAttached = true;
    }

    // Also listen on window/document as a fallback
    if (!window._scrollToTopAttached) {
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });
        window._scrollToTopAttached = true;
    }

    // Scroll to top on click
    btnScrollToTop.onclick = () => {
        if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Initial check
    handleScroll();

    if (window.lucide) {
        window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }
}

