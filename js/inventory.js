/**
 * Inventory Stock Tracking Module
 */

import { productsInstance } from './products.js';
import { showToast } from './toast.js';

export class InventoryManager {
    getStats() {
        const products = productsInstance.getAll();
        const totalProducts = products.length;
        let inStockCount = 0;
        let lowStockCount = 0;
        let outOfStockCount = 0;

        products.forEach(p => {
            if (p.stock <= 0) outOfStockCount++;
            else if (p.stock <= p.minStock) lowStockCount++;
            else inStockCount++;
        });

        return {
            totalProducts,
            inStockCount,
            lowStockCount,
            outOfStockCount
        };
    }

    adjustStock(productId, deltaQuantity) {
        const product = productsInstance.getById(productId);
        if (!product) return null;

        const newStock = Math.max(0, product.stock + deltaQuantity);
        const updated = productsInstance.updateProduct(productId, { stock: newStock });
        showToast(`Stock updated for ${product.name} (${newStock} units remaining)`, 'success');
        return updated;
    }
}

export const inventoryInstance = new InventoryManager();
