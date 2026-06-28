import { StockMovement, MOVEMENT_TYPE, MOVEMENT_DIRECTION } from '../../domain/models/stock-movement.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

const TYPE_API_TO_WEB = {
    PURCHASE:   MOVEMENT_TYPE.PURCHASE,
    USAGE:      MOVEMENT_TYPE.USAGE,
    WASTE:      MOVEMENT_TYPE.WASTE,
    ADJUSTMENT: MOVEMENT_TYPE.ADJUSTMENT,
    TRANSFER:   MOVEMENT_TYPE.TRANSFER,
    RETURN:     MOVEMENT_TYPE.RETURN,
};

const DIRECTION_API_TO_WEB = {
    IN:  MOVEMENT_DIRECTION.IN,
    OUT: MOVEMENT_DIRECTION.OUT,
};

/** Razones de dominio alineadas con MovementReason (backend). */
const REASON_BY_TYPE = {
    [MOVEMENT_TYPE.PURCHASE]:   'COMPRA_PROVEEDOR',
    [MOVEMENT_TYPE.RETURN]:     'DEVOLUCION',
    [MOVEMENT_TYPE.ADJUSTMENT]: 'AJUSTE_CONTEO',
    [MOVEMENT_TYPE.TRANSFER]:   'TRANSFERENCIA',
};

function _typeToWeb(raw) {
    if (!raw) return MOVEMENT_TYPE.USAGE;
    const key = String(raw).toUpperCase();
    return TYPE_API_TO_WEB[key] ?? String(raw).toLowerCase();
}

function _directionToWeb(raw) {
    if (!raw) return MOVEMENT_DIRECTION.OUT;
    const key = String(raw).toUpperCase();
    return DIRECTION_API_TO_WEB[key] ?? String(raw).toLowerCase();
}

function _typeToApi(type) {
    return String(type ?? MOVEMENT_TYPE.USAGE).toUpperCase();
}

function _directionToApi(direction) {
    return String(direction ?? MOVEMENT_DIRECTION.OUT).toUpperCase();
}

export class StockMovementAssembler {

    static toEntityFromResource(resource) {
        const r = resource ?? {};
        return new StockMovement({
            id:            r.movementId ?? r.id ?? null,
            productId:     r.productId ?? r.product_id ?? null,
            productName:   r.productName ?? r.product_name ?? '',
            productSku:    r.productSku ?? r.product_sku ?? '',
            type:          _typeToWeb(r.movementType ?? r.type),
            direction:     _directionToWeb(r.movementDirection ?? r.direction),
            quantity:      Number(r.movementQuantity ?? r.quantity ?? 0),
            previousStock: Number(r.movementPreviousStock ?? r.previous_stock ?? r.previousStock ?? 0),
            newStock:      Number(r.movementNewStock ?? r.new_stock ?? r.newStock ?? 0),
            reason:        r.movementReason ?? r.reason ?? '',
            notes:         r.movementNotes ?? r.notes ?? '',
            employeeId:    r.employeeId ?? r.employee_id ?? null,
            userName:      r.employeeName ?? r.employee_name ?? r.userName ?? r.user_name ?? '',
            sucursalId:    r.branchId ?? r.branch_id ?? r.sucursalId ?? null,
            createdAt:     r.createdAt ?? r.created_at ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, StockMovementAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, StockMovementAssembler.toEntityFromResource);
    }

    /**
     * Payload para POST /inventory/movements (CreateMovementResource).
     */
    static toCreateResource(data, { employeeId }) {
        const type = data.type ?? MOVEMENT_TYPE.USAGE;
        const reason = REASON_BY_TYPE[type] ?? null;
        const notes = [data.reason, data.notes].filter(Boolean).join(' — ').trim() || null;

        return {
            productId:          data.productId,
            employeeId,
            movementType:       _typeToApi(type),
            movementDirection:  _directionToApi(data.direction),
            movementQuantity:   Number(data.quantity) || 0,
            movementReason:     reason,
            movementNotes:      notes,
        };
    }

    /** Payload para PATCH /inventory/movements/{id} (UpdateMovementResource). */
    static toUpdateResource(data) {
        const type = data.type ?? MOVEMENT_TYPE.USAGE;
        const reason = REASON_BY_TYPE[type] ?? null;
        const notes = [data.reason, data.notes].filter(Boolean).join(' — ').trim() || null;

        return {
            movementType:       _typeToApi(type),
            movementDirection:  _directionToApi(data.direction),
            movementQuantity:   Number(data.quantity) || 0,
            movementReason:     reason,
            movementNotes:      notes,
        };
    }
}
