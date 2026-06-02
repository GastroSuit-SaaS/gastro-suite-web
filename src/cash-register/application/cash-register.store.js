import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CashRegisterApi } from '../infrastructure/api/cash-register.api.js';
import { CashMovementAssembler } from '../infrastructure/assemblers/cash-movement.assembler.js';
import { CashRegisterSessionAssembler } from '../infrastructure/assemblers/cash-register-session.assembler.js';
import { CashRegisterSession, SESSION_STATUS } from '../domain/models/cash-register-session.entity.js';
import { CashMovement, MOVEMENT_TYPE, MOVEMENT_CATEGORY } from '../domain/models/cash-movement.entity.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage, getApiErrorCode } from '../../shared/infrustructure/api-error.js';
import { useIamStore } from '../../iam/application/iam.store.js';
import { movementMethodKey } from '../presentation/utils/cash-movement-display.js';

const api = new CashRegisterApi();

export const useCashRegisterStore = defineStore('cash-register', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const sessions         = ref([]);
    const currentSession   = ref(null);
    const movements        = ref([]);
    const selectedMovement = ref(null);
    const isLoading        = ref(false);
    const error            = ref(null);
    /** { code, message } cuando falla cierre de turno (p. ej. CRG_002) */
    const closeSessionError = ref(null);
    /** Cobros por empleado en el turno actual */
    const collectorSummary  = ref([]);

    // ── Getters ───────────────────────────────────────────────────────────

    /** ¿Hay un turno abierto en la sucursal activa? */
    const hasOpenSession = computed(() => currentSession.value?.isOpen === true);

    /** Movimientos del turno actual */
    const currentSessionMovements = computed(() => {
        if (!currentSession.value) return [];
        return movements.value.filter(m => m.sessionId === currentSession.value.id);
    });

    /** Ingresos del turno actual (todos, incluyendo digitales) */
    const sessionIncome = computed(() =>
        currentSessionMovements.value
            .filter(m => m.type === MOVEMENT_TYPE.INCOME)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Egresos del turno actual */
    const sessionExpense = computed(() =>
        currentSessionMovements.value
            .filter(m => m.type === MOVEMENT_TYPE.EXPENSE)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Balance del turno actual */
    const sessionBalance = computed(() => sessionIncome.value - sessionExpense.value);

    /** Ingresos del turno actual solo en EFECTIVO FÍSICO (excluye venta_digital y fondo inicial duplicado) */
    const sessionCashIncome = computed(() =>
        currentSessionMovements.value
            .filter(m =>
                m.type === MOVEMENT_TYPE.INCOME
                && m.isCashPhysical
                && m.category !== MOVEMENT_CATEGORY.APERTURA,
            )
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Ingresos digitales del turno actual */
    const sessionDigitalIncome = computed(() =>
        currentSessionMovements.value
            .filter(m => m.category === MOVEMENT_CATEGORY.VENTA_DIGITAL)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Egresos solo en efectivo del turno actual */
    const sessionCashExpense = computed(() =>
        currentSessionMovements.value
            .filter(m => m.type === MOVEMENT_TYPE.EXPENSE && m.isCashPhysical)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Efectivo esperado en gaveta = inicial + ingresos cash - egresos cash */
    const sessionExpectedCash = computed(() => {
        if (!currentSession.value) return 0;
        return currentSession.value.initialAmount + sessionCashIncome.value - sessionCashExpense.value;
    });

    /** Ventas cobradas en efectivo (categoría venta, sin fondo inicial) */
    const sessionCashSalesRevenue = computed(() =>
        currentSessionMovements.value
            .filter(m => m.category === MOVEMENT_CATEGORY.VENTA && m.type === MOVEMENT_TYPE.INCOME)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Propinas registradas en el turno */
    const sessionTipsIncome = computed(() =>
        currentSessionMovements.value
            .filter(m => m.category === MOVEMENT_CATEGORY.PROPIA && m.type === MOVEMENT_TYPE.INCOME)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Reembolsos en efectivo del turno */
    const sessionRefundsExpense = computed(() =>
        currentSessionMovements.value
            .filter(m => m.category === MOVEMENT_CATEGORY.REEMBOLSO && m.type === MOVEMENT_TYPE.EXPENSE)
            .reduce((s, m) => s + m.amount, 0),
    );

    /** Órdenes únicas cobradas (venta + digital; propina no duplica orden) */
    const sessionSalesCount = computed(() => {
        const keys = new Set();
        for (const m of currentSessionMovements.value) {
            if (m.category !== MOVEMENT_CATEGORY.VENTA && m.category !== MOVEMENT_CATEGORY.VENTA_DIGITAL) {
                continue;
            }
            if (m.saleDisplayNumber != null && m.saleDisplayNumber !== '') {
                keys.add(`order:${m.saleDisplayNumber}`);
            } else if (m.paymentId) {
                keys.add(`pay:${m.paymentId}`);
            } else {
                keys.add(`mov:${m.id}`);
            }
        }
        return keys.size;
    });

    /** Total vendido en turno (efectivo + digital, sin propinas) */
    const sessionTotalSalesRevenue = computed(() =>
        sessionCashSalesRevenue.value + sessionDigitalIncome.value,
    );

    /** Ventas digitales desglosadas por método de pago */
    const sessionSalesByMethod = computed(() => {
        const totals = { card: 0, yape: 0, plin: 0 };
        for (const m of currentSessionMovements.value) {
            if (m.category !== MOVEMENT_CATEGORY.VENTA_DIGITAL) continue;
            const key = movementMethodKey(m);
            if (key in totals) totals[key] += m.amount;
        }
        return totals;
    });

    /** Totales globales de todos los movimientos cargados */
    const totalIncome  = computed(() => movements.value.filter(m => m.type === MOVEMENT_TYPE.INCOME).reduce((s, m) => s + m.amount, 0));
    const totalExpense = computed(() => movements.value.filter(m => m.type === MOVEMENT_TYPE.EXPENSE).reduce((s, m) => s + m.amount, 0));
    const balance      = computed(() => totalIncome.value - totalExpense.value);

    /** Historial de sesiones cerradas */
    const closedSessions = computed(() => sessions.value.filter(s => s.isClosed));

    // ── Helpers ────────────────────────────────────────────────────────────
    function _iamStore() { return useIamStore(); }

    function _currentUserId()       { return _iamStore().currentUser?.id ?? null; }
    function _currentEmployeeId()   { return _iamStore().currentUser?.employeeId ?? null; }
    function _currentUserName()     { return _iamStore().currentUser?.fullName ?? 'Usuario'; }
    function _branchId() {
        return _iamStore().activeBranchId ?? requireActiveBranchId();
    }

    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = _branchId();
            const [sessionsResponse, movResponse] = await Promise.all([
                api.listSessionsByBranch(branchId),
                api.listMovementsByBranch(branchId),
            ]);
            sessions.value = CashRegisterSessionAssembler.toEntitiesFromResponse(sessionsResponse);
            movements.value = CashMovementAssembler.toEntitiesFromResponse(movResponse);
            await refreshOpenSession({ skipMovements: true });
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar datos de caja');
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Sincroniza el turno OPEN central (endpoint dedicado).
     * @param {{ skipMovements?: boolean }} [options]
     */
    async function refreshOpenSession(options = {}) {
        const branchId = _branchId();
        try {
            const response = await api.getOpenSessionByBranch(branchId);
            const open = CashRegisterSessionAssembler.toEntityFromResponse(response);
            if (open?.isOpen) {
                currentSession.value = open;
                const idx = sessions.value.findIndex((s) => s.id === open.id);
                if (idx >= 0) sessions.value[idx] = open;
                else sessions.value = [open, ...sessions.value];
                await fetchCollectorSummary(open.id);
            } else {
                currentSession.value = null;
                collectorSummary.value = [];
            }
        } catch (e) {
            const code = getApiErrorCode(e);
            if (code === 'CRG_001') {
                currentSession.value = null;
                collectorSummary.value = [];
            }
        }

        if (!options.skipMovements && currentSession.value) {
            try {
                const movResponse = await api.listMovementsByBranch(branchId);
                movements.value = CashMovementAssembler.toEntitiesFromResponse(movResponse);
            } catch {
                /* movimientos se refrescan en fetchAll */
            }
        }
    }

    async function handleOperationalEvent(event) {
        if (!event?.type) return;
        if (event.type.startsWith('cash.session')) {
            await refreshOpenSession();
            return;
        }
        if (event.type === 'cash.movement.created') {
            if (currentSession.value) {
                try {
                    const movResponse = await api.listMovementsByBranch(_branchId());
                    movements.value = CashMovementAssembler.toEntitiesFromResponse(movResponse);
                } catch { /* ok */ }
            }
        }
    }

    async function fetchCollectorSummary(sessionId = currentSession.value?.id) {
        if (!sessionId) {
            collectorSummary.value = [];
            return;
        }
        try {
            const response = await api.getCollectorSummary(sessionId);
            const rows = response?.data;
            collectorSummary.value = Array.isArray(rows) ? rows : [];
        } catch {
            collectorSummary.value = [];
        }
    }

    /**
     * Abre un nuevo turno de caja.
     * @param {{ initialAmount: number, shiftName?: string, notes?: string }} data
     */
    async function openSession({ initialAmount, shiftName = '', notes = '' }) {
        if (hasOpenSession.value) {
            error.value = 'Ya existe un turno de caja abierto. Ciérralo antes de abrir uno nuevo.';
            return false;
        }

        isLoading.value = true;
        error.value = null;
        try {
            const branchId = _branchId();
            const response = await api.openSession(CashRegisterSessionAssembler.toOpenResource({
                shiftName,
                initialAmount,
                notes,
                openedBy: _currentUserName(),
                branchId,
            }));

            const saved = CashRegisterSessionAssembler.toEntityFromResponse(response);
            sessions.value = [saved, ...sessions.value.filter((s) => s.id !== saved.id)];
            currentSession.value = saved;
            await fetchCollectorSummary(saved.id);
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al abrir turno de caja');
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Cierra el turno de caja actual con resumen de ventas y rendición de caja.
     *
     * @param {{ countedAmount: number, notes?: string }} options
     */
    async function closeSession({ countedAmount, notes = '' } = {}) {
        if (!hasOpenSession.value) {
            error.value = 'No hay turno de caja abierto para cerrar.';
            return false;
        }

        isLoading.value = true;
        error.value = null;
        closeSessionError.value = null;
        try {
            const session = currentSession.value;
            const counted = parseFloat(countedAmount) || 0;
            const branchId = _branchId();

            const closePayload = CashRegisterSessionAssembler.toCloseResource(session, {
                branchId,
                closedBy: _currentUserName(),
                countedAmount: counted,
                notes,
            });
            const response = await api.closeSession(closePayload);
            const closed = CashRegisterSessionAssembler.toEntityFromResponse(response) ?? session;

            Object.assign(session, {
                closedAt:       closed.closedAt ?? new Date().toISOString(),
                closedBy:       closed.closedBy ?? _currentUserName(),
                closedByUserId: closed.closedByUserId ?? session.closedByUserId,
                finalAmount:    closed.finalAmount ?? closed.countedAmount ?? counted,
                status:         SESSION_STATUS.CLOSED,
                notes:          closed.notes ?? notes ?? session.notes,
                totalSales:     closed.totalSales ?? session.totalSales,
                totalRevenue:   closed.totalRevenue ?? session.totalRevenue,
                cashRevenue:    closed.cashRevenue ?? session.cashRevenue,
                digitalRevenue: closed.digitalRevenue ?? session.digitalRevenue,
                expectedCash:   closed.expectedCash ?? session.expectedCash,
                countedAmount:  closed.countedAmount ?? counted,
                difference:     closed.difference ?? session.difference,
            });

            const idx = sessions.value.findIndex((s) => s.id === session.id);
            if (idx >= 0) sessions.value[idx] = session;
            currentSession.value = null;
            return true;
        } catch (e) {
            const code = getApiErrorCode(e);
            const message = getApiErrorMessage(e, 'Error al cerrar turno de caja');
            closeSessionError.value = { code, message };
            error.value = message;
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    // ── Actions: Movements ────────────────────────────────────────────────

    /**
     * Registra un movimiento de efectivo en el turno actual.
     * @param {{ type: string, amount: number, description: string, category?: string, paymentId?: string }} data
     */
    async function addMovement({ type, amount, description, category = MOVEMENT_CATEGORY.OTRO, paymentId = null }) {
        if (!hasOpenSession.value) {
            error.value = 'Debes abrir un turno de caja antes de registrar movimientos.';
            return false;
        }

        let employeeId = _currentEmployeeId();
        if (!employeeId) {
            const link = await _iamStore().ensureEmployeeLink();
            employeeId = _currentEmployeeId();
            if (!employeeId) {
                error.value = link.ok
                    ? 'Tu usuario no está vinculado a un empleado. Contacta al administrador.'
                    : (_iamStore().employeeLinkMessage
                        ?? 'Tu usuario no está vinculado a un empleado. Contacta al administrador.');
                return false;
            }
        }

        isLoading.value = true;
        error.value = null;
        try {
            const branchId = _branchId();
            const movement = new CashMovement({
                type,
                amount:      parseFloat(amount),
                description,
                sessionId:   currentSession.value.id,
                registerId:  currentSession.value.id,
                userId:      employeeId,
                userName:    _currentUserName(),
                category,
                sucursalId:  branchId,
                paymentId,
            });

            const response = await api.createMovement(
                CashMovementAssembler.toResourceFromEntity(movement, { branchId, employeeId }),
            );
            const saved = CashMovementAssembler.toEntityFromResponse(response);
            movements.value.unshift(saved);
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al registrar movimiento');
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        try {
            await api.deleteMovement(id);
            movements.value = movements.value.filter(m => m.id !== id);
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al eliminar movimiento';
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Obtiene los movimientos de una sesión específica (para historial).
     * @param {string} sessionId
     * @returns {CashMovement[]}
     */
    function getMovementsBySession(sessionId) {
        return movements.value.filter(m => m.sessionId === sessionId);
    }

    return {
        // State
        sessions, currentSession, movements, selectedMovement, isLoading, error,
        collectorSummary,
        // Getters
        hasOpenSession, currentSessionMovements,
        sessionIncome, sessionExpense, sessionBalance,
        sessionCashIncome, sessionDigitalIncome, sessionCashExpense, sessionExpectedCash,
        sessionCashSalesRevenue, sessionTipsIncome, sessionRefundsExpense, sessionTotalSalesRevenue,
        sessionSalesCount, sessionSalesByMethod,
        totalIncome, totalExpense, balance,
        closedSessions,
        // Actions — Sessions
        fetchAll, refreshOpenSession, fetchCollectorSummary, openSession, closeSession, closeSessionError, handleOperationalEvent,
        // Actions — Movements
        addMovement, remove, getMovementsBySession,
    };
});
