/**
 * Reports Infrastructure — Mock Data
 *
 * Datos mock para desarrollo sin backend.
 * Controlados por VITE_USE_MOCK=true.
 */

import { REPORT_TYPE, REPORT_STATUS, EXPORT_FORMAT } from '../domain/models/report.entity.js';

const today     = new Date();
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const weekAgo   = new Date(today); weekAgo.setDate(today.getDate() - 7);
const monthAgo  = new Date(today); monthAgo.setMonth(today.getMonth() - 1);

function iso(d) { return d.toISOString(); }

export const MOCK_REPORTS = [
    {
        id: 'rpt-001',
        type: REPORT_TYPE.DAILY_SALES,
        title: 'Ventas del día — ' + today.toLocaleDateString('es-PE'),
        status: REPORT_STATUS.GENERATED,
        period: 'daily',
        dateFrom: iso(today),
        dateTo: iso(today),
        filters: {},
        exportFormat: EXPORT_FORMAT.PDF,
        generatedBy: 'admin',
        generatedAt: iso(today),
        data: { totalSales: 3450.50, transactions: 42, avgTicket: 82.15 },
        sucursalId: 'branch-001',
    },
    {
        id: 'rpt-002',
        type: REPORT_TYPE.DAILY_SALES,
        title: 'Ventas del día — ' + yesterday.toLocaleDateString('es-PE'),
        status: REPORT_STATUS.GENERATED,
        period: 'daily',
        dateFrom: iso(yesterday),
        dateTo: iso(yesterday),
        filters: {},
        exportFormat: EXPORT_FORMAT.PDF,
        generatedBy: 'admin',
        generatedAt: iso(yesterday),
        data: { totalSales: 2890.00, transactions: 35, avgTicket: 82.57 },
        sucursalId: 'branch-001',
    },
    {
        id: 'rpt-003',
        type: REPORT_TYPE.MONTHLY_SALES,
        title: 'Ventas del mes — ' + today.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }),
        status: REPORT_STATUS.GENERATED,
        period: 'monthly',
        dateFrom: iso(monthAgo),
        dateTo: iso(today),
        filters: {},
        exportFormat: EXPORT_FORMAT.EXCEL,
        generatedBy: 'admin',
        generatedAt: iso(today),
        data: { totalSales: 78500.00, transactions: 980, avgTicket: 80.10 },
        sucursalId: 'branch-001',
    },
    {
        id: 'rpt-004',
        type: REPORT_TYPE.INVENTORY_STATUS,
        title: 'Estado de Inventario — Semana actual',
        status: REPORT_STATUS.GENERATED,
        period: 'weekly',
        dateFrom: iso(weekAgo),
        dateTo: iso(today),
        filters: { category: 'all' },
        exportFormat: EXPORT_FORMAT.CSV,
        generatedBy: 'admin',
        generatedAt: iso(today),
        data: { totalProducts: 142, lowStock: 8, outOfStock: 2 },
        sucursalId: 'branch-001',
    },
    {
        id: 'rpt-005',
        type: REPORT_TYPE.FINANCIAL,
        title: 'Resumen Financiero — ' + today.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }),
        status: REPORT_STATUS.GENERATED,
        period: 'monthly',
        dateFrom: iso(monthAgo),
        dateTo: iso(today),
        filters: {},
        exportFormat: EXPORT_FORMAT.PDF,
        generatedBy: 'admin',
        generatedAt: iso(weekAgo),
        data: { revenue: 78500, expenses: 52300, profit: 26200, margin: 33.4 },
        sucursalId: 'branch-001',
    },
    {
        id: 'rpt-006',
        type: REPORT_TYPE.PRODUCT_MIX,
        title: 'Mix de Productos — Semana pasada',
        status: REPORT_STATUS.PENDING,
        period: 'weekly',
        dateFrom: iso(weekAgo),
        dateTo: iso(yesterday),
        filters: {},
        exportFormat: EXPORT_FORMAT.PDF,
        generatedBy: 'admin',
        generatedAt: null,
        data: null,
        sucursalId: 'branch-001',
    },
    {
        id: 'rpt-007',
        type: REPORT_TYPE.DAILY_SALES,
        title: 'Ventas del día (fallido)',
        status: REPORT_STATUS.FAILED,
        period: 'daily',
        dateFrom: iso(weekAgo),
        dateTo: iso(weekAgo),
        filters: {},
        exportFormat: EXPORT_FORMAT.PDF,
        generatedBy: 'admin',
        generatedAt: null,
        data: null,
        sucursalId: 'branch-001',
    },
];
