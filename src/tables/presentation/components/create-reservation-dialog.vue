<script setup>
import { reactive, computed, watch } from 'vue'
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue'
import { TABLE_STATUS } from '../../domain/models/table.entity.js'

const props = defineProps({
    visible: { type: Boolean, default: false },
    tables:  { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:visible', 'saved'])

function defaultTime() {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const form = reactive({
    guestName: '',
    guestPhone: '',
    partySize: 2,
    reservedDate: new Date(),
    reservedTime: defaultTime(),
    tableId: null,
    notes: '',
})

const availableTables = computed(() =>
    props.tables.filter(t => t.status === TABLE_STATUS.AVAILABLE),
)

const tableSelectOptions = computed(() =>
    availableTables.value.map(t => ({
        label: `Mesa ${t.number}${t.zone ? ` · ${t.zone}` : ''}`,
        value: t.id,
    })),
)

const selectedTableLabel = computed(() => {
    if (!form.tableId) return null
    return tableSelectOptions.value.find(o => o.value === form.tableId)?.label ?? null
})

const schedulePreview = computed(() => {
    try {
        const d = form.reservedDate instanceof Date
            ? new Date(form.reservedDate)
            : new Date(form.reservedDate)
        const parts = String(form.reservedTime ?? '12:00').split(':')
        d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0, 0, 0)
        if (Number.isNaN(d.getTime())) return ''
        return d.toLocaleString('es-PE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return ''
    }
})

function resetForm() {
    form.guestName = ''
    form.guestPhone = ''
    form.partySize = 2
    form.reservedDate = new Date()
    form.reservedTime = defaultTime()
    form.tableId = null
    form.notes = ''
}

watch(() => props.visible, (open) => {
    if (open) resetForm()
})

function buildReservedAt() {
    const d = form.reservedDate instanceof Date
        ? new Date(form.reservedDate)
        : new Date(form.reservedDate)
    const parts = String(form.reservedTime ?? '12:00').split(':')
    const hh = parseInt(parts[0], 10)
    const mm = parseInt(parts[1], 10)
    d.setHours(Number.isNaN(hh) ? 12 : hh, Number.isNaN(mm) ? 0 : mm, 0, 0)
    return d
}

function onCancel() {
    emit('update:visible', false)
}

function onSave() {
    emit('saved', {
        guestName: String(form.guestName ?? '').trim(),
        guestPhone: String(form.guestPhone ?? '').trim(),
        partySize: form.partySize,
        reservedAt: buildReservedAt(),
        tableId: form.tableId,
        notes: form.notes,
    })
}
</script>

<template>
    <CreateAndEdit
        :visible="visible"
        size="standard"
        entity-name="Reserva"
        dialog-class="ce-dialog--reservation"
        header-title-override="Nueva reserva"
        custom-button-label="Guardar reserva"
        @canceled-shared="onCancel"
        @saved-shared="onSave"
    >
        <template #content>
            <div class="res-form">
                <p class="res-form__intro">
                    Registra la reserva del comensal. Los campos con
                    <span class="res-form__required">*</span> son obligatorios.
                </p>

                <!-- Comensal -->
                <section class="res-form__section">
                    <h3 class="res-form__section-title">
                        <i class="pi pi-user" aria-hidden="true"></i>
                        Comensal
                    </h3>
                    <div class="res-form__grid res-form__grid--2">
                        <div class="res-field">
                            <label class="res-field__label" for="res-guest-name">
                                Nombre <span class="res-form__required">*</span>
                            </label>
                            <pv-input-text
                                id="res-guest-name"
                                v-model="form.guestName"
                                placeholder="Nombre del comensal"
                                class="w-full"
                            />
                        </div>
                        <div class="res-field">
                            <label class="res-field__label" for="res-guest-phone">Teléfono</label>
                            <pv-input-text
                                id="res-guest-phone"
                                v-model="form.guestPhone"
                                placeholder="Opcional"
                                class="w-full"
                            />
                        </div>
                        <div class="res-field res-field--span-2">
                            <label class="res-field__label" for="res-party-size">
                                Comensales <span class="res-form__required">*</span>
                            </label>
                            <pv-input-number
                                id="res-party-size"
                                v-model="form.partySize"
                                :min="1"
                                :max="99"
                                :use-grouping="false"
                                show-buttons
                                button-layout="horizontal"
                                increment-button-icon="pi pi-plus"
                                decrement-button-icon="pi pi-minus"
                                class="w-full res-field__pax"
                            />
                        </div>
                    </div>
                </section>

                <!-- Fecha y hora -->
                <section class="res-form__section">
                    <h3 class="res-form__section-title">
                        <i class="pi pi-calendar" aria-hidden="true"></i>
                        Fecha y hora
                    </h3>
                    <div class="res-schedule-card">
                        <div class="res-form__grid res-form__grid--2">
                            <div class="res-field">
                                <label class="res-field__label" for="res-date">
                                    Fecha <span class="res-form__required">*</span>
                                </label>
                                <pv-calendar
                                    id="res-date"
                                    v-model="form.reservedDate"
                                    date-format="dd/mm/yy"
                                    show-icon
                                    icon-display="input"
                                    append-to="body"
                                    class="w-full"
                                />
                            </div>
                            <div class="res-field">
                                <label class="res-field__label" for="res-time">
                                    Hora <span class="res-form__required">*</span>
                                </label>
                                <div class="res-field__time-wrap">
                                    <i class="pi pi-clock res-field__time-icon" aria-hidden="true"></i>
                                    <input
                                        id="res-time"
                                        v-model="form.reservedTime"
                                        type="time"
                                        class="res-field__time"
                                    />
                                </div>
                            </div>
                        </div>
                        <div v-if="schedulePreview" class="res-schedule-preview">
                            <i class="pi pi-info-circle" aria-hidden="true"></i>
                            <span>{{ schedulePreview }}</span>
                        </div>
                    </div>
                </section>

                <!-- Mesa y notas -->
                <section class="res-form__section res-form__section--last">
                    <h3 class="res-form__section-title">
                        <i class="pi pi-table" aria-hidden="true"></i>
                        Mesa y detalles
                    </h3>
                    <div class="res-form__grid">
                        <div class="res-field">
                            <label class="res-field__label" for="res-table">
                                Mesa
                                <span class="res-field__optional">opcional</span>
                            </label>
                            <pv-select
                                id="res-table"
                                v-model="form.tableId"
                                :options="tableSelectOptions"
                                option-label="label"
                                option-value="value"
                                placeholder="Sin mesa asignada"
                                show-clear
                                filter
                                filter-placeholder="Buscar mesa…"
                                class="w-full"
                            />
                            <small v-if="selectedTableLabel" class="res-field__hint">
                                La mesa quedará en estado reservada.
                            </small>
                            <small v-else-if="availableTables.length === 0" class="res-field__hint res-field__hint--warn">
                                No hay mesas disponibles en este momento.
                            </small>
                        </div>
                        <div class="res-field">
                            <label class="res-field__label" for="res-notes">Notas</label>
                            <pv-textarea
                                id="res-notes"
                                v-model="form.notes"
                                :rows="3"
                                placeholder="Alergias, celebración, preferencia de zona…"
                                class="w-full"
                                auto-resize
                            />
                        </div>
                    </div>
                </section>
            </div>
        </template>
    </CreateAndEdit>
</template>

<style scoped>
.res-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-top: 0.25rem;
}

.res-form__intro {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #6b7280;
}

.res-form__required {
    color: #dc2626;
    font-weight: 600;
}

.res-form__section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.res-form__section--last {
    padding-bottom: 0.15rem;
}

.res-form__section-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
}

.res-form__section-title .pi {
    font-size: 0.8rem;
    color: #94a3b8;
}

.res-form__grid {
    display: grid;
    gap: 0.85rem 1rem;
}

.res-form__grid--2 {
    grid-template-columns: 1fr 1fr;
}

@media (max-width: 520px) {
    .res-form__grid--2 {
        grid-template-columns: 1fr;
    }

    .res-field--span-2 {
        grid-column: auto;
    }
}

.res-field--span-2 {
    grid-column: 1 / -1;
}

.res-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
}

.res-field__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #374151;
}

.res-field__optional {
    margin-left: 0.25rem;
    font-weight: 500;
    font-size: 0.75rem;
    color: #9ca3af;
    text-transform: none;
    letter-spacing: 0;
}

.res-field__hint {
    font-size: 0.75rem;
    color: #6b7280;
    line-height: 1.35;
}

.res-field__hint--warn {
    color: #b45309;
}

/* Tarjeta fecha/hora */
.res-schedule-card {
    padding: 0.85rem 1rem;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}

.res-schedule-preview {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #4f46e5;
}

.res-schedule-preview .pi {
    font-size: 0.85rem;
    flex-shrink: 0;
}

/* Hora alineada con inputs PrimeVue */
.res-field__time-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.res-field__time-icon {
    position: absolute;
    left: 0.75rem;
    font-size: 0.9rem;
    color: #9ca3af;
    pointer-events: none;
    z-index: 1;
}

.res-field__time {
    width: 100%;
    height: 2.5rem;
    padding: 0 0.75rem 0 2.35rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    color: #111827;
    background: #fff;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
}

.res-field__time:hover {
    border-color: #9ca3af;
}

.res-field__time:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(26, 107, 194, 0.2);
}

.res-field__pax :deep(.p-inputnumber-input) {
    text-align: center;
}
</style>

<!-- Estilos del shell del diálogo (clase en CreateAndEdit) -->
<style>
.ce-dialog--reservation .p-dialog-content {
    padding: 1rem 1.35rem 1.15rem !important;
    max-height: min(85vh, 640px);
    overflow-y: auto;
}

.ce-dialog--reservation .p-dialog-footer .p-button:last-child {
    min-width: 8.5rem;
}
</style>
