<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast }            from 'primevue/usetoast'
import { usePosStore }         from '../../application/pos.store.js'
import { POS_ROUTES, posPaymentRoute } from '../constants/pos.constants-ui.js'

const route         = useRoute()
const router        = useRouter()
const toast         = useToast()
const posStore      = usePosStore()

const tableId = computed(() => Number(route.params.tableId))
const table   = computed(() => posStore.tableById(tableId.value))
const zone    = computed(() => posStore.zoneById(table.value?.zoneId))
const sale    = computed(() => posStore.currentSale)

// Ítems pendientes de enviar a cocina
const pendingItems = computed(() => sale.value?.items.filter(i => !i.isSent) ?? [])

// ── Nota editable por ítem ───────────────────────────────────────────────────────────────
const editingNoteId     = ref(null)
const noteInput         = ref('')

// ── Descuento editable por ítem
const editingDiscountId   = ref(null)
const discountInput       = ref(0)
const discountType        = ref('pct')  // 'pct' | 'fixed'

// ── Descuento a nivel de orden
const editingOrderDiscount = ref(false)
const orderDiscountInput   = ref(0)
const orderDiscountType    = ref('fixed')

function openOrderDiscount() {
    orderDiscountInput.value   = sale.value?.discount ?? 0
    orderDiscountType.value    = 'fixed'
    editingOrderDiscount.value = true
}
function commitOrderDiscount() {
    posStore.updateOrderDiscount(orderDiscountType.value, orderDiscountInput.value)
    editingOrderDiscount.value = false
}
function cancelOrderDiscount() {
    editingOrderDiscount.value = false
}
function clearOrderDiscount() {
    posStore.clearOrderDiscount()
    editingOrderDiscount.value = false
}

onMounted(() => {
    if (!posStore.currentSale) router.replace(POS_ROUTES.SELECT_ZONE)
})

// ── Catálogo ───────────────────────────────────────────────────────────────
function selectCategory(catId) {
    // null = "Todos"
    posStore.setCatalogCategory(catId === 'all' ? null : catId)
}
function addItem(menuItem) {
    posStore.addItemToCurrentSale(menuItem)
}

// Funciones para modificar ítems en la orden
function increment(item) {
    posStore.updateItemQuantity(item.id, item.quantity + 1)
}
function decrement(item) {
    // updateQuantity con qty<=0 elimina la línea automáticamente (Sale.updateQuantity)
    posStore.updateItemQuantity(item.id, item.quantity - 1)
}
function removeItem(item) {
    posStore.removeItemFromCurrentSale(item.id)
}

function toggleNoteEdit(item) {
    editingDiscountId.value = null   // cierra descuento si estaba abierto
    if (editingNoteId.value === item.id) {
        commitNote(item)
    } else {
        editingNoteId.value = item.id
        noteInput.value     = item.note
    }
}
function commitNote(item) {
    posStore.updateItemNote(item.id, noteInput.value)
    editingNoteId.value = null
}

function toggleDiscountEdit(item) {
    editingNoteId.value = null   // cierra nota si estaba abierta
    if (editingDiscountId.value === item.id) {
        commitDiscount(item)
    } else {
        editingDiscountId.value = item.id
        discountType.value      = item.discountType  ?? 'pct'
        discountInput.value     = item.discountValue ?? 0
    }
}
function commitDiscount(item) {
    posStore.updateItemDiscount(item.id, discountType.value, discountInput.value)
    editingDiscountId.value = null
}
function cancelDiscount() {
    editingDiscountId.value = null
}


async function enviarEstaciones() {
    const count = await posStore.sendCurrentSaleToStations()
    if (count > 0) {
        toast.add({
            severity: 'success',
            summary:  'Enviado a Cocina',
            detail:   `${count} producto${count !== 1 ? 's' : ''} despachado${count !== 1 ? 's' : ''} a las estaciones.`,
            life:     3000,
        })
    } else {
        toast.add({
            severity: 'info',
            summary:  'Sin cambios pendientes',
            detail:   'Todos los ítems ya fueron enviados a cocina.',
            life:     3000,
        })
    }
}
function dividirCuenta() {
    toast.add({
        severity: 'info',
        summary:  'Próximamente',
        detail:   'La función de división de cuenta estará disponible en breve.',
        life:     3000,
    })
}
function procederPago()     { router.push(posPaymentRoute(tableId.value)) }

// ── Mobile tab switcher ───────────────────────────────────────────────────
const mobileView = ref('catalog') // 'catalog' | 'cart'
const itemCount  = computed(() => sale.value?.items?.length ?? 0)
</script>

<template>
    <div class="pos-order-layout">

        <!-- ── LEFT: Catálogo ─────────────────────────────────────────────────────────────── -->
        <div class="pos-catalog" :class="{ 'pos-catalog--mobile-hidden': mobileView !== 'catalog' }">

            <!-- Header: contexto + búsqueda -->
            <div class="pos-catalog__header">

                <!-- Badges de contexto (izquierda) -->
                <div class="context-badges">
                    <div class="context-badge context-badge--blue">
                        <span class="context-badge__label">Mesa</span>
                        <strong class="context-badge__value">Mesa {{ table?.number ?? '—' }}</strong>
                    </div>
                    <div
                        v-if="zone"
                        class="context-badge"
                        :style="{ background: zone.color + '22', borderColor: zone.color }"
                    >
                        <span class="context-badge__label" :style="{ color: zone.color }">Zona</span>
                        <strong class="context-badge__value" :style="{ color: zone.color }">{{ zone.name }}</strong>
                    </div>
                    <div class="context-badge context-badge--blue">
                        <span class="context-badge__label">Orden</span>
                        <div style="display:flex;align-items:center;gap:0.35rem">
                            <strong class="context-badge__value">#{{ sale?.id ?? '—' }}</strong>
                            <span v-if="posStore.currentSaleIsRecovered" class="pending-chip">PENDIENTE</span>
                        </div>
                    </div>
                </div>

                <!-- BÃºsqueda (derecha) -->
                <div class="search-wrapper">
                    <i class="pi pi-search search-wrapper__icon"></i>
                    <pv-input-text
                        class="search-wrapper__input"
                        placeholder="Buscar productos..."
                        :model-value="posStore.catalogSearch"
                        @update:model-value="posStore.setCatalogSearch"
                    />
                </div>

            </div>

            <!-- Filtro de categorÃ­as -->
            <div class="cat-bar">
                <button
                    :class="['cat-btn', posStore.catalogCategory === null ? 'cat-btn--active' : 'cat-btn--inactive']"
                    @click="selectCategory('all')"
                >
                    Todos ({{ posStore.filteredCatalog.length }})
                </button>
                <button
                    v-for="cat in posStore.menuCategories"
                    :key="cat.id"
                    :class="['cat-btn', posStore.catalogCategory === cat.id ? 'cat-btn--active' : 'cat-btn--inactive']"
                    :style="posStore.catalogCategory !== cat.id ? { borderLeft: `4px solid ${cat.color}` } : {}"
                    @click="selectCategory(cat.id)"
                >
                    {{ cat.name }} ({{ cat.count }})
                </button>
            </div>

            <!-- Grilla de productos (estilo menÃº) -->
            <div class="product-grid">
                <div
                    v-for="item in posStore.filteredCatalog"
                    :key="item.id"
                    class="product-card"
                    @click="addItem(item)"
                >
                    <!-- Imagen / placeholder -->
                    <div class="product-card__image">
                        <i class="pi pi-prime product-card__icon"></i>
                        <!-- Badge disponibilidad -->
                        <div :class="['product-card__avail', item.isAvailable ? 'product-card__avail--ok' : 'product-card__avail--no']">
                            <i :class="['pi', item.isAvailable ? 'pi-check-circle' : 'pi-times-circle']"></i>
                            {{ item.isAvailable ? 'Disponible' : 'No disponible' }}
                        </div>
                        <!-- Overlay con botÃ³n agregar -->
                        <div class="product-card__overlay">
                            <button class="product-card__add-btn" @click.stop="addItem(item)">
                                <i class="pi pi-plus"></i> Agregar
                            </button>
                        </div>
                    </div>

                    <!-- Contenido -->
                    <div class="product-card__body">
                        <span class="product-card__category">{{ item.category }}</span>
                        <h3 class="product-card__name">{{ item.name }}</h3>
                        <p class="product-card__desc">{{ item.description }}</p>
                        <div class="product-card__footer">
                            <span class="product-card__price">S/ {{ item.price.toFixed(2) }}</span>
                            <span class="product-card__sku">SKU: {{ item.sku }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="posStore.filteredCatalog.length === 0" class="product-grid__empty">
                    <i class="pi pi-inbox text-4xl text-color-secondary"></i>
                    <span class="text-color-secondary">No se encontraron productos</span>
                </div>
            </div>

        </div>

        <!-- ── RIGHT: Orden ─────────────────────────────────────────────────────────────── -->    
        <div class="pos-panel" :class="{ 'pos-panel--mobile-hidden': mobileView !== 'cart' }">

            <!-- Encabezado del panel -->
            <div class="pos-panel__header">
                <div class="flex align-items-center gap-2">
                    <i class="pi pi-shopping-cart text-primary" style="font-size:1.1rem"></i>
                    <span class="font-bold text-color" style="font-size:1rem">Orden Actual</span>
                </div>
                <span class="text-sm text-color-secondary">
                    {{ sale?.totalItems ?? 0 }} producto{{ (sale?.totalItems ?? 0) !== 1 ? 's' : '' }}
                </span>
            </div>

            <!-- Lista de Ã­tems (scrollable) -->
            <div class="pos-panel__items">
                <!-- Empty state -->
                <div v-if="!sale || sale.items.length === 0" class="panel-empty">
                    <i class="pi pi-shopping-cart text-4xl text-color-secondary"></i>
                    <span class="text-sm text-color-secondary">Selecciona productos del menú</span>
                </div>

                <!-- Ãtems -->
                <div v-else class="flex flex-column gap-2">
                    <div
                        v-for="item in sale.items"
                        :key="item.id"
                        class="order-item"
                    >
                        <!-- Nombre + acciones -->
                        <div class="flex align-items-start justify-content-between gap-1">
                            <div class="flex align-items-center gap-2">
                                <span class="order-item__name">{{ item.menuItemName }}</span>
                                <span v-if="item.isSent" class="sent-badge">
                                    <i class="pi pi-check"></i> Enviado
                                </span>
                            </div>
                            <div class="flex gap-1 flex-shrink-0">
                                <!-- Descuento (etiqueta) -->
                                <button
                                    :class="['icon-btn', editingDiscountId === item.id ? 'icon-btn--active-green' : (item.discountPct > 0 ? 'icon-btn--has-discount' : '')]"
                                    title="Descuento"
                                    @click="toggleDiscountEdit(item)"
                                >
                                    <i class="pi pi-tag"></i>
                                </button>
                                <!-- Nota (copiar) -->
                                <button
                                    :class="['icon-btn', editingNoteId === item.id ? 'icon-btn--active-yellow' : (item.note ? 'icon-btn--has-note' : '')]"
                                    title="Nota"
                                    @click="toggleNoteEdit(item)"
                                >
                                    <i class="pi pi-copy"></i>
                                </button>
                                <!-- Eliminar -->
                                <button class="icon-btn icon-btn--danger" title="Eliminar" @click="removeItem(item)">
                                    <i class="pi pi-trash"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Editor de descuento -->
                        <div v-if="editingDiscountId === item.id" class="discount-editor">
                            <!-- Toggle tipo -->
                            <div class="discount-type-toggle">
                                <button
                                    :class="['disc-type-btn', discountType === 'pct' ? 'disc-type-btn--active' : '']"
                                    @click="discountType = 'pct'"
                                >% Porcentaje</button>
                                <button
                                    :class="['disc-type-btn', discountType === 'fixed' ? 'disc-type-btn--active' : '']"
                                    @click="discountType = 'fixed'"
                                >S/ Monto fijo</button>
                            </div>
                            <div class="discount-editor__row">
                                <span class="discount-editor__pct">{{ discountType === 'pct' ? '%' : 'S/' }}</span>
                                <input
                                    v-model.number="discountInput"
                                    class="discount-editor__input"
                                    type="number"
                                    min="0"
                                    :max="discountType === 'pct' ? 100 : item.unitPrice * item.quantity"
                                    step="discountType === 'pct' ? 1 : 0.5"
                                    placeholder="0"
                                    autofocus
                                    @keyup.enter="commitDiscount(item)"
                                    @keyup.esc="cancelDiscount"
                                />
                                <button class="discount-editor__save" @click="commitDiscount(item)">Aplicar</button>
                                <button class="discount-editor__cancel" @click="cancelDiscount">Cancelar</button>
                            </div>
                        </div>

                        <!-- Descuento guardado -->
                        <div v-else-if="item.discountValue > 0" class="discount-display">
                            <i class="pi pi-tag" style="font-size:0.7rem"></i>
                            <span v-if="item.discountType === 'pct'">Descuento {{ item.discountValue }}%</span>
                            <span v-else>Descuento S/ {{ item.discountValue.toFixed(2) }}</span>
                            &mdash;
                            <span class="discount-display__original">S/ {{ (item.quantity * item.unitPrice).toFixed(2) }}</span>
                        </div>

                        <!-- Editor de nota -->
                        <div v-if="editingNoteId === item.id" class="note-editor">
                            <input
                                v-model="noteInput"
                                class="note-editor__input"
                                type="text"
                                placeholder="Ej: Sin ají, extra limón..."
                                @keyup.enter="commitNote(item)"
                                @keyup.esc="editingNoteId = null"
                                autofocus
                            />
                            <button class="note-editor__save" @click="commitNote(item)">OK</button>
                        </div>

                        <!-- Nota guardada -->
                        <div v-else-if="item.note" class="note-display">
                            <i class="pi pi-align-left" style="font-size:0.7rem"></i>
                            {{ item.note }}
                        </div>

                        <!-- Stepper + precio de lÃ­nea -->
                        <div class="flex align-items-center justify-content-between mt-2">
                            <div class="qty-stepper">
                                <button class="qty-btn" @click="decrement(item)">
                                    <i class="pi pi-minus"></i>
                                </button>
                                <span class="qty-value">{{ item.quantity }}</span>
                                <button class="qty-btn" @click="increment(item)">
                                    <i class="pi pi-plus"></i>
                                </button>
                            </div>
                            <span class="order-item__subtotal">S/ {{ item.subtotal.toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer: totales + botones de acción -->
            <div class="pos-panel__footer">
                <!-- Totales -->
                <div class="totals">
                    <div class="totals__row">
                        <span>Subtotal</span>
                        <span>S/ {{ (sale?.subtotal ?? 0).toFixed(2) }}</span>
                    </div>
                    <div class="totals__row">
                        <span>IGV (18%)</span>
                        <span>S/ {{ (sale?.tax ?? 0).toFixed(2) }}</span>
                    </div>

                    <!-- Descuento de orden -->
                    <div v-if="(sale?.discount ?? 0) > 0" class="totals__row totals__row--discount">
                        <span>Descuento</span>
                        <span class="totals__discount-value">− S/ {{ (sale.discount).toFixed(2) }}</span>
                    </div>

                    <!-- Editor de descuento de orden -->
                    <div v-if="editingOrderDiscount" class="order-discount-editor">
                        <select v-model="orderDiscountType" class="order-discount-editor__type">
                            <option value="pct">%</option>
                            <option value="fixed">S/</option>
                        </select>
                        <input
                            v-model.number="orderDiscountInput"
                            type="number"
                            min="0"
                            :max="orderDiscountType === 'pct' ? 100 : undefined"
                            class="order-discount-editor__input"
                            @keydown.enter="commitOrderDiscount"
                            @keydown.esc="cancelOrderDiscount"
                        />
                        <button class="order-discount-editor__btn order-discount-editor__btn--ok" @click="commitOrderDiscount">
                            <i class="pi pi-check"></i>
                        </button>
                        <button v-if="(sale?.discount ?? 0) > 0" class="order-discount-editor__btn order-discount-editor__btn--clear" @click="clearOrderDiscount">
                            <i class="pi pi-times"></i>
                        </button>
                        <button class="order-discount-editor__btn order-discount-editor__btn--cancel" @click="cancelOrderDiscount">
                            <i class="pi pi-ban"></i>
                        </button>
                    </div>
                    <button
                        v-else-if="sale"
                        class="totals__discount-toggle"
                        @click="openOrderDiscount"
                    >
                        <i class="pi pi-tag"></i>
                        {{ (sale?.discount ?? 0) > 0 ? 'Editar descuento' : 'Agregar descuento' }}
                    </button>

                    <div class="totals__row totals__row--total">
                        <span>Total</span>
                        <span>S/ {{ (sale?.total ?? 0).toFixed(2) }}</span>
                    </div>
                </div>

                <!-- Botones -->
                <div class="action-btns">
                    <button
                        class="action-btn action-btn--stations"
                        :disabled="pendingItems.length === 0"
                        @click="enviarEstaciones"
                    >
                        <i class="pi pi-send"></i>
                        Enviar a Estaciones
                        <span v-if="pendingItems.length > 0" class="pending-count">{{ pendingItems.length }}</span>
                    </button>
                    <button class="action-btn action-btn--split" @click="dividirCuenta">
                        <i class="pi pi-sliders-h"></i> Dividir Cuenta
                    </button>
                    <button class="action-btn action-btn--pay" @click="procederPago">
                        Proceder al Pago
                    </button>
                </div>
            </div>

        </div>
        <!-- Mobile tab bar (only visible on <=768px screens) -->
        <div class="mobile-tab-bar">
            <button
                class="mobile-tab-bar__tab"
                :class="{ 'mobile-tab-bar__tab--active': mobileView === 'catalog' }"
                @click="mobileView = 'catalog'"
            >
                <i class="pi pi-th-large"></i>
                <span>Catálogo</span>
            </button>
            <button
                class="mobile-tab-bar__tab"
                :class="{ 'mobile-tab-bar__tab--active': mobileView === 'cart' }"
                @click="mobileView = 'cart'"
            >
                <span class="mobile-tab-bar__icon-wrap">
                    <i class="pi pi-shopping-cart"></i>
                    <span v-if="itemCount > 0" class="mobile-tab-bar__badge">{{ itemCount }}</span>
                </span>
                <span>Orden</span>
            </button>
        </div>    </div>
</template>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────────── */
.pos-order-layout {
    display: flex;
    height: 100%;
    min-height: 0;
    background: #f3f4f6;
}

/* ── Columna izquierda ─────────────────────────────────────────────────────────────── */
.pos-catalog {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.pos-catalog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    background: #fff;
    border-bottom: 1px solid var(--surface-border);
}

/* ── Context badges ─────────────────────────────────────────────────────────────── */
.context-badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}
.context-badge {
    display: flex;
    flex-direction: column;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 0.28rem 0.7rem;
    line-height: 1.25;
}
.context-badge--blue { background: #dbeafe; border-color: #93c5fd; }
.context-badge__label {
    font-size: 0.62rem;
    font-weight: 500;
    color: #1e40af;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.context-badge__value { font-size: 0.82rem; color: #1e3a8a; }

/* ── Search ─────────────────────────────────────────────────────────────── */
.search-wrapper {
    position: relative;
    flex: 1;
    max-width: 440px;
}
.search-wrapper__icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary, #9ca3af);
    font-size: 0.9rem;
    pointer-events: none;
    z-index: 1;
}
.search-wrapper__input {
    width: 100%;
    padding-left: 2.25rem !important;
}

/* ── Pending chip ───────────────────────────────────────────────────────────────── */
.pending-chip {
    display: inline-flex;
    align-items: center;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fbbf24;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
}

/* ── Category bar ─────────────────────────────────────────────────────────────── */
.cat-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.6rem 1.25rem;
    background: #fff;
    border-bottom: 1px solid var(--surface-border, #e5e7eb);
}
.cat-btn {
    background-color: #fff;
    border-top:    1px solid var(--border-color, #e5e7eb);
    border-right:  1px solid var(--border-color, #e5e7eb);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    border-left:   1px solid var(--border-color, #e5e7eb);
    border-radius: 999px;
    padding: 0.3rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.15s, color 0.15s;
}
.cat-btn--active {
    background-color: var(--color-primary, #6366f1);
    color: #fff;
    border-color: var(--color-primary, #6366f1) !important;
}
.cat-btn--inactive {
    color: #111827;
}
.cat-btn--inactive:hover {
    background-color: var(--bg-hover, #f3f4f6);
    color: #111827;
}

/* ── Product grid ─────────────────────────────────────────────────────────────── */
.product-grid {
    flex: 1;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    align-content: start;
    padding: 1rem 1.25rem;
}
.product-grid__empty {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 0;
}

/* ── Product card ─────────────────────────────────────────────────────────────── */
.product-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid var(--border-color, #e5e7eb);
    display: flex;
    flex-direction: column;
    transition: box-shadow 0.15s, transform 0.15s;
    min-height: 310px;
}
.product-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.10); transform: translateY(-2px); }

.product-card__image {
    position: relative;
    height: 160px;
    background: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
}
.product-card__icon { font-size: 3rem; color: #a5b4fc; opacity: 0.8; }

.product-card__avail {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
}
.product-card__avail--ok { background: #dcfce7; color: #166534; }
.product-card__avail--no { background: #fee2e2; color: #991b1b; }

.product-card__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.28);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.15s;
}
.product-card:hover .product-card__overlay { opacity: 1; }

.product-card__add-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    border: none;
    background: var(--color-primary, #6366f1);
    color: #fff;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.12s;
}
.product-card__add-btn:hover { background: #4f46e5; }

.product-card__body {
    padding: 0.75rem 0.9rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
}
.product-card__category {
    font-size: 0.68rem;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.04em;
}
.product-card__name {
    font-size: 0.88rem;
    font-weight: 700;
    color: #111827;
    line-height: 1.3;
    margin: 2px 0 4px;
}
.product-card__desc {
    font-size: 0.74rem;
    color: #6366f1;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 6px;
}
.product-card__footer { display: flex; flex-direction: column; gap: 1px; margin-top: auto; }
.product-card__price  { font-size: 1rem; font-weight: 700; color: #2563eb; }
.product-card__sku    { font-size: 0.68rem; color: #9ca3af; }

/* ── Panel derecho ─────────────────────────────────────────────────────────────── */
.pos-panel {
    width: 370px;
    flex-shrink: 0;
    background: #fff;
    border-left: 1px solid var(--surface-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.pos-panel__header {
    padding: 0.85rem 1.25rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.pos-panel__items {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    min-height: 0;
    display: flex;
    flex-direction: column;
}
.panel-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0.5;
}

/* ── Order item ─────────────────────────────────────────────────────────────── */
.order-item {
    background: #f9fafb;
    border: 1px solid var(--surface-border);
    border-radius: 8px;
    padding: 0.6rem 0.7rem;
}
.order-item__name { font-size: 0.86rem; font-weight: 600; color: #111827; line-height: 1.3; flex: 1; }
.order-item__subtotal { font-size: 0.9rem; font-weight: 700; color: var(--color-primary, #6366f1); }

.sent-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.65rem;
    font-weight: 600;
    color: #065f46;
    background: #d1fae5;
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
    white-space: nowrap;
    flex-shrink: 0;
}

.icon-btn {
    width: 1.55rem; height: 1.55rem;
    border-radius: 4px; border: none; background: transparent;
    color: #9ca3af;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; cursor: pointer;
    transition: background 0.12s, color 0.12s;
}
.icon-btn:hover { background: #f3f4f6; color: #374151; }
.icon-btn--danger:hover { background: #fee2e2; color: #dc2626; }
.icon-btn--active-green { background: #d1fae5; color: #059669; }
.icon-btn--active-yellow { background: #fef9c3; color: #92400e; }
.icon-btn--has-discount { color: #059669; }
.icon-btn--has-note { color: #d97706; }

/* ── Note ─────────────────────────────────────────────────────────────── */
.note-editor { display: flex; gap: 0.35rem; margin-top: 0.35rem; }
.note-editor__input {
    flex: 1; padding: 0.28rem 0.5rem; font-size: 0.76rem;
    border: 1px solid #fbbf24; border-radius: 4px; background: #fefce8; outline: none;
}
.note-editor__save {
    padding: 0.28rem 0.55rem; font-size: 0.72rem; font-weight: 700;
    background: #fbbf24; border: none; border-radius: 4px; cursor: pointer; color: #451a03;
}
.note-display {
    display: flex; align-items: center; gap: 0.3rem;
    font-size: 0.74rem; color: #92400e; background: #fef9c3;
    border-radius: 4px; padding: 0.2rem 0.45rem; margin-top: 0.3rem;
}

/* ── Discount editor ─────────────────────────────────────────────────────────── */
.discount-editor { margin-top: 0.35rem; }

/* toggle % / S/ */
.discount-type-toggle { display: flex; gap: 0.3rem; margin-bottom: 0.35rem; }
.disc-type-btn {
    flex: 1;
    padding: 0.25rem 0;
    font-size: 0.72rem;
    font-weight: 600;
    border: 1px solid #6ee7b7;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
    color: #059669;
    transition: background 0.15s, color 0.15s;
}
.disc-type-btn--active {
    background: #059669;
    color: #fff;
    border-color: #059669;
}
.discount-editor__row { display: flex; align-items: center; gap: 0.3rem; }
.discount-editor__input {
    width: 4.5rem;
    padding: 0.28rem 0.4rem;
    font-size: 0.82rem;
    font-weight: 600;
    border: 1px solid #6ee7b7;
    border-radius: 4px;
    background: #ecfdf5;
    outline: none;
    text-align: center;
}
.discount-editor__input:focus { border-color: #059669; }
.discount-editor__pct { font-size: 0.82rem; font-weight: 700; color: #059669; }
.discount-editor__save {
    padding: 0.28rem 0.65rem; font-size: 0.74rem; font-weight: 700;
    background: #059669; border: none; border-radius: 4px; cursor: pointer; color: #fff;
}
.discount-editor__cancel {
    padding: 0.28rem 0.55rem; font-size: 0.72rem;
    background: transparent; border: 1px solid #d1d5db;
    border-radius: 4px; cursor: pointer; color: #6b7280;
}

/* Descuento guardado */
.discount-display {
    display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;
    font-size: 0.74rem; color: #059669; background: #d1fae5;
    border-radius: 4px; padding: 0.2rem 0.45rem; margin-top: 0.3rem;
}
.discount-display__original {
    text-decoration: line-through;
    opacity: 0.6;
    font-size: 0.72rem;
}

/* ── Qty stepper ─────────────────────────────────────────────────────────────── */
.qty-stepper { display: flex; align-items: center; border: 1px solid var(--surface-border); border-radius: 6px; overflow: hidden; }
.qty-btn {
    width: 1.7rem; height: 1.7rem; border: none; background: #f3f4f6;
    cursor: pointer; font-size: 0.68rem;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
}
.qty-btn:hover { background: #e5e7eb; }
.qty-value { min-width: 2rem; text-align: center; font-size: 0.85rem; font-weight: 600; color: #111827; }

/* ── Panel footer ─────────────────────────────────────────────────────────────── */
.pos-panel__footer { flex-shrink: 0; border-top: 1px solid var(--surface-border); padding: 0.85rem 1.25rem 1rem; }
.totals { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.85rem; }
.totals__row { display: flex; justify-content: space-between; font-size: 0.84rem; color: #6b7280; }
.totals__row--total {
    font-size: 1rem; font-weight: 700; color: #111827;
    margin-top: 0.25rem; padding-top: 0.4rem;
    border-top: 1px solid var(--surface-border);
}
.totals__row--discount { color: #16a34a; font-weight: 600; }
.totals__discount-value { color: #16a34a; font-weight: 700; }
.totals__discount-toggle {
    display: flex; align-items: center; gap: 0.35rem;
    background: none; border: 1px dashed #d1d5db; border-radius: 6px;
    color: #6b7280; font-size: 0.78rem; cursor: pointer;
    padding: 0.3rem 0.6rem; margin-top: 0.25rem; width: 100%;
    transition: border-color 0.15s, color 0.15s;
}
.totals__discount-toggle:hover { border-color: #6366f1; color: #6366f1; }
.order-discount-editor {
    display: flex; align-items: center; gap: 0.35rem;
    margin-top: 0.25rem;
}
.order-discount-editor__type {
    border: 1px solid #d1d5db; border-radius: 6px;
    padding: 0.25rem 0.4rem; font-size: 0.82rem; background: var(--surface-card, #fff);
    color: #374151; cursor: pointer;
}
.order-discount-editor__input {
    flex: 1; border: 1px solid #d1d5db; border-radius: 6px;
    padding: 0.25rem 0.5rem; font-size: 0.82rem; outline: none;
    min-width: 0;
}
.order-discount-editor__input:focus { border-color: #6366f1; }
.order-discount-editor__btn {
    border: none; border-radius: 6px; cursor: pointer;
    padding: 0.3rem 0.45rem; font-size: 0.8rem;
}
.order-discount-editor__btn--ok     { background: #6366f1; color: #fff; }
.order-discount-editor__btn--clear  { background: #fee2e2; color: #dc2626; }
.order-discount-editor__btn--cancel { background: #f3f4f6; color: #6b7280; }

.action-btns { display: flex; flex-direction: column; gap: 0.55rem; }
.action-btn {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.65rem; border: none; border-radius: 8px;
    font-size: 0.86rem; font-weight: 600; cursor: pointer; color: #fff;
    transition: opacity 0.15s;
}
.action-btn:hover { opacity: 0.88; }
.action-btn:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    pointer-events: none;
}
.action-btn--stations { background: #059669; }
.action-btn--split    { background: #7c3aed; }
.action-btn--pay      { background: #2563eb; }

.pending-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    background: rgba(255,255,255,0.35);
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0 0.25rem;
}

/* ── Mobile tab bar (hidden on desktop) ──────────────────────────────────── */
.mobile-tab-bar { display: none; }

/* ── Responsive: ≤ 768px ─────────────────────────────────────────────────── */
@media (max-width: 768px) {
    /* Stack catalog and panel vertically */
    .pos-order-layout {
        flex-direction: column;
        height: 100%;
        padding-bottom: 4.25rem; /* room for fixed tab bar */
    }

    /* Each pane fills the full screen when active */
    .pos-catalog,
    .pos-panel {
        flex: 1 1 auto;
        width: 100%;
        height: 100%;
        min-height: 0;
    }

    /* Hide tabs based on mobileView state */
    .pos-catalog--mobile-hidden,
    .pos-panel--mobile-hidden {
        display: none !important;
    }

    /* Remove fixed-width side border on panel */
    .pos-panel {
        width: 100% !important;
        border-left: none;
        border-top: 1px solid var(--surface-border);
    }

    /* Catalog header: wrap badges + search on narrow screens */
    .pos-catalog__header {
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 0.6rem 0.75rem;
    }

    .context-badges {
        flex-wrap: wrap;
        gap: 0.35rem;
    }

    /* Search full width on mobile */
    .search-wrapper {
        width: 100%;
    }
    .search-wrapper__input { width: 100%; }

    /* Smaller product cards — 2 columns */
    .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        padding: 0.6rem;
        gap: 0.6rem;
    }

    /* Remove tall min-height; let card grow naturally */
    .product-card { min-height: auto; }

    /* Slightly smaller image area */
    .product-card__image { height: 110px; }

    /* Show mobile tab bar */
    .mobile-tab-bar {
        display: flex;
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4.25rem;
        background: #1e1e2e;
        border-top: 1px solid rgba(255,255,255,0.08);
        z-index: 200;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.25);
    }

    .mobile-tab-bar__tab {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        border: none;
        background: transparent;
        color: #6b7280;
        font-size: 0.72rem;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        transition: color 0.2s;
    }

    /* Indicador superior — línea activa */
    .mobile-tab-bar__tab::before {
        content: '';
        position: absolute;
        top: 0;
        left: 25%;
        right: 25%;
        height: 2.5px;
        border-radius: 0 0 3px 3px;
        background: transparent;
        transition: background 0.2s;
    }

    .mobile-tab-bar__tab--active {
        color: #fff;
        font-weight: 700;
    }

    /* Línea indicadora activa */
    .mobile-tab-bar__tab--active::before {
        background: #6366f1;
    }

    /* Pill de fondo en ícono activo */
    .mobile-tab-bar__tab--active .pi,
    .mobile-tab-bar__tab--active .mobile-tab-bar__icon-wrap {
        background: rgba(99,102,241,0.18);
        border-radius: 8px;
        padding: 0.3rem 0.75rem;
    }

    .mobile-tab-bar__tab .pi { font-size: 1.15rem; }

    .mobile-tab-bar__icon-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mobile-tab-bar__badge {
        position: absolute;
        top: -0.45rem;
        right: -0.55rem;
        min-width: 1.1rem;
        height: 1.1rem;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 0.62rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 0.25rem;
        line-height: 1;
        border: 1.5px solid #1e1e2e;
    }
}

/* ── Extra small: ≤ 480px ─────────────────────────────────────────────────── */
@media (max-width: 480px) {
    .product-grid {
        grid-template-columns: repeat(2, 1fr);
    }

    .context-badge {
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
    }
}
</style>
