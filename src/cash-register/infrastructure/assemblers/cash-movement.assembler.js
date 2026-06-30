import { CashMovement, MOVEMENT_TYPE, MOVEMENT_CATEGORY } from '../../domain/models/cash-movement.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrastructure/api-response.js';

const TYPE_API_TO_WEB = {
    INCOME:  MOVEMENT_TYPE.INCOME,
    EXPENSE: MOVEMENT_TYPE.EXPENSE,
};

const TYPE_WEB_TO_API = {
    [MOVEMENT_TYPE.INCOME]:  'INCOME',
    [MOVEMENT_TYPE.EXPENSE]: 'EXPENSE',
};

const CATEGORY_API_TO_WEB = {
    APERTURA:      MOVEMENT_CATEGORY.APERTURA,
    VENTA:         MOVEMENT_CATEGORY.VENTA,
    VENTA_DIGITAL: MOVEMENT_CATEGORY.VENTA_DIGITAL,
    REEMBOLSO:     MOVEMENT_CATEGORY.REEMBOLSO,
    COMPRA:        MOVEMENT_CATEGORY.COMPRA,
    RETIRO:        MOVEMENT_CATEGORY.RETIRO,
    DEPOSITO:      MOVEMENT_CATEGORY.DEPOSITO,
    CIERRE:        MOVEMENT_CATEGORY.CIERRE,
    PROPIA:        MOVEMENT_CATEGORY.PROPIA,
    OTRO:          MOVEMENT_CATEGORY.OTRO,
};

function _categoryToWeb(cat) {
    if (!cat) return MOVEMENT_CATEGORY.OTRO;
    const key = String(cat).toUpperCase().replace(/-/g, '_');
    return CATEGORY_API_TO_WEB[key] ?? String(cat).toLowerCase();
}

function _categoryToApi(cat) {
    if (!cat) return 'OTRO';
    const upper = String(cat).toUpperCase();
    if (CATEGORY_API_TO_WEB[upper]) return upper;
    const entry = Object.entries(CATEGORY_API_TO_WEB).find(([, v]) => v === cat);
    return entry ? entry[0] : upper;
}

/**
 * CashRegister Infrastructure - CashMovement Assembler
 */
export class CashMovementAssembler {

    static toEntityFromResource(resource) {
        const r = resource ?? {};
        const typeRaw = r.movementType ?? r.type ?? '';
        const type = TYPE_API_TO_WEB[typeRaw.toUpperCase()] ?? typeRaw.toLowerCase();
        return new CashMovement({
            id:          r.movementId ?? r.id ?? null,
            type,
            amount:      Number(r.movementAmount ?? r.amount ?? 0),
            description: r.movementDescription ?? r.description ?? '',
            sessionId:   r.sessionId ?? r.session_id ?? null,
            registerId:  r.sessionId ?? r.session_id ?? null,
            userId:      r.employeeId ?? r.user_id ?? null,
            userName:    r.employeeFullName ?? r.userName ?? r.user_name ?? '',
            category:    _categoryToWeb(r.movementCategory ?? r.category),
            createdAt:   r.createdAt ?? r.created_at ?? null,
            sucursalId:  r.branchId ?? r.sucursal_id ?? null,
            paymentId:   r.paymentId ?? r.payment_id ?? null,
            saleDisplayNumber: r.saleDisplayNumber ?? r.sale_display_number ?? null,
            saleId:      r.saleId ?? r.sale_id ?? null,
            paymentMethod: r.paymentMethod ?? r.payment_method ?? null,
            collectedByDisplayName: r.collectedByDisplayName ?? r.collected_by_display_name ?? null,
            tableNumber: r.tableNumber ?? r.table_number ?? null,
            zoneName:    r.zoneName ?? r.zone_name ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, CashMovementAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, CashMovementAssembler.toEntityFromResource);
    }

    static toResourceFromEntity(entity, { branchId, employeeId }) {
        return {
            branchId,
            sessionId:        entity.sessionId,
            employeeId,
            movementType:     TYPE_WEB_TO_API[entity.type] ?? entity.type?.toUpperCase(),
            amount:           entity.amount,
            movementCategory: _categoryToApi(entity.category),
            description:      entity.description,
            paymentId:        entity.paymentId ?? undefined,
        };
    }
}
