import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ReservationsApi } from '../infrastructure/api/reservations.api.js';
import { ReservationAssembler } from '../infrastructure/assemblers/reservation.assembler.js';
import { Reservation } from '../domain/models/reservation.entity.js';
import { requireActiveBranchId } from '../../shared/application/tenant-context.js';
import { getApiErrorMessage } from '../../shared/infrustructure/api-error.js';
import { useTablesStore } from './tables.store.js';

const api = new ReservationsApi();

export const useReservationsStore = defineStore('reservations', () => {
    const reservations = ref([]);
    const selectedDate = ref(new Date().toISOString().slice(0, 10));
    const isLoading = ref(false);
    const error = ref(null);

    const activeReservations = computed(() =>
        reservations.value.filter(r => r.isActive),
    );

    async function fetchByDate(date = selectedDate.value) {
        isLoading.value = true;
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const response = await api.listByBranch(branchId, date);
            reservations.value = ReservationAssembler.toEntitiesFromResponse(response);
            selectedDate.value = date;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'Error al cargar reservas');
        } finally {
            isLoading.value = false;
        }
    }

    async function create(payload) {
        error.value = null;
        try {
            const branchId = requireActiveBranchId();
            const entity = new Reservation({ ...payload, branchId });
            const response = await api.create(branchId, ReservationAssembler.toCreateBody(entity));
            const saved = ReservationAssembler.toEntityFromResponse(response);
            if (saved) {
                const exists = reservations.value.some(r => r.id === saved.id);
                if (!exists) reservations.value.push(saved);
            }
            const tablesStore = useTablesStore();
            await tablesStore.fetchAll();
            return saved;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo crear la reserva');
            return null;
        }
    }

    async function cancel(reservationId) {
        error.value = null;
        try {
            await api.cancel(reservationId);
            const tablesStore = useTablesStore();
            await tablesStore.fetchAll();
            await fetchByDate();
            return true;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo cancelar la reserva');
            return false;
        }
    }

    async function checkIn(reservationId, seatedGuests) {
        error.value = null;
        try {
            const response = await api.checkIn(
                reservationId,
                seatedGuests != null ? { seatedGuests } : {},
            );
            const tableId = ReservationAssembler.tableIdFromCheckInResponse(response);
            const tablesStore = useTablesStore();
            await tablesStore.fetchAll();
            await fetchByDate();
            return tableId ?? null;
        } catch (e) {
            error.value = getApiErrorMessage(e, 'No se pudo registrar el check-in');
            return null;
        }
    }

    async function fetchByDateSilent(date = selectedDate.value) {
        try {
            const branchId = requireActiveBranchId();
            const response = await api.listByBranch(branchId, date);
            reservations.value = ReservationAssembler.toEntitiesFromResponse(response);
            selectedDate.value = date;
        } catch { /* mantener */ }
    }

    async function handleOperationalEvent(event) {
        if (!event?.type?.startsWith('reservation.')) return;
        await fetchByDateSilent();
        const tablesStore = useTablesStore();
        await tablesStore.fetchAllSilent?.() ?? tablesStore.fetchAll();
    }

    return {
        reservations,
        selectedDate,
        isLoading,
        error,
        activeReservations,
        fetchByDate,
        fetchByDateSilent,
        create,
        cancel,
        checkIn,
        handleOperationalEvent,
    };
});
