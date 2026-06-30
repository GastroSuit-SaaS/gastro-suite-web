import { reactive } from 'vue'

const defaults = () => ({
    title: null,
    description: null,
    showBackButton: null,
    backLabel: null,
    backRoute: null,
    onBack: null,
    chips: [],
    hideModuleTabs: false,
})

/** Shared toolbar overrides (title, back, context chips, tab visibility). */
export const toolbarContext = reactive(defaults())

export function setToolbarContext(patch) {
    Object.assign(toolbarContext, patch)
}

export function clearToolbarContext() {
    Object.assign(toolbarContext, defaults())
}

export function useToolbarContext() {
    return {
        context: toolbarContext,
        setToolbarContext,
        clearToolbarContext,
    }
}
