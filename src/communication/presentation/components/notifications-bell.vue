<script setup>
import { ref, watch } from 'vue'
import { useNotificationsStore } from '../../application/notifications.store.js'
import {
    COMMUNICATION_MESSAGES,
    formatNotificationDate,
} from '../constants/communication.constants-ui.js'

const store = useNotificationsStore()
const panel = ref()

async function togglePanel(event) {
    panel.value.toggle(event)
    store.isPanelOpen = true
    await store.fetchNotifications()
}

function onPanelHide() {
    store.isPanelOpen = false
}

async function onItemClick(notification) {
    if (notification.isUnread) {
        await store.markAsRead(notification.id)
    }
}

watch(
    () => store.unreadCount,
    () => { /* reactividad badge */ },
)
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
          :class="{ 'notifications-bell__item--unread': item.isUnread }"
          @click="onItemClick(item)"
        >
          <div class="notifications-bell__item-title">{{ item.title }}</div>
          <div class="notifications-bell__item-body">{{ item.body }}</div>
          <div class="notifications-bell__item-meta">{{ formatNotificationDate(item.createdAt) }}</div>
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

.notifications-bell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--surface-border, #e5e7eb);
}

.notifications-bell__list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 360px;
  overflow-y: auto;
  width: min(92vw, 360px);
}

.notifications-bell__item {
  padding: 0.65rem 0.5rem;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  border-bottom: 1px solid var(--surface-border, #f3f4f6);
}

.notifications-bell__item:hover {
  background: var(--surface-hover, #f9fafb);
}

.notifications-bell__item--unread {
  background: rgba(26, 107, 194, 0.06);
}

.notifications-bell__item-title {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.notifications-bell__item-body {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-top: 0.15rem;
}

.notifications-bell__item-meta {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
  margin-top: 0.35rem;
}

.notifications-bell__empty {
  padding: 1rem 0.5rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  width: min(92vw, 360px);
}
</style>
