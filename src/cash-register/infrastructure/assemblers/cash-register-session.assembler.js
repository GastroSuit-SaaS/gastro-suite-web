import { CashRegisterSession } from '../../domain/models/cash-register-session.entity.js';

/**
 * CashRegister Infrastructure - CashRegisterSession Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class CashRegisterSessionAssembler {

    static toEntityFromResource(resource) {
        return new CashRegisterSession({
            id:              resource.id,
            shiftName:       resource.shiftName       ?? resource.shift_name       ?? '',
            openedAt:        resource.openedAt        ?? resource.opened_at        ?? null,
            closedAt:        resource.closedAt        ?? resource.closed_at        ?? null,
            openedBy:        resource.openedBy        ?? resource.opened_by        ?? null,
            closedBy:        resource.closedBy        ?? resource.closed_by        ?? null,
            initialAmount:   resource.initialAmount   ?? resource.initial_amount   ?? 0,
            finalAmount:     resource.finalAmount     ?? resource.final_amount     ?? null,
            status:          resource.status          ?? 'open',
            sucursalId:      resource.sucursalId      ?? resource.sucursal_id      ?? null,
            notes:           resource.notes           ?? '',
            totalSales:      resource.totalSales      ?? resource.total_sales      ?? 0,
            totalRevenue:    resource.totalRevenue    ?? resource.total_revenue    ?? 0,
            cashRevenue:     resource.cashRevenue     ?? resource.cash_revenue     ?? 0,
            digitalRevenue:  resource.digitalRevenue  ?? resource.digital_revenue  ?? 0,
            expectedCash:    resource.expectedCash    ?? resource.expected_cash    ?? 0,
            countedAmount:   resource.countedAmount   ?? resource.counted_amount   ?? null,
            difference:      resource.difference      ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const data = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(data)) return [];
        return data.map(r => CashRegisterSessionAssembler.toEntityFromResource(r));
    }

    static toEntityFromResponse(response) {
        if (response.status !== 200 && response.status !== 201) return null;
        const data = response.data?.data ?? response.data;
        if (!data) return null;
        return CashRegisterSessionAssembler.toEntityFromResource(data);
    }

    static toResourceFromEntity(entity) {
        return {
            shift_name:      entity.shiftName,
            initial_amount:  entity.initialAmount,
            notes:           entity.notes,
        };
    }

    static toCloseResourceFromEntity(entity) {
        return {
            final_amount:    entity.finalAmount,
            notes:           entity.notes,
            total_sales:     entity.totalSales,
            total_revenue:   entity.totalRevenue,
            cash_revenue:    entity.cashRevenue,
            digital_revenue: entity.digitalRevenue,
            expected_cash:   entity.expectedCash,
            counted_amount:  entity.countedAmount,
            difference:      entity.difference,
        };
    }
}
