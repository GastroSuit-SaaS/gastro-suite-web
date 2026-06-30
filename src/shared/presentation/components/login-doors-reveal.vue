<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { consumeLoginRevealPending } from '../../infrastructure/session-storage.js'

const route = useRoute()
const visible = ref(false)
const animating = ref(false)

const REVEAL_MS = 1050

function tryPlayReveal() {
    if (!consumeLoginRevealPending()) return
    visible.value = true
    animating.value = false
    requestAnimationFrame(() => {
        animating.value = true
    })
    window.setTimeout(() => {
        visible.value = false
        animating.value = false
    }, REVEAL_MS)
}

watch(() => route.fullPath, tryPlayReveal, { immediate: true })
</script>

<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="login-doors"
            :class="{ 'login-doors--open': animating }"
            aria-hidden="true"
        >
            <div class="login-doors__panel login-doors__panel--left">
                <div class="login-doors__inner">
                    <img
                        src="@/assets/image/logo-transparente-cuadrado.png"
                        alt=""
                        class="login-doors__logo login-doors__logo--left"
                    />
                </div>
            </div>
            <div class="login-doors__panel login-doors__panel--right">
                <div class="login-doors__inner">
                    <img
                        src="@/assets/image/logo-transparente-cuadrado.png"
                        alt=""
                        class="login-doors__logo login-doors__logo--right"
                    />
                </div>
            </div>
            <div class="login-doors__seam"></div>
        </div>
    </Teleport>
</template>

<style scoped>
.login-doors {
    position: fixed;
    inset: 0;
    z-index: 10000;
    pointer-events: none;
    overflow: hidden;
}

.login-doors__panel {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 48%, #0f172a 100%);
    box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.35);
    transition: transform 0.95s cubic-bezier(0.65, 0, 0.35, 1);
    will-change: transform;
}

.login-doors__panel--left {
    left: 0;
    transform: translateX(0);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.login-doors__panel--right {
    right: 0;
    transform: translateX(0);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.login-doors--open .login-doors__panel--left {
    transform: translateX(-100%);
}

.login-doors--open .login-doors__panel--right {
    transform: translateX(100%);
}

.login-doors__inner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-doors__logo {
    width: 4.5rem;
    height: 4.5rem;
    object-fit: contain;
    opacity: 0.92;
    filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.45));
    transition: opacity 0.35s ease;
}

.login-doors__logo--left {
    transform: translateX(25%);
}

.login-doors__logo--right {
    transform: translateX(-25%);
}

.login-doors--open .login-doors__logo {
    opacity: 0;
}

.login-doors__seam {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 2px;
    margin-left: -1px;
    background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    opacity: 1;
    transition: opacity 0.4s ease 0.15s;
}

.login-doors--open .login-doors__seam {
    opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
    .login-doors__panel {
        transition-duration: 0.01ms;
    }
}
</style>
