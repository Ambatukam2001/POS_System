/**
 * Toast Notification System
 */

export function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    
    // Theme configurations based on type
    const config = {
        success: {
            bg: 'bg-emerald-600',
            text: 'text-white',
            icon: 'check-circle-2',
            border: 'border-emerald-500'
        },
        error: {
            bg: 'bg-rose-600',
            text: 'text-white',
            icon: 'circle-alert',
            border: 'border-rose-500'
        },
        warning: {
            bg: 'bg-amber-500',
            text: 'text-white',
            icon: 'alert-triangle',
            border: 'border-amber-400'
        },
        info: {
            bg: 'bg-blue-600',
            text: 'text-white',
            icon: 'info',
            border: 'border-blue-500'
        }
    }[type] || config.info;

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-2xl ${config.bg} ${config.text} shadow-xl border ${config.border} transform transition-all duration-300 translate-y-[-10px] opacity-0 animate-slide-up max-w-sm pointer-events-auto`;
    
    toast.innerHTML = `
        <div class="p-1 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <i data-lucide="${config.icon}" class="w-5 h-5"></i>
        </div>
        <div class="text-sm font-semibold leading-snug flex-1">${message}</div>
        <button class="opacity-70 hover:opacity-100 transition-opacity ml-2 p-1" onclick="this.parentElement.remove()">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;

    container.appendChild(toast);

    // Refresh Lucide icons in toast
    if (window.lucide) {
        window.lucide.createIcons({
            nameAttr: 'data-lucide',
            attrs: { strokeWidth: 2 }
        });
    }

    // Trigger smooth fade in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-[-10px]', 'opacity-0');
    });

    // Auto dismiss
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-10');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, duration);
}
