import { CashRegisterSession, SESSION_STATUS } from '../../domain/models/cash-register-session.entity.js';
import { entitiesFromResponse, entityFromResponse } from '../../../shared/infrustructure/api-response.js';

const SHIFT_LABEL_TO_API = {
    'Mañana':   'MORNING',
    'Tarde':    'AFTERNOON',
    'Noche':    'NIGHT',
    'Completo': 'COMPLETE',
};

const SHIFT_API_TO_LABEL = {
    MORNING:  'Mañana',
    AFTERNOON: 'Tarde',
    NIGHT:    'Noche',
    COMPLETE: 'Completo',
};

function _normalizeStatus(status) {
    if (!status) return SESSION_STATUS.OPEN;
    const s = String(status).toLowerCase();
    return s === 'closed' || s === 'cerrado' ? SESSION_STATUS.CLOSED : SESSION_STATUS.OPEN;
}

function _shiftFromApi(shift) {
    if (!shift) return '';
    return SHIFT_API_TO_LABEL[shift] ?? shift;
}

function _shiftToApi(shift) {
    if (!shift) return 'MORNING';
    return SHIFT_LABEL_TO_API[shift] ?? shift;
}

/**
 * CashRegister Infrastructure - CashRegisterSession Assembler
 */
export class CashRegisterSessionAssembler {

    static toEntityFromResource(resource) {
        const r = resource ?? {};
        return new CashRegisterSession({
            id:              r.sessionId ?? r.id ?? null,
            shiftName:       _shiftFromApi(r.sessionShiftName ?? r.shiftName ?? r.shift_name ?? ''),
            openedAt:        r.sessionsOpenedAt ?? r.openedAt ?? r.opened_at ?? null,
            closedAt:        r.sessionsClosedAt ?? r.closedAt ?? r.closed_at ?? null,
            openedBy:        r.sessionOpenedBy ?? r.openedBy ?? r.opened_by ?? null,
            closedBy:        r.sessionClosedBy ?? r.closedBy ?? r.closed_by ?? null,
            openedByUserId:  r.sessionOpenedByUserId ?? r.openedByUserId ?? r.opened_by_user_id ?? null,
            closedByUserId:  r.sessionClosedByUserId ?? r.closedByUserId ?? r.closed_by_user_id ?? null,
            initialAmount:   r.sessionInitialAmount ?? r.initialAmount ?? r.initial_amount ?? 0,
            finalAmount:     r.sessionFinalAmount ?? r.finalAmount ?? r.final_amount ?? null,
            status:          _normalizeStatus(r.sessionStatus ?? r.status),
            sucursalId:      r.branchId ?? r.sucursalId ?? r.sucursal_id ?? null,
            notes:           r.sessionNote ?? r.notes ?? '',
            totalSales:      r.sessionTotalSales ?? r.totalSales ?? r.total_sales ?? 0,
            totalRevenue:    r.sessionTotalRevenue ?? r.totalRevenue ?? r.total_revenue ?? 0,
            cashRevenue:     r.sessionCashRevenue ?? r.cashRevenue ?? r.cash_revenue ?? 0,
            digitalRevenue:  r.sessionDigitalRevenue ?? r.digitalRevenue ?? r.digital_revenue ?? 0,
            expectedCash:    r.sessionExpectedCash ?? r.expectedCash ?? r.expected_cash ?? 0,
            countedAmount:   r.sessionCountedAmount ?? r.countedAmount ?? r.counted_amount ?? null,
            difference:      r.sessionDifference ?? r.difference ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        return entitiesFromResponse(response, CashRegisterSessionAssembler.toEntityFromResource);
    }

    static toEntityFromResponse(response) {
        return entityFromResponse(response, CashRegisterSessionAssembler.toEntityFromResource);
    }

    /**
     * @param {{ shiftName: string, initialAmount: number, notes?: string, openedBy: string, branchId: string }} params
     */
    static toOpenResource({ shiftName, initialAmount, notes = '', openedBy, branchId }) {
        return {
            branchId,
            sessionOpenedBy:     openedBy,
            sessionInitialAmount: initialAmount,
            sessionShiftName:    _shiftToApi(shiftName),
            sessionNote:         notes || null,
        };
    }

    /**
     * @param {CashRegisterSession} session
     * @param {{ branchId: string, closedBy?: string, countedAmount: number, notes?: string }} summary
     */
    static toCloseResource(session, summary) {
        return {
            sessionId:            session.id,
            branchId:             summary.branchId,
            sessionClosedBy:      summary.closedBy ?? null,
            sessionCountedAmount: summary.countedAmount,
            sessionNote:          summary.notes ?? null,
        };
    }
}
