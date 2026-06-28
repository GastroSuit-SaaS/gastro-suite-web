<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationsStore } from '../../application/notifications.store.js'
import { useConfirmDialog } from '../../../shared/composables/use-confirm-dialog.js'
import {
    COMMUNICATION_MESSAGES,
    formatNotificationDate,
} from '../constants/communication.constants-ui.js'

const store = useNotificationsStore()
const { showConfirm } = useConfirmDialog()
const panel = ref()

async function togglePanel(event) {
    panel.value.toggle(event)
    store.isPanelOpen = true
    await store.fetchNotifications()
}

function onPanelHide() {
    store.isPanelOpen = false
}

async function onToggleRead(item, event) {
    event.stopPropagation()
    await store.toggleReadStatus(item.id)
}

async function onDelete(item, event) {
    event.stopPropagation()
    const ok = await showConfirm({
        header: COMMUNICATION_MESSAGES.DELETE_CONFIRM_HEADER,
        message: COMMUNICATION_MESSAGES.DELETE_CONFIRM_MESSAGE,
        acceptLabel: COMMUNICATION_MESSAGES.DELETE,
    })
    if (!ok) return
    await store.deleteNotification(item.id)
}

function onNotificationsUpdated() {
    store.fetchUnreadCount()
    if (store.isPanelOpen) {
        store.fetchNotifications()
    }
}

onMounted(() => {
    window.addEventListener('gastro:notifications-updated', onNotificationsUpdated)
})

onUnmounted(() => {
    window.removeEventListener('gastro:notifications-updated', onNotificationsUpdated)
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

    <pv-popover ref="panel" class="notifications-bell__panel" @hide="onPanelHide">
      <div class="notifications-bell__header">
        <span class="font-semibold">{{ COMMUNICATION_MESSAGES.PANEL_TITLE }}</span>
        <pv-button
          v-if="store.hasUnread"
          :label="COMMUNICATION_MESSAGES.MARK_ALL"
          link
          size="small"
          class="p-0"
          @click="store.markAllAsRead()"
        />
      </div>

      <div v-if="store.isLoading" class="notifications-bell__empty">
        {{ COMMUNICATION_MESSAGES.LOADING }}
      </div>
      <div v-else-if="store.error" class="notifications-bell__empty text-red-500">
        {{ store.error }}
      </div>
      <div v-else-if="!store.items.length" class="notifications-bell__empty">
        {{ COMMUNICATION_MESSAGES.EMPTY }}
      </div>
      <ul v-else class="notifications-bell__list">
        <li
          v-for="item in store.items"
          :key="item.id"
          class="notifications-bell__item"
          :class="{
            'notifications-bell__item--unread': item.isUnread,
            'notifications-bell__item--read': !item.isUnread,
          }"
        >
          <div class="notifications-bell__item-content">
            <div class="notifications-bell__item-title">{{ item.title }}</div>
            <div class="notifications-bell__item-body">{{ item.body }}</div>
            <div class="notifications-bell__item-meta">{{ formatNotificationDate(item.createdAt) }}</div>
          </div>
          <div class="notifications-bell__item-actions">
            <pv-button
              :icon="item.isUnread ? 'pi pi-check' : 'pi pi-envelope'"
              text
              rounded
              size="small"
              severity="secondary"
              :aria-label="item.isUnread ? COMMUNICATION_MESSAGES.MARK_READ : COMMUNICATION_MESSAGES.MARK_UNREAD"
              v-tooltip.top="item.isUnread ? COMMUNICATION_MESSAGES.MARK_READ : COMMUNICATION_MESSAGES.MARK_UNREAD"
              @click="onToggleRead(item, $event)"
            />
            <pv-button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              :aria-label="COMMUNICATION_MESSAGES.DELETE"
              v-tooltip.top="COMMUNICATION_MESSAGES.DELETE"
              @click="onDelete(item, $event)"
            />
          </div>
        </li>
      </ul>
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
  background: var(--color-danger, #ef4444);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.1rem;
  text-align: center;
  pointer-events: none;
}

.notifications-bell__panel {
  color: #111827;
}

.notifications-bell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
}

.notifications-bell__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 360px;
  overflow-y: auto;
  width: min(92vw, 380px);
}

.notifications-bell__item {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.65rem 0.35rem 0.65rem 0.5rem;
  border-radius: 8px;
  border-bottom: 1px solid #f3f4f6;
  background: #ffffff;
}

.notifications-bell__item:hover {
  background: #f9fafb;
}

.notifications-bell__item--unread {
  background: #eff6ff;
  border-left: 3px solid #2563eb;
  padding-left: calc(0.5rem - 3px);
}

.notifications-bell__item--read {
  background: #ffffff;
}

.notifications-bell__item-content {
  flex: 1;
  min-width: 0;
}

.notifications-bell__item-actions {
  display: flex;
  flex-shrink: 0;
  align-items: flex-start;
  gap: 0.1rem;
  padding-top: 0.1rem;
}

.notifications-bell__item-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.35;
}

.notifications-bell__item--unread .notifications-bell__item-title {
  color: #0f172a;
  font-weight: 700;
}

.notifications-bell__item-body {
  font-size: 0.8125rem;
  color: #4b5563;
  margin-top: 0.15rem;
  line-height: 1.45;
}

.notifications-bell__item-meta {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.35rem;
}

.notifications-bell__empty {
  padding: 1rem 0.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  width: min(92vw, 380px);
}
</style>
