<script setup>
import { ref, watch, computed, defineModel } from 'vue';
import CreateAndEdit from '../../../shared/presentation/components/create-and-edit.vue';

const props = defineProps({
    request: { type: Object, default: null },
    action: { type: String, default: 'reject' },
});

const visible = defineModel('visible', { type: Boolean, default: false });

const emit = defineEmits(['submit']);

const adminNotes = ref('');

watch(visible, (val) => {
    if (val) adminNotes.value = '';
});

const headerOverride = computed(() => (props.action === 'reject' ? 'Rechazar solicitud' : 'Aprobar solicitud'));
const submitLabel = computed(() => (props.action === 'reject' ? 'Rechazar' : 'Aprobar'));

function onCancel() {
    visible.value = false;
}

function onSave() {
    emit('submit', adminNotes.value?.trim() ?? '');
    visible.value = false;
}
</script>

<template>
  <CreateAndEdit
    :visible="visible"
    :edit="true"
    entity-name="solicitud"
    size="standard"
    :header-title-override="headerOverride"
    :custom-button-label="submitLabel"
    @canceled-shared="onCancel"
    @saved-shared="onSave"
  >
    <template #content>
      <div class="flex flex-column gap-3 pt-2">
        <p v-if="request" class="m-0 text-sm" style="color: #6b7280;">
          {{ request.companyName }} — {{ request.planName }}
        </p>
        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium" style="color: #374151;">Notas internas (opcional)</label>
          <pv-textarea v-model="adminNotes" rows="3" auto-resize class="w-full" />
        </div>
      </div>
    </template>
  </CreateAndEdit>
</template>
