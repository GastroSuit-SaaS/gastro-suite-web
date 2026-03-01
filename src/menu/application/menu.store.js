import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { MenuItem } from '../domain/models/menu-item.entity.js';
import { Category } from '../domain/models/category.entity.js';

export const useMenuStore = defineStore('menu', () => {

    // ── Mock categories (equiv. zonas) ────────────────────────────────────
    const categoriesData = ref([
        new Category({ id: 1, name: 'Entradas',           color: '#f59e0b', description: 'Primeros platos y aperitivos',   sortOrder: 1 }),
        new Category({ id: 2, name: 'Platos Principales', color: '#3b82f6', description: 'Platos fuertes del menú',        sortOrder: 2 }),
        new Category({ id: 3, name: 'Pastas',             color: '#10b981', description: 'Pastas y arroces',               sortOrder: 3 }),
        new Category({ id: 4, name: 'Postres',            color: '#ec4899', description: 'Dulces y postres',               sortOrder: 4 }),
        new Category({ id: 5, name: 'Bebidas',            color: '#8b5cf6', description: 'Bebidas frías y calientes',      sortOrder: 5 }),
        new Category({ id: 6, name: 'Especiales',         color: '#ef4444', description: 'Platos especiales del chef',     sortOrder: 6 }),
    ]);

    const selectedCategoryId = ref(null);
    const searchQuery         = ref('');

    // ── Mock items ────────────────────────────────────────────────────────
    const items = ref([
        new MenuItem({ id: 1,  name: 'Ceviche Clásico',        description: 'Pescado fresco marinado en limón con cebolla y ají', price: 28.00, categoryId: 1, category: 'Entradas',           isAvailable: true,  prepTime: 15, sku: 'ENT-CEV-001' }),
        new MenuItem({ id: 2,  name: 'Tequeños de Queso',       description: 'Palitos de masa rellenos de queso blanco',           price: 18.00, categoryId: 1, category: 'Entradas',           isAvailable: true,  prepTime: 10, sku: 'ENT-TEQ-001' }),
        new MenuItem({ id: 3,  name: 'Lomo Saltado',            description: 'Carne de res salteada con verduras y papas fritas',  price: 45.00, categoryId: 2, category: 'Platos Principales', isAvailable: true,  prepTime: 20, sku: 'PRI-LOM-001' }),
        new MenuItem({ id: 4,  name: 'Pollo a la Brasa',        description: 'Pollo entero asado con especias peruanas',           price: 52.00, categoryId: 2, category: 'Platos Principales', isAvailable: true,  prepTime: 40, sku: 'PRI-POL-001' }),
        new MenuItem({ id: 5,  name: 'Salmón al Limón',         description: 'Filete de salmón a la plancha con salsa de limón',   price: 58.00, categoryId: 2, category: 'Platos Principales', isAvailable: true,  prepTime: 25, sku: 'PRI-SAL-001' }),
        new MenuItem({ id: 6,  name: 'Pasta Alfredo',           description: 'Fettuccine con salsa cremosa de queso parmesano',   price: 32.00, categoryId: 3, category: 'Pastas',             isAvailable: true,  prepTime: 18, sku: 'PAS-ALF-001' }),
        new MenuItem({ id: 7,  name: 'Lasagna Boloñesa',        description: 'Capas de pasta con carne molida y bechamel',        price: 38.00, categoryId: 3, category: 'Pastas',             isAvailable: true,  prepTime: 22, sku: 'PAS-LAS-001' }),
        new MenuItem({ id: 8,  name: 'Tiramisú',                description: 'Postre italiano con mascarpone y café expreso',      price: 22.00, categoryId: 4, category: 'Postres',            isAvailable: true,  prepTime: 5,  sku: 'POS-TIR-001' }),
        new MenuItem({ id: 9,  name: 'Cheesecake de Fresa',     description: 'Tarta de queso con coulis de fresa',                price: 20.00, categoryId: 4, category: 'Postres',            isAvailable: true,  prepTime: 5,  sku: 'POS-CHE-001' }),
        new MenuItem({ id: 10, name: 'Limonada de la Casa',     description: 'Limonada fresca con hierbas y jengibre',            price: 12.00, categoryId: 5, category: 'Bebidas',            isAvailable: true,  prepTime: 3,  sku: 'BEB-LIM-001' }),
        new MenuItem({ id: 11, name: 'Tabla del Chef',          description: 'Selección de embutidos y quesos importados',        price: 65.00, categoryId: 6, category: 'Especiales',         isAvailable: true,  prepTime: 10, sku: 'ESP-TAB-001' }),
        new MenuItem({ id: 12, name: 'Risotto de Hongos',       description: 'Arroz cremoso con hongos porcini y trufa negra',    price: 48.00, categoryId: 3, category: 'Pastas',             isAvailable: true,  prepTime: 30, sku: 'PAS-RIS-001' }),
    ]);

    const isLoading    = ref(false);
    const error        = ref(null);
    const selectedItem = ref(null);

    // ── Computeds ─────────────────────────────────────────────────────────
    const totalItems       = computed(() => items.value.length);
    const availableItems   = computed(() => items.value.filter(i => i.isAvailable).length);
    const unavailableItems = computed(() => items.value.filter(i => !i.isAvailable).length);
    const totalCategories  = computed(() => categoriesData.value.length);

    const categories = computed(() =>
        categoriesData.value.map(cat => ({
            ...cat,
            count: items.value.filter(i => i.categoryId === cat.id).length,
        }))
    );

    const filteredItems = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        return items.value.filter(i => {
            const matchesCategory = selectedCategoryId.value === null || i.categoryId === selectedCategoryId.value;
            const matchesSearch   = !query || i.name.toLowerCase().includes(query) || i.description.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    });

    // ── Actions ───────────────────────────────────────────────────────────
    function fetchAll() { /* TODO: connect API */ }
    function fetchById(id) { /* TODO */ void id; }

    function create(itemData) {
        const newItem = { ...itemData, id: Date.now() };
        items.value.push(newItem);
    }

    function update(id, itemData) {
        const idx = items.value.findIndex(i => i.id === id);
        if (idx !== -1) items.value[idx] = { ...items.value[idx], ...itemData };
    }

    function remove(id) {
        items.value = items.value.filter(i => i.id !== id);
    }

    function setItemAvailability(id, isAvailable) {
        const item = items.value.find(i => i.id === id);
        if (item) item.isAvailable = isAvailable;
    }

    function selectCategory(id) {
        selectedCategoryId.value = selectedCategoryId.value === id ? null : id;
    }

    function createCategory(data) {
        categoriesData.value.push(new Category({ id: Date.now(), ...data }));
    }

    function updateCategory(id, data) {
        const idx = categoriesData.value.findIndex(c => c.id === id);
        if (idx !== -1) categoriesData.value[idx] = { ...categoriesData.value[idx], ...data };
    }

    function removeCategory(id) {
        categoriesData.value = categoriesData.value.filter(c => c.id !== id);
    }

    return {
        items, categoriesData, selectedCategoryId, searchQuery, isLoading, error, selectedItem,
        totalItems, availableItems, unavailableItems, totalCategories, categories, filteredItems,
        fetchAll, fetchById, create, update, remove,
        setItemAvailability, selectCategory, createCategory, updateCategory, removeCategory,
    };
});
