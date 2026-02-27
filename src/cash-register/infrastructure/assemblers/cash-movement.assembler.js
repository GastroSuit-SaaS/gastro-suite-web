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
            registerId:  resource.registerId  ?? resource.register_id ?? null,
            userId:      resource.userId      ?? resource.user_id     ?? null,
            createdAt:   resource.createdAt   ?? resource.created_at  ?? null,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        return response.data.map(r => CashMovementAssembler.toEntityFromResource(r));
    }
}
