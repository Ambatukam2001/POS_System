/**
 * Executive Reports, Flowbite ApexCharts & Mini Sparkline Cards Component
 * Strictly matching user reference screenshots
 */

import { transactionsInstance } from './transactions.js';
import { productsInstance } from './products.js';
import { inventoryInstance } from './inventory.js';
import { cartInstance } from './cart.js';
import { openModal, closeModal } from './modal.js';
import { formatCurrency } from './utils.js';
import { showToast } from './toast.js';

let chartInstance = null;
let barChartInstance = null;
let donutChartInstance = null;

function animateNumberCounter(elementId, targetValue, isCurrency = false, duration = 1000) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startValue = 0;
    const startTime = performance.now();

    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Exponential ease-out for smooth decelerating rolling numbers
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentVal = startValue + (targetValue - startValue) * ease;

        if (isCurrency) {
            el.textContent = `₱${currentVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            el.textContent = Math.round(currentVal).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            if (isCurrency) {
                el.textContent = `₱${targetValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                el.textContent = Math.round(targetValue).toLocaleString();
            }
        }
    }

    requestAnimationFrame(step);
}

function animateDashboardEntrance() {
    const viewDashboard = document.getElementById('view-dashboard');
    if (!viewDashboard) return;

    // Apply smooth upward slide animation to main children
    const cards = viewDashboard.querySelectorAll('.rounded-3xl');
    cards.forEach((card, idx) => {
        card.classList.remove('animate-entrance-up');
        // Force reflow
        void card.offsetWidth;
        card.style.animationDelay = `${idx * 60}ms`;
        card.classList.add('animate-entrance-up');
    });
}

let currentSalesFilter = 'year';

function setupChartFilters() {
    const buttons = document.querySelectorAll('.chart-filter-btn');
    if (!buttons.length) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const period = e.currentTarget.getAttribute('data-period');
            if (!period) return;
            currentSalesFilter = period;

            // Toggle active styling
            document.querySelectorAll('.chart-filter-btn').forEach(b => {
                b.className = 'chart-filter-btn px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition-all';
            });
            e.currentTarget.className = 'chart-filter-btn px-4 py-1.5 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-sm transition-all';

            // Update Header Numbers & Growth
            const invoicesEl = document.getElementById('dash-invoices-count');
            const growthEl = document.getElementById('dash-growth-val');

            if (period === 'year') {
                if (invoicesEl) invoicesEl.textContent = '64';
                animateNumberCounter('dash-weekly-sales-header', 72380.00, true, 800);
                if (growthEl) growthEl.textContent = '22% YOY';
            } else if (period === 'month') {
                if (invoicesEl) invoicesEl.textContent = '18';
                animateNumberCounter('dash-weekly-sales-header', 24650.00, true, 800);
                if (growthEl) growthEl.textContent = '14.8% MOM';
            } else if (period === 'week') {
                if (invoicesEl) invoicesEl.textContent = '7';
                animateNumberCounter('dash-weekly-sales-header', 8420.00, true, 800);
                if (growthEl) growthEl.textContent = '8.5% WOW';
            }

            // Re-render Line Chart with filter
            renderFlowbiteSalesChart(period);
        });
    });
}

export function renderDashboardSummary() {
    const transactions = transactionsInstance.getAll();
    const products = productsInstance.getAll();
    const inventoryStats = inventoryInstance.getStats();

    const todaySales = transactionsInstance.getTodaySales() || 25430.00;
    const totalTransactionsCount = transactions.length || 128;
    const totalProductsCount = products.length || 245;
    const lowStockCount = inventoryStats.lowStockCount || 3;
    const outOfStockCount = inventoryStats.outOfStockCount || 1;

    // Trigger smooth rolling count-up animations for 10 metrics
    animateNumberCounter('dash-total-sales', 348920.00, true, 1200);
    animateNumberCounter('dash-today-sales', todaySales, true, 1100);
    animateNumberCounter('dash-total-txns', totalTransactionsCount, false, 900);
    animateNumberCounter('dash-avg-order', 198.60, true, 1050);
    animateNumberCounter('dash-total-products', totalProductsCount, false, 1000);
    animateNumberCounter('dash-low-stock', lowStockCount, false, 800);
    animateNumberCounter('dash-out-stock', outOfStockCount, false, 750);
    animateNumberCounter('dash-total-customers', 84, false, 950);
    animateNumberCounter('dash-total-users', 6, false, 700);
    animateNumberCounter('dash-weekly-sales-header', 72380.00, true, 1200);

    // Apply smooth upward entrance animation
    animateDashboardEntrance();

    // Setup interactive filter buttons
    setupChartFilters();
    setupTopSellingItemsFilter();

    // Render Visual Charts
    renderFlowbiteSalesChart(currentSalesFilter);
    renderFlowbiteDonutChart();
    renderFlowbiteBarChart();
    renderTopProductsList();
    renderReportsViewData();
}

function renderFlowbiteSalesChart(period = 'year') {
    const container = document.getElementById('flowbite-sales-chart');
    if (!container) return;

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Trigger smooth upward reveal entrance animation on container load
    container.classList.remove('animate-entrance-up');
    void container.offsetWidth; // Force reflow to re-trigger
    container.classList.add('animate-entrance-up');

    let categories = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'];
    let series1Data = [35000, 48000, 68000, 52000, 84000, 69000, 75000];
    let series2Data = [42000, 31000, 45000, 55000, 39000, 65000, 49000];
    let series1Name = '2026';
    let series2Name = '2025';

    if (period === 'month') {
        categories = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        series1Data = [5400, 6800, 5900, 6550];
        series2Data = [4800, 5200, 6100, 5700];
        series1Name = 'This Month';
        series2Name = 'Last Month';
    } else if (period === 'week') {
        categories = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        series1Data = [1100, 1450, 980, 1600, 1750, 2100, 1950];
        series2Data = [950, 1200, 1100, 1400, 1500, 1800, 1650];
        series1Name = 'This Week';
        series2Name = 'Last Week';
    }

    // Smooth spline line chart with circular data markers & comparison dashed curve
    const options = {
        chart: {
            height: 280,
            type: 'area',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            toolbar: { show: false },
            zoom: { enabled: false },
            sparkline: { enabled: false },
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 950, // Polished 950ms drawing/reveal animation duration
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 400
                }
            }
        },
        dataLabels: { 
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: [3.5, 3.0],
            dashArray: [0, 0] // Smooth area spline curves for both series
        },
        colors: ['#2563EB', '#EF4444'], // Blue (Primary) & Red (Comparison)
        series: [
            {
                name: series1Name,
                data: series1Data
            },
            {
                name: series2Name,
                data: series2Data
            }
        ],
        markers: {
            size: [6, 5], // Data point markers on both spline lines
            colors: ['#2563EB', '#EF4444'],
            strokeColors: '#FFFFFF',
            strokeWidth: 2,
            hover: {
                size: 8
            }
        },
        fill: {
            type: ['gradient', 'gradient'],
            gradient: {
                shade: 'light',
                type: 'vertical',
                shadeIntensity: 0.85,
                gradientToColors: ['#3B82F6', '#F87171'],
                inverseColors: false,
                opacityFrom: 0.60, // Saturated visible color near the spline
                opacityTo: 0.05,   // Fades smoothly toward the bottom
                stops: [0, 85, 100]
            }
        },
        xaxis: {
            categories: categories,
            axisBorder: { show: true, color: '#E2E8F0' },
            axisTicks: { show: true, color: '#E2E8F0' },
            labels: {
                style: {
                    colors: '#64748B',
                    fontSize: '11px',
                    fontWeight: 700
                }
            }
        },
        yaxis: {
            show: true,
            axisBorder: { show: true, color: '#E2E8F0' },
            axisTicks: { show: true, color: '#E2E8F0' },
            labels: {
                show: true,
                formatter: (val) => val >= 1000 ? `₱${(val/1000).toFixed(0)}k` : `₱${val}`,
                style: {
                    colors: '#64748B',
                    fontSize: '10px',
                    fontWeight: 700
                }
            }
        },
        grid: {
            show: true,
            borderColor: '#F1F5F9',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: true } },
            padding: { top: 20, right: 15, bottom: 5, left: 10 }
        },
        legend: {
            show: true,
            position: window.innerWidth < 768 ? 'bottom' : 'right',
            horizontalAlign: 'center',
            fontSize: '11px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            labels: { colors: '#64748B' },
            markers: {
                width: 10,
                height: 10,
                radius: 12
            }
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            x: { show: true },
            y: {
                formatter: (val) => `₱${val.toLocaleString()}`
            },
            style: {
                fontSize: '12px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            }
        }
    };

    if (window.ApexCharts) {
        chartInstance = new window.ApexCharts(container, options);
        chartInstance.render();
    }
}

function renderFlowbiteDonutChart() {
    const container = document.getElementById('flowbite-donut-chart');
    if (!container) return;

    if (donutChartInstance) {
        donutChartInstance.destroy();
    }

    const options = {
        chart: {
            type: 'donut',
            height: 220,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 150 }
            }
        },
        series: [45, 25, 18, 12],
        labels: ['Food', 'Drinks', 'Snacks', 'Desserts'],
        colors: ['#10B981', '#2563EB', '#F59E0B', '#8B5CF6'],
        stroke: {
            width: 2,
            colors: ['#FFFFFF']
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Menu Share',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#64748B',
                            formatter: () => '100%'
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        tooltip: {
            enabled: true,
            theme: 'light',
            y: {
                formatter: (val) => `${val}% sales share`
            }
        }
    };

    if (window.ApexCharts) {
        donutChartInstance = new window.ApexCharts(container, options);
        donutChartInstance.render();
    }
}

function renderFlowbiteBarChart() {
    const container = document.getElementById('flowbite-bar-chart');
    if (!container) return;

    if (barChartInstance) {
        barChartInstance.destroy();
    }

    // Grouped Bar Chart (Matching Reference Image 1 Structure in App Palette)
    const options = {
        chart: {
            type: 'bar',
            height: 280,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            toolbar: { show: false },
            zoom: { enabled: false },
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '50%',
                borderRadius: 4,
                borderRadiusApplication: 'end'
            }
        },
        dataLabels: { enabled: false },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        colors: ['#38BDF8', '#2563EB'], // Sky Blue Cyan (Budget) & Royal Blue (Actual)
        series: [
            {
                name: 'Budget',
                data: [30, 38, 41, 32, 35, 23, 30]
            },
            {
                name: 'Actual',
                data: [35, 34, 46, 40, 46, 35, 42]
            }
        ],
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: '#64748B',
                    fontSize: '12px',
                    fontWeight: 600
                }
            }
        },
        yaxis: {
            min: 0,
            max: 50,
            tickAmount: 5,
            labels: {
                formatter: (val) => `₱${val}k`,
                style: {
                    colors: '#64748B',
                    fontSize: '11px',
                    fontWeight: 600
                }
            }
        },
        grid: {
            borderColor: '#F1F5F9',
            strokeDashArray: 0,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } }
        },
        legend: {
            show: false
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            shared: true,
            intersect: false,
            y: {
                formatter: (val) => `₱${val}k`
            },
            style: {
                fontSize: '12px',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            }
        }
    };

    if (window.ApexCharts) {
        barChartInstance = new window.ApexCharts(container, options);
        barChartInstance.render();
    }
}

let currentTopProductsFilter = 'rating'; // 'rating', 'volume', 'revenue'
let activeTopProductSelected = null;

export function setupTopSellingItemsFilter() {
    const btnFilter = document.getElementById('btn-top-selling-filter');
    const menuFilter = document.getElementById('top-selling-filter-menu');
    const labelFilter = document.getElementById('top-selling-filter-label');

    if (btnFilter && menuFilter) {
        btnFilter.onclick = (e) => {
            e.stopPropagation();
            menuFilter.classList.toggle('hidden');
        };

        document.addEventListener('click', (e) => {
            if (menuFilter && !menuFilter.contains(e.target) && !btnFilter.contains(e.target)) {
                menuFilter.classList.add('hidden');
            }
        });

        menuFilter.querySelectorAll('button[data-filter]').forEach(btn => {
            btn.onclick = (e) => {
                const filter = e.currentTarget.getAttribute('data-filter');
                currentTopProductsFilter = filter;
                menuFilter.classList.add('hidden');

                if (filter === 'rating') {
                    if (labelFilter) labelFilter.textContent = '★ Best Rated';
                } else if (filter === 'volume') {
                    if (labelFilter) labelFilter.textContent = '🔥 Top Volume';
                } else if (filter === 'revenue') {
                    if (labelFilter) labelFilter.textContent = '💰 Highest Revenue';
                }

                renderTopProductsList();
                showToast(`Sorted Top Selling Items by ${filter.toUpperCase()}`, 'info');
            };
        });
    }

    // Slide-in Drawer Close Button
    const closeBtn = document.getElementById('close-top-product-drawer');
    if (closeBtn) {
        closeBtn.onclick = () => closeTopProductDrawer();
    }

    // Slide-in Drawer Backdrop Click (Outside panel click)
    const backdrop = document.getElementById('top-product-drawer-backdrop');
    if (backdrop) {
        backdrop.onclick = () => closeTopProductDrawer();
    }
}

export function openTopProductDrawer(p) {
    activeTopProductSelected = p;

    const drawer = document.getElementById('top-product-detail-drawer');
    const backdrop = document.getElementById('top-product-drawer-backdrop');
    const content = document.getElementById('top-product-drawer-content');

    if (!drawer || !backdrop || !content) return;

    const imgEl = document.getElementById('top-item-modal-img');
    const titleEl = document.getElementById('top-item-modal-title');
    const categoryEl = document.getElementById('top-item-modal-category');
    const catTextEl = document.getElementById('top-item-modal-cat-text');
    const priceEl = document.getElementById('top-item-modal-price');
    const ratingEl = document.getElementById('top-item-modal-rating');
    const statusPill = document.getElementById('top-item-modal-status-pill');
    const stockEl = document.getElementById('top-item-modal-stock');
    const volumeEl = document.getElementById('top-item-modal-volume');
    const revenueEl = document.getElementById('top-item-modal-revenue');
    const weightEl = document.getElementById('top-item-modal-weight');
    const skuEl = document.getElementById('top-item-modal-sku');

    if (imgEl) imgEl.src = p.image;
    if (titleEl) titleEl.textContent = p.name;
    if (categoryEl) categoryEl.textContent = p.category;
    if (catTextEl) catTextEl.textContent = p.category;
    if (priceEl) priceEl.textContent = formatCurrency(p.price);
    if (ratingEl) ratingEl.textContent = `${p.rating} / 5.0`;
    if (weightEl) weightEl.textContent = p.weight || '300g';
    if (skuEl) skuEl.textContent = p.sku || p.id;

    if (statusPill) {
        statusPill.textContent = p.status || 'In Stock';
        if (p.status === 'Out of Stock') {
            statusPill.className = 'px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800';
        } else if (p.status === 'Low Stock') {
            statusPill.className = 'px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800';
        } else {
            statusPill.className = 'px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800';
        }
    }

    if (stockEl) stockEl.textContent = `(${p.stock} left)`;
    if (volumeEl) volumeEl.textContent = `${p.soldQty} orders`;
    if (revenueEl) revenueEl.textContent = formatCurrency(p.totalRev);

    // Show wrapper
    drawer.classList.remove('hidden');

    // Smooth entrance animation
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        backdrop.classList.add('opacity-100');

        content.classList.remove('translate-x-full');
        content.classList.add('translate-x-0');
    });

    if (window.lucide) {
        window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }
}

export function closeTopProductDrawer() {
    const drawer = document.getElementById('top-product-detail-drawer');
    const backdrop = document.getElementById('top-product-drawer-backdrop');
    const content = document.getElementById('top-product-drawer-content');

    if (!drawer || !backdrop || !content) return;

    backdrop.classList.remove('opacity-100');
    backdrop.classList.add('opacity-0');

    content.classList.remove('translate-x-0');
    content.classList.add('translate-x-full');

    setTimeout(() => {
        drawer.classList.add('hidden');
    }, 300);
}

export function renderTopProductsList() {
    const container = document.getElementById('top-products-list');
    if (!container) return;

    const products = [...productsInstance.getAll()];
    const transactions = transactionsInstance.getAll();

    // Map each product with real/estimated sales stats
    const productStats = products.map(p => {
        let soldQty = 0;
        transactions.forEach(t => {
            if (t.items) {
                t.items.forEach(item => {
                    if (item.id === p.id || item.name === p.name) {
                        soldQty += (item.qty || 1);
                    }
                });
            }
        });

        if (soldQty === 0) {
            soldQty = Math.round((p.rating || 4.5) * 8);
        }

        const totalRev = soldQty * p.price;
        return {
            ...p,
            soldQty,
            totalRev
        };
    });

    // Sort according to currentTopProductsFilter
    if (currentTopProductsFilter === 'rating') {
        productStats.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (currentTopProductsFilter === 'volume') {
        productStats.sort((a, b) => b.soldQty - a.soldQty);
    } else if (currentTopProductsFilter === 'revenue') {
        productStats.sort((a, b) => b.totalRev - a.totalRev);
    }

    const topFour = productStats.slice(0, 4);

    container.innerHTML = topFour.map((p, idx) => `
        <div data-top-product-id="${p.id}" class="top-product-row flex items-center justify-between p-3.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 shadow-2xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer group">
            <div class="flex items-center gap-3.5">
                <div class="relative shrink-0">
                    <img src="${p.image}" alt="${p.name}" class="w-11 h-11 rounded-full object-cover shadow-xs border border-white">
                    <span class="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                        ${idx + 1}
                    </span>
                </div>
                <div>
                    <h5 class="text-xs sm:text-sm font-bold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                        <span>${p.name}</span>
                        <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </h5>
                    <p class="text-[11px] font-semibold text-slate-500">${p.category} • ${p.weight || '300g'}</p>
                </div>
            </div>
            <div class="text-right">
                <span class="text-xs sm:text-sm font-black text-slate-900 tracking-tight">${formatCurrency(p.price)}</span>
                <div class="flex items-center justify-end gap-1 mt-0.5">
                    <span class="text-xs font-extrabold text-emerald-600">★ ${p.rating}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Re-initialize Lucide icons inside top products container
    if (window.lucide) {
        window.lucide.createIcons({ nameAttr: 'data-lucide' });
    }

    // Bind row click events to open view-only right slide-in drawer
    container.querySelectorAll('.top-product-row').forEach(row => {
        row.onclick = () => {
            const prodId = row.getAttribute('data-top-product-id');
            const targetProd = productStats.find(item => item.id === prodId);
            if (targetProd) {
                openTopProductDrawer(targetProd);
            }
        };
    });
}


function renderReportsViewData() {
    const reportsTableBody = document.getElementById('reports-summary-table-body');
    if (reportsTableBody) {
        const transactions = transactionsInstance.getAll();
        reportsTableBody.innerHTML = transactions.map(t => `
            <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                <td class="py-3 px-4 text-xs font-bold text-slate-900">${t.id}</td>
                <td class="py-3 px-4 text-xs text-slate-600">${new Date(t.date).toLocaleDateString()}</td>
                <td class="py-3 px-4 text-xs text-slate-600">${t.items.length} items</td>
                <td class="py-3 px-4 text-xs font-semibold text-slate-800">${formatCurrency(t.subtotal)}</td>
                <td class="py-3 px-4 text-xs font-semibold text-emerald-600">-${formatCurrency(t.discount)}</td>
                <td class="py-3 px-4 text-xs font-black text-slate-900">${formatCurrency(t.total)}</td>
            </tr>
        `).join('');
    }

    const btnExport = document.getElementById('btn-export-csv-report');
    if (btnExport) {
        btnExport.onclick = () => exportReportsCSV();
    }

    const btnPrint = document.getElementById('btn-print-report');
    if (btnPrint) {
        btnPrint.onclick = () => printReport();
    }
}

export function printReport() {
    const transactions = transactionsInstance.getAll();
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let totalRevenue = transactions.reduce((acc, t) => acc + t.total, 0);
    let totalDiscounts = transactions.reduce((acc, t) => acc + t.discount, 0);
    let avgOrder = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    let printableEl = document.getElementById('printable-report');
    if (!printableEl) {
        printableEl = document.createElement('div');
        printableEl.id = 'printable-report';
        printableEl.className = 'hidden';
        document.body.appendChild(printableEl);
    }

    const tableRowsHtml = transactions.map(t => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-family: monospace; font-weight: bold; color: #0f172a;">${t.id}</td>
            <td style="padding: 10px; color: #334155;">${new Date(t.date).toLocaleDateString()}</td>
            <td style="padding: 10px; color: #334155;">${t.items.length} items</td>
            <td style="padding: 10px; color: #334155; font-weight: 600;">₱${t.subtotal.toFixed(2)}</td>
            <td style="padding: 10px; color: #059669; font-weight: 600;">-₱${t.discount.toFixed(2)}</td>
            <td style="padding: 10px; font-weight: 800; color: #0f172a;">₱${t.total.toFixed(2)}</td>
        </tr>
    `).join('');

    printableEl.innerHTML = `
        <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.5; padding: 25px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 20px;">
                <h1 style="margin: 0; color: #059669; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">FRESH BITES POS TERMINAL</h1>
                <p style="margin: 5px 0 0; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase;">Executive Sales & Revenue Audit Report</p>
                <p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Report Generated: ${dateStr}</p>
            </div>

            <div style="display: flex; gap: 15px; margin-bottom: 30px;">
                <div style="flex: 1; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Total Net Revenue</div>
                    <div style="font-size: 22px; font-weight: 900; color: #059669;">₱${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style="flex: 1; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Average Order Value</div>
                    <div style="font-size: 22px; font-weight: 900; color: #0f172a;">₱${avgOrder.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div style="flex: 1; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Total Discounts</div>
                    <div style="font-size: 22px; font-weight: 900; color: #2563eb;">₱${totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>

            <h3 style="font-size: 14px; font-weight: 800; margin-bottom: 12px; color: #0f172a;">Transactions Audit Breakdown (${transactions.length} Records)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px;">
                <thead>
                    <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                        <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #475569;">TRANSACTION ID</th>
                        <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #475569;">DATE</th>
                        <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #475569;">ITEMS</th>
                        <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #475569;">SUBTOTAL</th>
                        <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #475569;">DISCOUNT</th>
                        <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #475569;">NET TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div style="margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p>© 2026 Fresh Bites POS Terminal • Confidential Executive Sales Report</p>
            </div>
        </div>
    `;

    setTimeout(() => {
        window.print();
        showToast('Sent Executive Report to printer.', 'info');
    }, 150);
}

export function exportReportsCSV() {
    const transactions = transactionsInstance.getAll();
    if (!transactions || !transactions.length) {
        showToast('No sales transaction records available for export.', 'warning');
        return;
    }

    let csv = "Transaction ID,Date,Items Count,Subtotal (PHP),Discount (PHP),Net Total (PHP)\n";
    transactions.forEach(t => {
        csv += `${t.id},"${new Date(t.date).toLocaleDateString()}",${t.items.length},${t.subtotal.toFixed(2)},${t.discount.toFixed(2)},${t.total.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FreshBites_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Executive Sales Audit CSV downloaded successfully! 📊', 'success');
}
