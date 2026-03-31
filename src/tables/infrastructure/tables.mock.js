import { Table, TABLE_STATUS, TABLE_SHAPE } from '../domain/models/table.entity.js';
import { Zone } from '../domain/models/zone.entity.js';

export const MOCK_ZONES = [
    new Zone({ id: 1, name: 'Sucursal 001 Salón Principal', color: '#3b82f6', description: 'Área principal del restaurante con vista a la calle', sucursalId: 'branch-001' }),
    new Zone({ id: 2, name: 'Sucursal 001 Terraza',         color: '#10b981', description: 'Zona al aire libre con ambiente relajado',            sucursalId: 'branch-001' }),
    new Zone({ id: 3, name: 'Sucursal 001 Privado',         color: '#f59e0b', description: 'Salón privado para eventos y reuniones',              sucursalId: 'branch-001' }),
    new Zone({ id: 4, name: 'Sucursal 002 Salón Miraflores', color: '#6366f1', description: 'Área principal de la sucursal Miraflores',           sucursalId: 'branch-002' }),
    new Zone({ id: 5, name: 'Sucursal 002 Barra',            color: '#f43f5e', description: 'Zona de barra y atención rápida',                   sucursalId: 'branch-002' }),
];

export const MOCK_TABLES = [
    // ── Sede Central (branch-001) ────────────────────────────────────────
    new Table({ id: 1,  number: 1,  capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.AVAILABLE, zoneId: 1, zone: 'Salón Principal',  seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 2,  number: 2,  capacity: 2, shape: TABLE_SHAPE.ROUND,      status: TABLE_STATUS.OCCUPIED,  zoneId: 1, zone: 'Salón Principal',  seatedGuests: 2, occupiedSince: new Date(Date.now() - 45 * 60000),        sucursalId: 'branch-001' }),
    new Table({ id: 3,  number: 3,  capacity: 6, shape: TABLE_SHAPE.RECTANGLE,  status: TABLE_STATUS.AVAILABLE, zoneId: 1, zone: 'Salón Principal',  seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 4,  number: 4,  capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.OCCUPIED,  zoneId: 1, zone: 'Salón Principal',  seatedGuests: 3, occupiedSince: new Date(Date.now() - 72 * 60000),        sucursalId: 'branch-001' }),
    new Table({ id: 5,  number: 5,  capacity: 2, shape: TABLE_SHAPE.ROUND,      status: TABLE_STATUS.AVAILABLE, zoneId: 1, zone: 'Salón Principal',  seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 6,  number: 6,  capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.CLEANING,  zoneId: 1, zone: 'Salón Principal',  seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 7,  number: 7,  capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.AVAILABLE, zoneId: 2, zone: 'Terraza',          seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 8,  number: 8,  capacity: 4, shape: TABLE_SHAPE.RECTANGLE,  status: TABLE_STATUS.OCCUPIED,  zoneId: 2, zone: 'Terraza',          seatedGuests: 2, occupiedSince: new Date(Date.now() - 38 * 60000),        sucursalId: 'branch-001' }),
    new Table({ id: 9,  number: 9,  capacity: 6, shape: TABLE_SHAPE.RECTANGLE,  status: TABLE_STATUS.AVAILABLE, zoneId: 2, zone: 'Terraza',          seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 10, number: 10, capacity: 2, shape: TABLE_SHAPE.ROUND,      status: TABLE_STATUS.AVAILABLE, zoneId: 2, zone: 'Terraza',          seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 11, number: 11, capacity: 8, shape: TABLE_SHAPE.RECTANGLE,  status: TABLE_STATUS.AVAILABLE, zoneId: 3, zone: 'Privado',          seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    new Table({ id: 12, number: 12, capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.CLEANING,  zoneId: 3, zone: 'Privado',          seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-001' }),
    // ── Sucursal Miraflores (branch-002) ─────────────────────────────────
    new Table({ id: 13, number: 1,  capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.AVAILABLE, zoneId: 4, zone: 'Salón Miraflores', seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-002' }),
    new Table({ id: 14, number: 2,  capacity: 2, shape: TABLE_SHAPE.ROUND,      status: TABLE_STATUS.OCCUPIED,  zoneId: 4, zone: 'Salón Miraflores', seatedGuests: 2, occupiedSince: new Date(Date.now() - 30 * 60000),        sucursalId: 'branch-002' }),
    new Table({ id: 15, number: 3,  capacity: 6, shape: TABLE_SHAPE.RECTANGLE,  status: TABLE_STATUS.AVAILABLE, zoneId: 4, zone: 'Salón Miraflores', seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-002' }),
    new Table({ id: 16, number: 4,  capacity: 4, shape: TABLE_SHAPE.SQUARE,     status: TABLE_STATUS.AVAILABLE, zoneId: 5, zone: 'Barra',            seatedGuests: 0, occupiedSince: null,                                     sucursalId: 'branch-002' }),
    new Table({ id: 17, number: 5,  capacity: 2, shape: TABLE_SHAPE.ROUND,      status: TABLE_STATUS.OCCUPIED,  zoneId: 5, zone: 'Barra',            seatedGuests: 1, occupiedSince: new Date(Date.now() - 15 * 60000),        sucursalId: 'branch-002' }),
];
