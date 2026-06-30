import { inject, provide, computed, ref } from 'vue'

export const MODULE_TAB_BAR_KEY = Symbol('moduleTabBar')

/**
 * Estado local de pestañas (sin provide; el módulo enlaza v-model en la barra).
 * @param {string|number} initialValue
 */
export function useModuleTabs(initialValue) {
    const activeTab = ref(initialValue)

    function selectTab(value) {
        activeTab.value = value
    }

    const isActive = (value) => computed(() => activeTab.value === value)

    return { activeTab, selectTab, isActive }
}

/**
 * Contexto compartido entre module-tab-bar y module-tab (v-model).
 * @param {import('vue').Ref<string|number|undefined>} activeTabRef
 * @param {(value: string|number) => void} [onChange]
 */
export function provideModuleTabBar(activeTabRef, onChange) {
    const activeValue = computed(() => activeTabRef.value)

    function selectTab(value) {
        if (activeTabRef.value !== value) {
            activeTabRef.value = value
        }
        onChange?.(value)
    }

    provide(MODULE_TAB_BAR_KEY, {
        activeValue,
        selectTab,
    })
}

export function useModuleTabBarContext() {
    return inject(MODULE_TAB_BAR_KEY, null)
}
