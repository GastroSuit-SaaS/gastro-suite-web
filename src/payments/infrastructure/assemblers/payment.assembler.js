import { Payment } from '../../domain/models/payment.entity.js';

/**
 * Payments Infrastructure - Payment Assembler
 *
 * Transforma recursos crudos del API en entidades de dominio.
 * Nunca retorna datos crudos fuera de esta clase.
 */
export class PaymentAssembler {

    /**
     * Transforma un recurso individual del API en una entidad Payment.
     * @param {Object} resource - Recurso crudo del API.
     * @returns {Payment}
     */
    static toEntityFromResource(resource) {
        // TODO: map resource fields to Payment constructor parameters
        return new Payment({
            id: resource.id,
        });
    }

    /**
     * Valida la respuesta HTTP y transforma la colección de recursos en entidades.
     * @param {Object} response - Respuesta Axios (response.status, response.data).
     * @returns {Payment[]}
     */
    static toEntitiesFromResponse(response) {
        if (response.status !== 200) return [];
        // TODO: adjust extraction path if data is nested (e.g. response.data.items)
        return response.data.map(r => PaymentAssembler.toEntityFromResource(r));
    }
}
