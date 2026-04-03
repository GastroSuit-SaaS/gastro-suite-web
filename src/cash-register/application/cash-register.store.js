import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { CashRegisterApi } from '../infrastructure/api/cash-register.api.js';
import { CashMovementAssembler } from '../infrastructure/assemblers/cash-movement.assembler.js';
import { CashRegisterSessionAssembler } from '../infrastructure/assemblers/cash-register-session.assembler.js';
import { CashRegisterSession, SESSION_STATUS } from '../domain/models/cash-register-session.entity.js';
import { CashMovement, MOVEMENT_TYPE, MOVEMENT_CATEGORY } from '../domain/models/cash-movement.entity.js';
import { withMockFallback, withMockMutation } from '../../shared/infrustructure/mock-fallback.js';
import { MOCK_SESSIONS, MOCK_MOVEMENTS } from '../infrastructure/cash-register.mock.js';
import { useIamStore } from '../../iam/application/iam.store.js';

const api = new CashRegisterApi();

export const useCashRegisterStore = defineStore('cash-register', () => {

    // ── State ─────────────────────────────────────────────────────────────
    const sessions         = ref([]);
    const currentSession   = ref(null);
    const movements        = ref([]);
    const selectedMovement = ref(null);
    const isLoading        = ref(false);
    const error            = ref(null);

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

    /** Ingresos del turno actual solo en EFECTIVO FÍSICO (excluye venta_digital) */
    const sessionCashIncome = computed(() =>
        currentSessionMovements.value
            .filter(m => m.type === MOVEMENT_TYPE.INCOME && m.isCashPhysical)
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

    /** Cantidad de ventas (movimientos con categoría venta o venta_digital) */
    const sessionSalesCount = computed(() =>
        currentSessionMovements.value
            .filter(m => m.category === MOVEMENT_CATEGORY.VENTA || m.category === MOVEMENT_CATEGORY.VENTA_DIGITAL)
            .length,
    );

    /** Totales globales de todos los movimientos cargados */
    const totalIncome  = computed(() => movements.value.filter(m => m.type === MOVEMENT_TYPE.INCOME).reduce((s, m) => s + m.amount, 0));
    const totalExpense = computed(() => movements.value.filter(m => m.type === MOVEMENT_TYPE.EXPENSE).reduce((s, m) => s + m.amount, 0));
    const balance      = computed(() => totalIncome.value - totalExpense.value);

    /** Historial de sesiones cerradas */
    const closedSessions = computed(() => sessions.value.filter(s => s.isClosed));

    // ── Helpers ────────────────────────────────────────────────────────────
    function _iamStore() { return useIamStore(); }

    function _currentUserId()   { return _iamStore().currentUser?.id ?? null; }
    function _currentUserName() { return _iamStore().currentUser?.fullName ?? 'Usuario'; }
    function _branchId()        { return _iamStore().activeBranchId ?? localStorage.getItem('gs_branch_id') ?? null; }

    function _mockSessions() {
        const bid = _branchId();
        return bid ? MOCK_SESSIONS.filter(s => s.sucursalId === bid) : [...MOCK_SESSIONS];
    }

    function _mockMovements() {
        const bid = _branchId();
        return bid ? MOCK_MOVEMENTS.filter(m => m.sucursalId === bid) : [...MOCK_MOVEMENTS];
    }

    // ── Actions: Sessions (Turnos) ────────────────────────────────────────

    /**
     * Carga todas las sesiones y movimientos, y detecta el turno abierto.
     */
    async function fetchAll() {
        isLoading.value = true;
        error.value = null;
        try {
            // En mock mode, solo cargar la primera vez; las mutaciones locales son fuente de verdad
            if (import.meta.env.VITE_USE_MOCK === 'true' && sessions.value.length > 0) {
                return;
            }

            // Cargar sesiones
            const sessionsResponse = await withMockFallback(
                () => api.getAllSessions(),
                () => ({ status: 200, data: _mockSessions() }),
            );
            sessions.value = (sessionsResponse.status === 200)
                ? (Array.isArray(sessionsResponse.data)
                    ? sessionsResponse.data.map(r => (r instanceof CashRegisterSession) ? r : CashRegisterSessionAssembler.toEntityFromResource(r))
                    : CashRegisterSessionAssembler.toEntitiesFromResponse(sessionsResponse))
                : [];

            // Detectar turno abierto
            currentSession.value = sessions.value.find(s => s.isOpen) ?? null;

            // Cargar movimientos
            const movResponse = await withMockFallback(
                () => api.getAll(),
                () => ({ status: 200, data: _mockMovements() }),
            );
            movements.value = (movResponse.status === 200)
                ? (Array.isArray(movResponse.data)
                    ? movResponse.data.map(r => (r instanceof CashMovement) ? r : CashMovementAssembler.toEntityFromResource(r))
                    : CashMovementAssembler.toEntitiesFromResponse(movResponse))
                : [];
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cargar datos de caja';
        } finally {
            isLoading.value = false;
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
            const now = new Date().toISOString();

            const newSession = new CashRegisterSession({
                id:            `session-${Date.now()}`,
                shiftName,
                openedAt:      now,
                openedBy:      _currentUserName(),
                initialAmount,
                status:        SESSION_STATUS.OPEN,
                sucursalId:    _branchId(),
                notes,
            });

            // Persist — mock absorbe error
            await withMockMutation(
                () => api.openSession(CashRegisterSessionAssembler.toResourceFromEntity(newSession)),
            );

            // Update local
            sessions.value.unshift(newSession);
            currentSession.value = newSession;

            // Crear movimiento de apertura
            const openingMovement = new CashMovement({
                id:          `mov-${Date.now()}`,
                type:        MOVEMENT_TYPE.INCOME,
                amount:      initialAmount,
                description: 'Fondo de caja inicial',
                sessionId:   newSession.id,
                registerId:  newSession.id,
                userId:      _currentUserId(),
                userName:    _currentUserName(),
                category:    MOVEMENT_CATEGORY.APERTURA,
                createdAt:   now,
                sucursalId:  _branchId(),
            });
            movements.value.unshift(openingMovement);

            return true;
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al abrir turno de caja';
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
        try {
            const session  = currentSession.value;
            const now      = new Date().toISOString();

            // ── Calcular resumen de ventas del turno ──────────────────
            const sessionMoves = movements.value.filter(m => m.sessionId === session.id);

            // Ventas en efectivo (categoría VENTA)
            const cashSales = sessionMoves.filter(m => m.category === MOVEMENT_CATEGORY.VENTA && m.type === MOVEMENT_TYPE.INCOME);
            const cashRev   = cashSales.reduce((s, m) => s + m.amount, 0);

            // Ventas digitales (categoría VENTA_DIGITAL)
            const digitalSales = sessionMoves.filter(m => m.category === MOVEMENT_CATEGORY.VENTA_DIGITAL);
            const digitalRev   = digitalSales.reduce((s, m) => s + m.amount, 0);

            const totalSales   = cashSales.length + digitalSales.length;
            const totalRevenue = cashRev + digitalRev;

            // ── Calcular efectivo esperado en gaveta ──────────────────
            const cashIn  = sessionMoves.filter(m => m.type === MOVEMENT_TYPE.INCOME && m.isCashPhysical).reduce((s, m) => s + m.amount, 0);
            const cashOut = sessionMoves.filter(m => m.type === MOVEMENT_TYPE.EXPENSE && m.isCashPhysical).reduce((s, m) => s + m.amount, 0);
            const expectedCash = session.initialAmount + cashIn - cashOut;

            // ── Rendición: diferencia ─────────────────────────────────
            const counted    = parseFloat(countedAmount) || 0;
            const difference = parseFloat((counted - expectedCash).toFixed(2));
            const finalAmt   = counted;

            // Persist
            await withMockMutation(
                () => api.closeSession(session.id, {
                    final_amount:    finalAmt,
                    notes,
                    total_sales:     totalSales,
                    total_revenue:   totalRevenue,
                    cash_revenue:    cashRev,
                    digital_revenue: digitalRev,
                    expected_cash:   expectedCash,
                    counted_amount:  counted,
                    difference,
                }),
            );

            // Update local
            session.closedAt       = now;
            session.closedBy       = _currentUserName();
            session.finalAmount    = finalAmt;
            session.status         = SESSION_STATUS.CLOSED;
            session.notes          = notes || session.notes;
            session.totalSales     = totalSales;
            session.totalRevenue   = totalRevenue;
            session.cashRevenue    = cashRev;
            session.digitalRevenue = digitalRev;
            session.expectedCash   = expectedCash;
            session.countedAmount  = counted;
            session.difference     = difference;

            currentSession.value = null;
            return true;
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al cerrar turno de caja';
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

        isLoading.value = true;
        error.value = null;
        try {
            const now = new Date().toISOString();

            const movement = new CashMovement({
                id:          `mov-${Date.now()}`,
                type,
                amount:      parseFloat(amount),
                description,
                sessionId:   currentSession.value.id,
                registerId:  currentSession.value.id,
                userId:      _currentUserId(),
                userName:    _currentUserName(),
                category,
                createdAt:   now,
                sucursalId:  _branchId(),
                paymentId,
            });

            await withMockMutation(
                () => api.create(CashMovementAssembler.toResourceFromEntity(movement)),
            );

            movements.value.unshift(movement);
            return true;
        } catch (e) {
            error.value = e?.response?.data?.message ?? 'Error al registrar movimiento';
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * Registra un movimiento por venta (llamado desde POS al confirmar pago).
     * Soporta tanto ventas en efectivo (VENTA) como digitales (VENTA_DIGITAL).
     *
     * @param {{ amount: number, description: string, category: string, paymentId?: string }} data
     */
    function registerSaleMovement({ amount, description, category = MOVEMENT_CATEGORY.VENTA, paymentId = null }) {
        if (!hasOpenSession.value) return;
        return addMovement({
            type:     MOVEMENT_TYPE.INCOME,
            amount,
            description,
            category,
            paymentId,
        });
    }

    /**
     * Registra un egreso por reembolso (llamado desde payments.store al reembolsar un pago).
     * Solo descuenta del efectivo físico si el pago original fue en cash.
     *
     * @param {{ amount: number, description: string, paymentId?: string }} data
     */
    function registerRefundMovement({ amount, description, paymentId = null }) {
        if (!hasOpenSession.value) return;
        return addMovement({
            type:     MOVEMENT_TYPE.EXPENSE,
            amount,
            description,
            category: MOVEMENT_CATEGORY.REEMBOLSO,
            paymentId,
        });
    }

    async function remove(id) {
        isLoading.value = true;
        error.value = null;
        try {
            await withMockMutation(() => api.delete(id));
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
        // Getters
        hasOpenSession, currentSessionMovements,
        sessionIncome, sessionExpense, sessionBalance,
        sessionCashIncome, sessionDigitalIncome, sessionCashExpense, sessionExpectedCash, sessionSalesCount,
        totalIncome, totalExpense, balance,
        closedSessions,
        // Actions — Sessions
        fetchAll, openSession, closeSession,
        // Actions — Movements
        addMovement, registerSaleMovement, registerRefundMovement, remove, getMovementsBySession,
    };
});
