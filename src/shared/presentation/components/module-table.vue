<template>
  <div class="gs-table-wrap">
    <table class="gs-table">
      <slot />
    </table>
  </div>
</template>

<style scoped>
.gs-table-wrap {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
}

.gs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.gs-table :deep(thead tr) {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.gs-table :deep(th) {
  padding: 0.7rem 0.85rem;
  text-align: left;
  font-size: 0.73rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.gs-table :deep(tbody tr) {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

.gs-table :deep(tbody tr.gs-row--clickable) {
  cursor: pointer;
}

.gs-table :deep(tbody tr.gs-row--clickable:hover),
.gs-table :deep(tbody tr:hover) {
  background: #fafafe;
}

.gs-table :deep(td) {
  padding: 0.7rem 0.85rem;
  color: #374151;
  vertical-align: middle;
}
</style>

<style>
.gs-table tbody tr.gs-row--clickable {
  cursor: pointer;
}
</style>
