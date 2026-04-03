import { CashMovement } from '../../domain/models/cash-movement.entity.js';

/**
 * CashRegister Infrastructure - CashMovement Assembler
 */
export class CashMovementAssembler {

    static toEntityFromResource(resource) {
        return new CashMovement({
            id:          resource.id,
            type:        resource.type        ?? '',
            amount:      resource.amount      ?? 0,
            description: resource.description ?? '',
            sessionId:   resource.sessionId   ?? resource.session_id  ?? null,
            registerId:  resource.registerId  ?? resource.register_id ?? null,
            userId:      resource.userId      ?? resource.user_id     ?? null,
            userName:    resource.userName     ?? resource.user_name   ?? '',
            category:    resource.category    ?? 'otro',
            createdAt:   resource.createdAt   ?? resource.created_at  ?? null,
            sucursalId:  resource.sucursalId  ?? resource.sucursal_id ?? null,
            paymentId:   resource.paymentId   ?? resource.payment_id  ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        const data = response.data?.items ?? response.data?.data ?? response.data;
        if (!Array.isArray(data)) return [];
        return data.map(r => CashMovementAssembler.toEntityFromResource(r));
    }

    static toResourceFromEntity(entity) {
        return {
            type:        entity.type,
            amount:      entity.amount,
            description: entity.description,
            session_id:  entity.sessionId,
            category:    entity.category,
            payment_id:  entity.paymentId,
        };
    }
}
