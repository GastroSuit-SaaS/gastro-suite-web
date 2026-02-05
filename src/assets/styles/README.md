# 🎨 Design System - Gastro Suite Web

## 📋 Foundation Layer del Design System

Sistema de estilos corporativos base para Vue 3 + PrimeVue + PrimeFlex con tema oscuro profesional para aplicaciones tipo dashboard.

---

## 📁 Estructura de Archivos

```
src/assets/styles/
├── variables.css           # Design tokens (paleta, spacing, fonts)
├── base.css               # Reset + estilos globales
├── typography.css         # Sistema tipográfico
├── layout.css             # Layout dashboard/sidebar
├── utilities.css          # Clases utilitarias propias
├── primevue-overrides.css # Override visual de PrimeVue
└── index.css              # Punto único de importación
```

---

## 🚀 Integración en Vue 3

### ✅ Orden de Importación en `main.js`

**⚠️ ORDEN CRÍTICO - NO MODIFICAR**

```javascript
import { createApp } from 'vue';
import App from './App.vue';

// 1. Theme base de PrimeVue (PRIMERO)
import 'primevue/resources/themes/lara-dark-blue/theme.css';

// 2. PrimeVue core (SEGUNDO)
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

// 3. PrimeFlex (TERCERO)
import 'primeflex/primeflex.css';

// 4. Estilos corporativos (ÚLTIMO - override todo)
import '@/assets/styles/index.css';

// PrimeVue setup
import PrimeVue from 'primevue/config';

const app = createApp(App);
app.use(PrimeVue);
app.mount('#app');
```

### 📦 Instalación de Dependencias

```bash
npm install primevue primeicons primeflex
```

---

## 🎨 Paleta de Colores Corporativa

### Colores Primarios
```css
--bg-primary: #020814        /* Fondo principal oscuro */
--bg-secondary: #23425F      /* Fondo secundario/sidebar */
--color-primary: #1A6BC2     /* Color de marca (azul) */
--text-primary: #E5F3F8      /* Texto principal */
```

### Colores de Estado
```css
--color-success: #10B981     /* Verde - éxito */
--color-warning: #F59E0B     /* Naranja - advertencia */
--color-error: #EF4444       /* Rojo - error */
--color-info: #3B82F6        /* Azul claro - info */
```

### Colores Neutros
```css
--color-white: #FFFFFF
--color-gray-50: #F9FAFB
--color-gray-200: #E5E7EB
--color-gray-900: #111827
```

---

## 🧱 Sistema de Layout (Dashboard)

### Estructura HTML Recomendada

```html
<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="app-sidebar" :class="{ 'is-collapsed': collapsed }">
      <div class="app-sidebar__logo">
        <img src="@/assets/logo.svg" class="app-sidebar__logo-icon" />
        <span class="app-sidebar__logo-text">Gastro Suite</span>
      </div>
      
      <nav class="app-sidebar__nav">
        <ul class="app-sidebar__menu">
          <li class="app-sidebar__menu-item">
            <button class="app-sidebar__menu-link is-active">
              <i class="pi pi-home app-sidebar__menu-icon"></i>
              <span class="app-sidebar__menu-text">Dashboard</span>
            </button>
          </li>
          <!-- Más items... -->
        </ul>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="app-main">
      <header class="app-header">
        <div class="app-header__left">
          <h1 class="app-header__title">Dashboard</h1>
        </div>
        <div class="app-header__right">
          <!-- Acciones del header -->
        </div>
      </header>

      <div class="app-content">
        <div class="app-content__container">
          <!-- Contenido de la página -->
        </div>
      </div>
    </main>
  </div>
</template>
```

---

## 🎯 Clases Utilitarias Propias

### Backgrounds
```html
<div class="bg-primary">Fondo principal</div>
<div class="bg-secondary">Fondo secundario</div>
<div class="bg-card">Fondo de tarjeta</div>
```

### Estados
```html
<button class="is-active">Botón activo</button>
<button class="is-inactive">Botón inactivo</button>
<div class="is-success">Estado de éxito</div>
<div class="is-error">Estado de error</div>
```

### Borders
```html
<div class="border border-primary">Con borde primario</div>
<div class="rounded-lg">Bordes redondeados</div>
```

### Shadows
```html
<div class="shadow-sm">Sombra pequeña</div>
<div class="shadow-lg">Sombra grande</div>
```

### Badges
```html
<span class="badge badge--primary">5</span>
<span class="badge badge--success">New</span>
<span class="badge badge--error">!</span>
```

---

## 🎨 Override de PrimeVue

### Botones

```html
<!-- Botón primario (activo - azul) -->
<Button label="Guardar" class="p-button-primary" />

<!-- Botón secundario (inactivo - oscuro) -->
<Button label="Cancelar" class="p-button-secondary" />

<!-- Botones de estado -->
<Button label="Éxito" class="p-button-success" />
<Button label="Peligro" class="p-button-danger" />
<Button label="Advertencia" class="p-button-warning" />

<!-- Botones outlined -->
<Button label="Outlined" class="p-button-outlined" />

<!-- Botones text -->
<Button label="Link" class="p-button-text" />
```

### Inputs

```html
<InputText v-model="value" placeholder="Texto aquí..." />
<Dropdown v-model="selected" :options="items" />
<Calendar v-model="date" />
```

**✨ Estilos automáticos:**
- Fondo oscuro consistente
- Borde visible con color corporativo
- Focus visible con outline azul
- Estados hover/disabled

### Cards y Panels

```html
<Card>
  <template #header>Título de la tarjeta</template>
  <template #content>Contenido...</template>
  <template #footer>Acciones...</template>
</Card>

<Panel header="Panel Header">
  Contenido del panel...
</Panel>
```

### Diálogos

```html
<Dialog v-model:visible="visible" header="Título" modal>
  <p>Contenido del diálogo...</p>
  <template #footer>
    <Button label="Cancelar" class="p-button-secondary" />
    <Button label="Confirmar" class="p-button-primary" />
  </template>
</Dialog>
```

### Notificaciones (Toast)

```javascript
this.$toast.add({
  severity: 'success', // success, info, warn, error
  summary: 'Éxito',
  detail: 'Operación completada',
  life: 3000
});
```

**✨ Estilos automáticos:**
- Fondo oscuro corporativo
- Borde lateral de color según severidad
- Iconos coloreados
- Sombra y backdrop blur

---

## 📐 Variables de Espaciado

```css
--spacing-xs: 0.25rem    /* 4px */
--spacing-sm: 0.5rem     /* 8px */
--spacing-md: 1rem       /* 16px */
--spacing-lg: 1.5rem     /* 24px */
--spacing-xl: 2rem       /* 32px */
--spacing-2xl: 3rem      /* 48px */
--spacing-3xl: 4rem      /* 64px */
```

**Uso:**
```html
<div class="p-md">Padding medium</div>
<div class="m-lg">Margin large</div>
<div class="mt-xl mb-lg">Top XL, Bottom LG</div>
```

---

## 🎯 Tipografía

### Tamaños de Texto

```html
<p class="text-xs">Extra small</p>
<p class="text-sm">Small</p>
<p class="text-base">Base (default)</p>
<p class="text-lg">Large</p>
<p class="text-xl">Extra large</p>
<p class="text-2xl">2XL</p>
```

### Colores de Texto

```html
<p class="text-primary">Texto principal</p>
<p class="text-secondary">Texto secundario</p>
<p class="text-muted">Texto atenuado</p>
<p class="text-success">Texto de éxito</p>
<p class="text-error">Texto de error</p>
```

### Peso de Fuente

```html
<p class="font-normal">Normal (400)</p>
<p class="font-medium">Medium (500)</p>
<p class="font-semibold">Semibold (600)</p>
<p class="font-bold">Bold (700)</p>
```

---

## ♿ Accesibilidad

### Focus Visible

Todos los elementos interactivos tienen `:focus-visible` configurado:
- Outline azul de 2px
- Offset de 2px
- Box shadow sutil

### Contraste

Todos los colores cumplen WCAG AA:
- Texto principal: #E5F3F8 sobre #020814
- Botones: contrastes validados
- Estados de error claramente visibles

---

## 📱 Responsive

### Breakpoints

```css
/* Mobile: < 768px */
@media (max-width: 768px) {
  .app-sidebar { transform: translateX(-100%); }
  .app-main { margin-left: 0; }
}

/* Tablet: 768px - 1024px */
@media (max-width: 1024px) {
  .grid-layout--3-cols { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: > 1024px */
/* Estilos por defecto */
```

---

## 🔧 Extensión Futura

### Agregar Nuevos Colores

Edita [variables.css](src/assets/styles/variables.css):

```css
:root {
  --color-custom: #FF5733;
}
```

Luego usa en utilities o componentes:

```css
.bg-custom {
  background-color: var(--color-custom);
}
```

### Agregar Nuevas Utilidades

Edita [utilities.css](src/assets/styles/utilities.css):

```css
.my-custom-utility {
  /* Tu estilo aquí */
}
```

### Override de Más Componentes PrimeVue

Edita [primevue-overrides.css](src/assets/styles/primevue-overrides.css):

```css
.p-nuevo-componente {
  background-color: var(--bg-card);
  color: var(--text-primary);
  /* Más estilos... */
}
```

---

## ✅ Checklist de Producción

- ✅ Variables CSS implementadas
- ✅ Reset moderno aplicado
- ✅ Sistema tipográfico configurado
- ✅ Layout dashboard/sidebar funcional
- ✅ Utilidades propias creadas
- ✅ Override completo de PrimeVue
- ✅ Tema oscuro consistente
- ✅ Accesibilidad (focus visible, contraste)
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Scrollbar personalizado
- ✅ Transiciones suaves

---

## 🚨 Restricciones Obligatorias

❌ **NO hacer:**
- No usar Tailwind
- No crear componentes Vue en esta capa
- No modificar código interno de PrimeVue
- No hardcodear colores (usar variables)

✅ **SÍ hacer:**
- Usar CSS puro
- Usar PrimeFlex solo para layout
- Basar todo en variables CSS
- Extender con override visual

---

## 📚 Referencias

- **PrimeVue**: https://primevue.org/
- **PrimeFlex**: https://primeflex.org/
- **Vue 3**: https://vuejs.org/

---

## 👨‍💻 Mantenimiento

Este es el **foundation layer** del design system. Cualquier cambio debe:

1. Mantener la coherencia visual
2. Usar variables CSS existentes
3. Ser documentado
4. Ser revisado por el equipo

---

**🎉 Sistema de estilos listo para producción**
