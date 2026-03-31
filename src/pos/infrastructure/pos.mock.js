import { Sale, SALE_STATUS } from '../domain/models/sale.entity.js';
import { SaleItem }          from '../domain/models/sale-item.entity.js';

const agno = (min) => new Date(Date.now() - min * 60000);

export const MOCK_SALES = (() => {
    const s1 = new Sale({
        id: 1201, tableId: 2, zoneId: 1, status: SALE_STATUS.ACTIVE, createdAt: agno(45), sucursalId: 'branch-001',
        items: [
            new SaleItem({ id: 9001, menuItemId: 1, menuItemName: 'Ceviche Clásico',   quantity: 1, unitPrice: 28, stationId: 2, stationName: 'Cocina Fría',     isSent: true }),
            new SaleItem({ id: 9002, menuItemId: 2, menuItemName: 'Tequeños de Queso', quantity: 1, unitPrice: 18, stationId: 2, stationName: 'Cocina Fría',     isSent: true }),
        ],
    });
    s1._recalculate();

    const s2 = new Sale({
        id: 1215, tableId: 4, zoneId: 1, status: SALE_STATUS.ACTIVE, createdAt: agno(72), sucursalId: 'branch-001',
        items: [
            new SaleItem({ id: 9003, menuItemId: 3, menuItemName: 'Lomo Saltado',      quantity: 2, unitPrice: 45, stationId: 1, stationName: 'Cocina Caliente', isSent: true  }),
            new SaleItem({ id: 9004, menuItemId: 6, menuItemName: 'Pasta Alfredo',     quantity: 1, unitPrice: 32, stationId: 5, stationName: 'Pastas',          isSent: true  }),
            new SaleItem({ id: 9005, menuItemId: 2, menuItemName: 'Tequeños de Queso', quantity: 3, unitPrice: 18, stationId: 2, stationName: 'Cocina Fría',     isSent: false }),
        ],
    });
    s2._recalculate();

    const s3 = new Sale({
        id: 1246, tableId: 8, zoneId: 2, status: SALE_STATUS.ACTIVE, createdAt: agno(38), sucursalId: 'branch-001',
        items: [
            new SaleItem({ id: 9006, menuItemId: 4, menuItemName: 'Pollo a la Brasa',  quantity: 1, unitPrice: 52, stationId: 1, stationName: 'Cocina Caliente', isSent: true }),
            new SaleItem({ id: 9007, menuItemId: 1, menuItemName: 'Ceviche Clásico',   quantity: 1, unitPrice: 28, stationId: 2, stationName: 'Cocina Fría',     isSent: true }),
        ],
    });
    s3._recalculate();

    const s4 = new Sale({
        id: 1300, tableId: 14, zoneId: 4, status: SALE_STATUS.ACTIVE, createdAt: agno(30), sucursalId: 'branch-002',
        items: [
            new SaleItem({ id: 9008, menuItemId: 14, menuItemName: 'Ají de Gallina', quantity: 2, unitPrice: 35, stationId: 1, stationName: 'Cocina Caliente', isSent: true }),
            new SaleItem({ id: 9009, menuItemId: 15, menuItemName: 'Chicha Morada',  quantity: 2, unitPrice: 10, stationId: 4, stationName: 'Bar',             isSent: true }),
        ],
    });
    s4._recalculate();

    return [s1, s2, s3, s4];
})();
