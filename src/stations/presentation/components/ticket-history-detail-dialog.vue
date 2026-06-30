<script setup>
import { computed } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import { useStationsStore } from '../../application/stations.store.js'
import { TICKET_STATUS_CONFIG } from '../constants/stations.constants-ui.js'

const store = useStationsStore()
const { ticketDisplayRef, ticketOrderRef, ticketTableLabel, formatHistoryDateTime } = store

const visible = defineModel('visible', { type: Boolean, default: false })

const props = defineProps({
    ticket: { type: Object, default: null },
})

const statusCfg = computed(() =>
    props.ticket?.status ? (TICKET_STATUS_CONFIG[props.ticket.status] ?? null) : null,
)

const dialogTitle = computed(() =>
    props.ticket ? `Comanda ${ticketDisplayRef(props.ticket)}` : 'Detalle de comanda',
)

const timeline = computed(() => {
    const t = props.ticket
    if (!t) return []
    const rows = [
        { key: 'created', label: 'Recibido en cocina', at: t.createdAt, icon: 'pi-inbox' },
        { key: 'started', label: 'Preparación iniciada', at: t.startedAt, icon: 'pi-clock' },
        { key: 'ready', label: 'Marcado listo', at: t.readyAt, icon: 'pi-check-circle' },
        { key: 'delivered', label: 'Entregado', at: t.deliveredAt, icon: 'pi-user' },
        { key: 'cancelled', label: 'Cancelado', at: t.cancelledAt, icon: 'pi-times-circle' },
    ]
    return rows.filter(r => r.at)
})

function close() {
    visible.value = false
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        :entity="ticket"
        entity-name="comanda"
        :header-title-override="dialogTitle"
        view-only
        size="standard"
        @canceled-shared="close"
    >
        <template #content>
            <div v-if="ticket" class="ticket-detail">
                <p class="ticket-detail__intro">
                    Una <strong>comanda</strong> es el ticket enviado a una estación de preparación
                    (cocina, bar, etc.) con los ítems a elaborar. El código
                    <strong>{{ ticketDisplayRef(ticket) }}</strong> identifica el envío
                    (orden del día + ronda, ej. 2-3).
                </p>

                <div class="ticket-detail__header">
                    <span
                        class="ticket-detail__status"
                        :style="{
                            color: statusCfg?.color ?? '#6b7280',
                            background: statusCfg?.bg ?? '#f3f4f6',
                            borderColor: statusCfg?.color ?? '#d1d5db',
                        }"
                    >
                        <i :class="['pi', statusCfg?.icon ?? 'pi-circle']"></i>
                        {{ statusCfg?.label ?? ticket.status }}
                    </span>
                    <div class="ticket-detail__meta">
                        <span><i class="pi pi-hashtag"></i> {{ ticketOrderRef(ticket) }}</span>
                        <span><i class="pi pi-th-large"></i> {{ ticketTableLabel(ticket) }}</span>
                        <span><i class="pi pi-map-marker"></i> {{ ticket.stationName || '—' }}</span>
                    </div>
                </div>

                <section class="ticket-detail__section">
                    <h4 class="ticket-detail__section-title">Ítems atendidos</h4>
                    <ul class="ticket-detail__items">
                        <li v-for="(item, idx) in ticket.items" :key="idx" class="ticket-detail__item">
                            <span class="ticket-detail__qty">{{ item.quantity }}×</span>
                            <div class="ticket-detail__item-body">
                                <span class="ticket-detail__item-name">{{ item.menuItemName }}</span>
                                <span v-if="item.note" class="ticket-detail__item-note">
                                    <i class="pi pi-comment"></i> {{ item.note }}
                                </span>
                            </div>
                        </li>
                    </ul>
                </section>

                <section v-if="timeline.length" class="ticket-detail__section">
                    <h4 class="ticket-detail__section-title">Línea de tiempo</h4>
                    <ul class="ticket-detail__timeline">
                        <li v-for="step in timeline" :key="step.key" class="ticket-detail__timeline-step">
                            <i :class="['pi', step.icon]"></i>
                            <div>
                                <span class="ticket-detail__timeline-label">{{ step.label }}</span>
                                <span class="ticket-detail__timeline-time">{{ formatHistoryDateTime(step.at) }}</span>
                            </div>
                        </li>
                    </ul>
                </section>

                <p v-if="ticket.cancelReason" class="ticket-detail__cancel">
                    <i class="pi pi-info-circle"></i>
                    Motivo: {{ ticket.cancelReason }}
                </p>
            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.ticket-detail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.ticket-detail__intro {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    color: #4b5563;
    padding: 0.55rem 0.7rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.ticket-detail__header {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
}

.ticket-detail__status {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    align-self: flex-start;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    border: 1px solid;
    font-size: 0.8rem;
    font-weight: 600;
}

.ticket-detail__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    font-size: 0.82rem;
    color: #4b5563;
}

.ticket-detail__meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.ticket-detail__section-title {
    margin: 0 0 0.5rem;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #6b7280;
}

.ticket-detail__items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
}

.ticket-detail__item {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.ticket-detail__qty {
    font-weight: 700;
    color: #6366f1;
    min-width: 2rem;
}

.ticket-detail__item-body {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
}

.ticket-detail__item-name {
    font-weight: 600;
    color: #111827;
    font-size: 0.88rem;
}

.ticket-detail__item-note {
    font-size: 0.76rem;
    color: #92400e;
}

.ticket-detail__timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.ticket-detail__timeline-step {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    font-size: 0.82rem;
    color: #374151;
}

.ticket-detail__timeline-step .pi {
    color: #6366f1;
    margin-top: 0.15rem;
}

.ticket-detail__timeline-label {
    display: block;
    font-weight: 600;
}

.ticket-detail__timeline-time {
    display: block;
    font-size: 0.76rem;
    color: #6b7280;
}

.ticket-detail__cancel {
    margin: 0;
    padding: 0.55rem 0.7rem;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    font-size: 0.82rem;
    color: #b91c1c;
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
}
</style>
