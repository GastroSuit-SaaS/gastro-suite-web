<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCommunicationStore } from '../../application/communication.store.js'
import { useConfirmDialog } from '../../../shared/presentation/composables/use-confirm-dialog.js'
import {
    COMMUNICATION_MESSAGES,
    NOTIFICATION_FILTER,
    formatNotificationRelativeDate,
    groupNotificationsByTime,
    inferNotificationVisual,
} from '../constants/communication.constants-ui.js'

const store = useCommunicationStore()
const { showConfirm } = useConfirmDialog()

const panel = ref()
const headerMenu = ref()
const itemMenu = ref()
const activeItem = ref(null)
const selectedIds = ref(new Set())
const selectionMode = ref(false)
const activeFilter = ref(NOTIFICATION_FILTER.ALL)
const hoveredId = ref(null)
const nestedOverlayOpen = ref(0)
let nestedOverlayHideTimer = null

const hasSelection = computed(() => selectedIds.value.size > 0)
const allLoadedSelected = computed(() =>
    filteredItems.value.length > 0 && filteredItems.value.every((item) => selectedIds.value.has(item.id)),
)
const someLoadedSelected = computed(() =>
    filteredItems.value.some((item) => selectedIds.value.has(item.id)) && !allLoadedSelected.value,
)

const filteredItems = computed(() => {
    if (activeFilter.value === NOTIFICATION_FILTER.UNREAD) {
        return store.items.filter((item) => item.isUnread)
    }
    return store.items
})

const groupedSections = computed(() => groupNotificationsByTime(filteredItems.value))

const headerMenuItems = computed(() => [
    {
        label: COMMUNICATION_MESSAGES.MARK_ALL,
        icon: 'pi pi-check-circle',
        disabled: !store.hasUnread,
        command: () => store.markAllAsRead(),
    },
    { separator: true },
    {
        label: COMMUNICATION_MESSAGES.DELETE_ALL,
        icon: 'pi pi-trash',
        class: 'notifications-menu-danger',
        disabled: !store.items.length,
        command: () => onDeleteAll(),
    },
])

function itemMenuItems(item) {
    return [
        {
            label: item.isUnread ? COMMUNICATION_MESSAGES.MARK_READ : COMMUNICATION_MESSAGES.MARK_UNREAD,
            icon: item.isUnread ? 'pi pi-check' : 'pi pi-envelope',
            command: () => store.toggleReadStatus(item.id),
        },
        {
            label: COMMUNICATION_MESSAGES.DELETE,
            icon: 'pi pi-trash',
            class: 'notifications-menu-danger',
            command: () => onDelete(item),
        },
    ]
}

function clearSelection() {
    selectedIds.value = new Set()
}

function toggleSelectionMode() {
    selectionMode.value = !selectionMode.value
    if (!selectionMode.value) clearSelection()
}

function toggleSelectAll() {
    if (allLoadedSelected.value) {
        clearSelection()
        return
    }
    selectedIds.value = new Set(filteredItems.value.map((item) => item.id))
}

function toggleSelectItem(id) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selectedIds.value = next
}

function isSelected(id) {
    return selectedIds.value.has(id)
}

function setFilter(filter) {
    activeFilter.value = filter
    clearSelection()
}

async function togglePanel(event) {
    panel.value.toggle(event)
    store.isPanelOpen = true
    selectionMode.value = false
    activeFilter.value = NOTIFICATION_FILTER.ALL
    clearSelection()
    await store.fetchNotifications({ reset: true })
}

function onPanelHide() {
    store.isPanelOpen = false
    selectionMode.value = false
    clearSelection()
    hoveredId.value = null
}

function openHeaderMenu(event) {
    headerMenu.value.toggle(event)
}

function openItemMenu(event, item) {
    activeItem.value = item
    itemMenu.value.toggle(event)
}

function onNestedOverlayShow() {
    if (nestedOverlayHideTimer) {
        clearTimeout(nestedOverlayHideTimer)
        nestedOverlayHideTimer = null
    }
    nestedOverlayOpen.value += 1
}

function onNestedOverlayHide() {
    nestedOverlayHideTimer = setTimeout(() => {
        nestedOverlayOpen.value = Math.max(0, nestedOverlayOpen.value - 1)
        nestedOverlayHideTimer = null
    }, 200)
}

async function onRowClick(item) {
    if (selectionMode.value) {
        toggleSelectItem(item.id)
        return
    }
    if (item.isUnread) {
        await store.toggleReadStatus(item.id)
    }
}

async function onDelete(item) {
    const ok = await showConfirm({
        header: COMMUNICATION_MESSAGES.DELETE_CONFIRM_HEADER,
        message: COMMUNICATION_MESSAGES.DELETE_CONFIRM_MESSAGE,
        acceptLabel: COMMUNICATION_MESSAGES.DELETE,
    })
    if (!ok) return
    await store.deleteNotification(item.id)
    selectedIds.value.delete(item.id)
    selectedIds.value = new Set(selectedIds.value)
}

async function onDeleteSelected() {
    const ids = [...selectedIds.value]
    if (!ids.length) return
    const ok = await showConfirm({
        header: COMMUNICATION_MESSAGES.DELETE_SELECTED_CONFIRM_HEADER,
        message: COMMUNICATION_MESSAGES.DELETE_SELECTED_CONFIRM_MESSAGE(ids.length),
        acceptLabel: COMMUNICATION_MESSAGES.DELETE,
    })
    if (!ok) return
    await store.deleteNotifications(ids)
    clearSelection()
    selectionMode.value = false
}

async function onDeleteAll() {
    const ok = await showConfirm({
        header: COMMUNICATION_MESSAGES.DELETE_ALL_CONFIRM_HEADER,
        message: COMMUNICATION_MESSAGES.DELETE_ALL_CONFIRM_MESSAGE,
        acceptLabel: COMMUNICATION_MESSAGES.DELETE_ALL,
    })
    if (!ok) return
    await store.deleteAllNotifications()
    clearSelection()
    selectionMode.value = false
}

function visualFor(item) {
    return inferNotificationVisual(item.title, item.body)
}

function onNotificationsUpdated() {
    store.fetchUnreadCount()
    if (store.isPanelOpen) {
        clearSelection()
        store.fetchNotifications({ reset: true })
    }
}

onMounted(() => {
    window.addEventListener('gastro:notifications-updated', onNotificationsUpdated)
})

onUnmounted(() => {
    window.removeEventListener('gastro:notifications-updated', onNotificationsUpdated)
    if (nestedOverlayHideTimer) clearTimeout(nestedOverlayHideTimer)
})
</script>

<template>
  <div class="notifications-bell">
    <pv-button
      type="button"
      icon="pi pi-bell"
      rounded
      text
      severity="secondary"
      aria-label="Notificaciones"
      class="notifications-bell__trigger"
      @click="togglePanel"
    />
    <span v-if="store.hasUnread" class="notifications-bell__badge">
      {{ store.unreadCount > 99 ? '99+' : store.unreadCount }}
    </span>

    <pv-popover
      ref="panel"
      class="notifications-bell__popover"
      :dismissable="nestedOverlayOpen === 0"
      :pt="{ content: { class: 'notifications-bell__popover-content' } }"
      @hide="onPanelHide"
    >
      <div class="notifications-panel">
        <!-- Header -->
        <div class="notifications-panel__header">
          <h2 class="notifications-panel__title">{{ COMMUNICATION_MESSAGES.PANEL_TITLE }}</h2>
          <div class="notifications-panel__header-actions">
            <pv-button
              v-if="selectionMode"
              :label="COMMUNICATION_MESSAGES.DONE"
              text
              rounded
              size="small"
              class="notifications-panel__done-btn"
              @click.stop="toggleSelectionMode"
            />
            <pv-button
              v-else
              :label="COMMUNICATION_MESSAGES.MANAGE"
              icon="pi pi-check-square"
              text
              rounded
              size="small"
              severity="secondary"
              class="notifications-panel__manage-btn"
              @click.stop="toggleSelectionMode"
            />
            <pv-button
              v-if="!selectionMode"
              icon="pi pi-ellipsis-h"
              text
              rounded
              size="small"
              severity="secondary"
              aria-label="Opciones de notificaciones"
              class="notifications-panel__menu-btn"
              @click.stop="openHeaderMenu"
            />
          </div>
          <pv-menu
            ref="headerMenu"
            :model="headerMenuItems"
            popup
            @show="onNestedOverlayShow"
            @hide="onNestedOverlayHide"
          />
        </div>

        <!-- Filter tabs -->
        <div class="notifications-panel__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            :aria-selected="activeFilter === NOTIFICATION_FILTER.ALL"
            :class="['notifications-panel__tab', activeFilter === NOTIFICATION_FILTER.ALL && 'notifications-panel__tab--active']"
            @click="setFilter(NOTIFICATION_FILTER.ALL)"
          >
            {{ COMMUNICATION_MESSAGES.FILTER_ALL }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeFilter === NOTIFICATION_FILTER.UNREAD"
            :class="['notifications-panel__tab', activeFilter === NOTIFICATION_FILTER.UNREAD && 'notifications-panel__tab--active']"
            @click="setFilter(NOTIFICATION_FILTER.UNREAD)"
          >
            {{ COMMUNICATION_MESSAGES.FILTER_UNREAD }}
            <span v-if="store.unreadCount > 0" class="notifications-panel__tab-badge">{{ store.unreadCount }}</span>
          </button>
        </div>

        <!-- Selection toolbar (modo gestionar) -->
        <div v-if="selectionMode" class="notifications-panel__selection-bar">
          <label class="notifications-panel__select-all" for="notifications-select-all">
            <pv-checkbox
              :model-value="allLoadedSelected"
              :binary="true"
              :indeterminate="someLoadedSelected"
              input-id="notifications-select-all"
              class="notifications-panel__checkbox"
              @click.stop
              @update:model-value="toggleSelectAll"
            />
            <span class="notifications-panel__select-label">
              {{ allLoadedSelected ? COMMUNICATION_MESSAGES.DESELECT_ALL : COMMUNICATION_MESSAGES.SELECT_ALL }}
            </span>
          </label>
          <div v-if="hasSelection" class="notifications-panel__selection-actions">
            <span class="notifications-panel__selection-count">
              {{ COMMUNICATION_MESSAGES.SELECTED_COUNT(selectedIds.size) }}
            </span>
            <button
              type="button"
              class="notifications-panel__delete-selected"
              @click.stop="onDeleteSelected"
            >
              <i class="pi pi-trash" aria-hidden="true" />
              <span>{{ COMMUNICATION_MESSAGES.DELETE }}</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div v-if="store.isLoading" class="notifications-panel__state">
          <i class="pi pi-spin pi-spinner notifications-panel__state-icon" />
          <span>{{ COMMUNICATION_MESSAGES.LOADING }}</span>
        </div>
        <div v-else-if="store.error" class="notifications-panel__state notifications-panel__state--error">
          <i class="pi pi-exclamation-circle notifications-panel__state-icon" />
          <span>{{ store.error }}</span>
        </div>
        <div v-else-if="!filteredItems.length" class="notifications-panel__state">
          <i class="pi pi-bell notifications-panel__state-icon notifications-panel__state-icon--muted" />
          <span>
            {{ activeFilter === NOTIFICATION_FILTER.UNREAD
              ? COMMUNICATION_MESSAGES.EMPTY_UNREAD
              : COMMUNICATION_MESSAGES.EMPTY }}
          </span>
        </div>
        <div v-else class="notifications-panel__scroll">
          <section
            v-for="section in groupedSections"
            :key="section.key"
            class="notifications-panel__section"
          >
            <div class="notifications-panel__section-head">
              <h3 class="notifications-panel__section-title">{{ section.label }}</h3>
            </div>

            <ul class="notifications-panel__list">
              <li
                v-for="item in section.items"
                :key="item.id"
                class="notifications-panel__item"
                :class="{
                  'notifications-panel__item--unread': item.isUnread,
                  'notifications-panel__item--selected': isSelected(item.id),
                  'notifications-panel__item--hover': hoveredId === item.id,
                }"
                @mouseenter="hoveredId = item.id"
                @mouseleave="hoveredId = null"
                @click="onRowClick(item)"
              >
                <pv-checkbox
                  v-if="selectionMode"
                  :model-value="isSelected(item.id)"
                  :binary="true"
                  class="notifications-panel__checkbox notifications-panel__item-check"
                  @click.stop
                  @update:model-value="() => toggleSelectItem(item.id)"
                />

                <div
                  class="notifications-panel__avatar"
                  :style="{ background: visualFor(item).bg, color: visualFor(item).color }"
                >
                  <i :class="['pi', visualFor(item).icon]" />
                </div>

                <div class="notifications-panel__item-body">
                  <p class="notifications-panel__item-text">
                    <span class="notifications-panel__item-title">{{ item.title }}</span>
                    <span v-if="item.body" class="notifications-panel__item-desc"> · {{ item.body }}</span>
                  </p>
                  <span class="notifications-panel__item-time">{{ formatNotificationRelativeDate(item.createdAt) }}</span>
                </div>

                <div class="notifications-panel__item-end">
                  <span v-if="item.isUnread && !selectionMode" class="notifications-panel__unread-dot" aria-hidden="true" />
                  <pv-button
                    v-show="hoveredId === item.id && !selectionMode"
                    icon="pi pi-ellipsis-h"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    class="notifications-panel__item-menu-btn"
                    aria-label="Acciones"
                    @click.stop="openItemMenu($event, item)"
                  />
                </div>
              </li>
            </ul>
          </section>
        </div>

        <pv-menu
          ref="itemMenu"
          :model="activeItem ? itemMenuItems(activeItem) : []"
          popup
          @show="onNestedOverlayShow"
          @hide="onNestedOverlayHide"
        />

        <!-- Footer -->
        <div v-if="store.hasMore && !store.isLoading" class="notifications-panel__footer">
          <button
            type="button"
            class="notifications-panel__load-more"
            :disabled="store.isLoadingMore"
            @click="store.loadMoreNotifications()"
          >
            <i v-if="store.isLoadingMore" class="pi pi-spin pi-spinner" />
            <span>{{ store.isLoadingMore ? COMMUNICATION_MESSAGES.LOADING_MORE : COMMUNICATION_MESSAGES.SHOW_MORE }}</span>
          </button>
        </div>
      </div>
    </pv-popover>
  </div>
</template>

<style scoped>
.notifications-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.notifications-bell__trigger {
  width: 2.25rem;
  height: 2.25rem;
}

.notifications-bell__badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.1rem;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 0 0 2px var(--toolbar-bg, #111827);
}

/* ── Panel container ─────────────────────────────────────────────────── */
.notifications-panel {
  width: min(92vw, 400px);
  color: #111827;
}

.notifications-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.notifications-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}

.notifications-panel__manage-btn {
  flex-shrink: 0;
  font-size: 0.8125rem !important;
  font-weight: 500 !important;
  padding-inline: 0.4rem !important;
  color: #4b5563 !important;
}

.notifications-panel__done-btn {
  flex-shrink: 0;
  font-size: 0.8125rem !important;
  font-weight: 600 !important;
  padding: 0.35rem 0.7rem !important;
  border-radius: 8px !important;
  color: #1d4ed8 !important;
  background: #eff6ff !important;
}

.notifications-panel__done-btn:hover {
  background: #dbeafe !important;
  color: #1e40af !important;
}

.notifications-panel__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.notifications-panel__menu-btn {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
}

/* ── Filter tabs (estilo referencia) ───────────────────────────────────── */
.notifications-panel__tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.notifications-panel__tab {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.notifications-panel__tab:hover {
  background: #e5e7eb;
}

.notifications-panel__tab--active {
  background: #2563eb;
  color: #fff;
}

.notifications-panel__tab--active:hover {
  background: #1d4ed8;
}

.notifications-panel__tab-badge {
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.1rem;
  text-align: center;
}

.notifications-panel__tab:not(.notifications-panel__tab--active) .notifications-panel__tab-badge {
  background: #dbeafe;
  color: #1d4ed8;
}

/* ── Selection bar ─────────────────────────────────────────────────────── */
.notifications-panel__selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 2.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.notifications-panel__select-all {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.notifications-panel__select-label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  line-height: 1.2;
}

.notifications-panel__selection-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.notifications-panel__selection-count {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.6875rem;
  font-weight: 600;
  white-space: nowrap;
}

.notifications-panel__delete-selected {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: none;
  background: transparent;
  color: #dc2626;
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s;
}

.notifications-panel__delete-selected:hover {
  color: #b91c1c;
}

.notifications-panel__delete-selected .pi {
  font-size: 0.75rem;
}

.notifications-panel__item-check {
  flex-shrink: 0;
  align-self: center;
}

/* ── Scroll area ───────────────────────────────────────────────────────── */
.notifications-panel__scroll {
  max-height: min(60vh, 420px);
  overflow-y: auto;
  margin: 0 -0.25rem;
  padding: 0 0.25rem;
}

.notifications-panel__scroll::-webkit-scrollbar {
  width: 6px;
}

.notifications-panel__scroll::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 999px;
}

/* ── Sections ──────────────────────────────────────────────────────────── */
.notifications-panel__section + .notifications-panel__section {
  margin-top: 0.5rem;
}

.notifications-panel__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.5rem 0.25rem;
}

.notifications-panel__section-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #111827;
}

.notifications-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* ── Notification row ─────────────────────────────────────────────────── */
.notifications-panel__item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.55rem 0.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
  position: relative;
}

.notifications-panel__item:hover,
.notifications-panel__item--hover {
  background: #f3f4f6;
}

.notifications-panel__item--unread {
  background: #f8fafc;
}

.notifications-panel__item--unread:hover {
  background: #eff6ff;
}

.notifications-panel__item--selected {
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.notifications-panel__item--selected:hover {
  background: #dbeafe;
}

.notifications-panel__avatar {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
}

.notifications-panel__item-body {
  flex: 1;
  min-width: 0;
  padding-top: 0.15rem;
}

.notifications-panel__item-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #374151;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notifications-panel__item-title {
  font-weight: 600;
  color: #111827;
}

.notifications-panel__item--unread .notifications-panel__item-title {
  font-weight: 700;
}

.notifications-panel__item-desc {
  font-weight: 400;
  color: #4b5563;
}

.notifications-panel__item-time {
  display: inline-block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #2563eb;
}

.notifications-panel__item-end {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 1.75rem;
  padding-top: 0.35rem;
}

.notifications-panel__unread-dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: #2563eb;
  flex-shrink: 0;
}

.notifications-panel__item-menu-btn {
  width: 1.75rem !important;
  height: 1.75rem !important;
  min-width: 1.75rem !important;
}

/* ── Empty / loading ───────────────────────────────────────────────────── */
.notifications-panel__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  padding: 2.5rem 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.notifications-panel__state--error {
  color: #dc2626;
}

.notifications-panel__state-icon {
  font-size: 1.75rem;
}

.notifications-panel__state-icon--muted {
  color: #d1d5db;
}

/* ── Footer ────────────────────────────────────────────────────────────── */
.notifications-panel__footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.notifications-panel__load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 1rem;
  border: none;
  border-radius: 10px;
  background: #f3f4f6;
  color: #111827;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.notifications-panel__load-more:hover:not(:disabled) {
  background: #e5e7eb;
}

.notifications-panel__load-more:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>

<style>
/* Popover shell — sin scoped para alcanzar el overlay de PrimeVue */
.notifications-bell__popover .p-popover-content,
.notifications-bell__popover-content {
  padding: 0.85rem 1rem 1rem !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e5e7eb !important;
  overflow: visible !important;
}

.notifications-menu-danger .p-menuitem-link,
.notifications-menu-danger .p-menuitem-text {
  color: #dc2626 !important;
}

/* Checkboxes del panel — acento azul coherente con tabs */
.notifications-panel .notifications-panel__checkbox.p-checkbox .p-checkbox-box {
  width: 1.125rem;
  height: 1.125rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 5px;
  background: #fff;
  transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
}

.notifications-panel .notifications-panel__checkbox.p-checkbox:not(.p-disabled) .p-checkbox-box:hover {
  border-color: #2563eb;
}

.notifications-panel .notifications-panel__checkbox.p-checkbox[data-p-checked='true'] .p-checkbox-box,
.notifications-panel .notifications-panel__checkbox.p-checkbox.p-checkbox-checked .p-checkbox-box,
.notifications-panel .notifications-panel__checkbox.p-checkbox .p-checkbox-box.p-highlight {
  background: #2563eb;
  border-color: #2563eb;
}

.notifications-panel .notifications-panel__checkbox.p-checkbox[data-p-checked='true'] .p-checkbox-icon,
.notifications-panel .notifications-panel__checkbox.p-checkbox .p-checkbox-box.p-highlight .p-checkbox-icon {
  color: #fff;
  font-size: 0.65rem;
}

.notifications-panel .notifications-panel__checkbox.p-checkbox[data-p-indeterminate='true'] .p-checkbox-box {
  background: #2563eb;
  border-color: #2563eb;
}
</style>
