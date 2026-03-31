import { Branch } from '../domain/models/branch.entity.js';

/**
 * Mock data para el módulo de sucursales.
 * Dos sucursales de la misma empresa para simular multi-branch.
 */
export const MOCK_BRANCHES = [
    new Branch({
        id:              'branch-001',
        empresaId:       'empresa-001',
        codigo:          'SUC-001',
        nombre:          'Sede Central',
        direccion:       'Av. La Marina 2000',
        departamento:    'Lima',
        provincia:       'Lima',
        distrito:        'San Miguel',
        telefono:        '01-452-8900',
        email:           'central@gastrosuite.pe',
        encargadoId:     'user-001',
        encargadoNombre: 'Carlos Mendoza Rivera',
        isActive:        true,
        createdAt:       '2024-01-15',
    }),
    new Branch({
        id:              'branch-002',
        empresaId:       'empresa-001',
        codigo:          'SUC-002',
        nombre:          'Sucursal Miraflores',
        direccion:       'Calle Berlín 567',
        departamento:    'Lima',
        provincia:       'Lima',
        distrito:        'Miraflores',
        telefono:        '01-710-3200',
        email:           'miraflores@gastrosuite.pe',
        encargadoId:     'user-005',
        encargadoNombre: 'Luis Paredes Soto',
        isActive:        true,
        createdAt:       '2024-06-01',
    }),
];
