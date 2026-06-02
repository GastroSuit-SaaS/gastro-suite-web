import { appendOutbox, loadOutbox, removeOutboxEntry, saveOutbox } from '../../shared/infrustructure/offline/outbox-storage.js';
import { isNetworkOnline, notifyOutboxChanged } from '../../shared/infrustructure/offline/network.js';
import { SaleAssembler, isPersistedSaleId } from '../infrastructure/assemblers/sale.assembler.js';
import { StationTicketAssembler } from '../../stations/infrastructure/assemblers/station-ticket.assembler.js';

export { isNetworkOnline };

function resolveSaleId(saleId, idMap) {
    if (saleId == null) return saleId;
    const key = String(saleId);
    return idMap.get(key) ?? idMap.get(saleId) ?? saleId;
}

export function queueCreateSale(sale, branchId) {
    const tempId = sale.id;
    const existing = loadOutbox().some(
        e => e.type === 'CREATE_SALE' && e.payload?.tempId === tempId,
    );
    if (existing) return;

    appendOutbox({
        type: 'CREATE_SALE',
        branchId,
        payload: {
            tempId,
            resource: SaleAssembler.toCreateResource(sale),
        },
    });
    notifyOutboxChanged();
}

export function queueUpdateSale(sale) {
    if (!sale?.id) return;

    appendOutbox({
        type: 'UPDATE_SALE',
        payload: {
            saleId: sale.id,
            resource: SaleAssembler.toUpdateResource(sale, { includeItems: true }),
        },
    });
    notifyOutboxChanged();
}

export function queueDispatchToStations(saleId) {
    if (saleId == null) return;

    const list = loadOutbox().filter(
        e => !(e.type === 'DISPATCH_TO_STATIONS' && e.payload?.saleId === saleId),
    );
    list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        type: 'DISPATCH_TO_STATIONS',
        payload: { saleId },
    });
    saveOutbox(list);
    notifyOutboxChanged();
}

/**
 * Reproduce la cola local contra el API (orden FIFO).
 * @param {{
 *   create: Function,
 *   update: Function,
 *   dispatch: Function,
 *   applySaleToStore: Function,
 *   mergeKitchenTickets?: Function,
 *   refreshKitchenTickets?: Function,
 *   sales: { value: Array },
 * }} deps
 */
export async function replayOfflineOutbox(deps) {
    if (!isNetworkOnline()) return { replayed: 0, failed: null };

    const queue = loadOutbox();
    const idMap = new Map();
    let replayed = 0;

    for (const entry of queue) {
        try {
            if (entry.type === 'CREATE_SALE') {
                const response = await deps.create(entry.payload.resource);
                const saved = SaleAssembler.toEntityFromResponse(response);
                if (saved?.id && entry.payload.tempId != null) {
                    idMap.set(String(entry.payload.tempId), saved.id);
                    deps.applySaleToStore(saved, entry.payload.tempId);
                    const idx = deps.sales.value.findIndex(
                        s => s.id === entry.payload.tempId,
                    );
                    if (idx !== -1) deps.sales.value[idx] = saved;
                }
            } else if (entry.type === 'UPDATE_SALE') {
                const saleId = resolveSaleId(entry.payload.saleId, idMap);
                if (!isPersistedSaleId(saleId)) continue;
                const response = await deps.update(saleId, entry.payload.resource);
                const saved = SaleAssembler.toEntityFromResponse(response);
                if (saved?.id) deps.applySaleToStore(saved, saleId);
            } else if (entry.type === 'DISPATCH_TO_STATIONS') {
                const saleId = resolveSaleId(entry.payload.saleId, idMap);
                if (!isPersistedSaleId(saleId)) continue;
                const response = await deps.dispatch(saleId);
                const { sale: saved, tickets } = SaleAssembler.fromDispatchResponse(response);
                if (saved) deps.applySaleToStore(saved, saleId);
                if (tickets?.length && deps.mergeKitchenTickets) {
                    deps.mergeKitchenTickets(
                        tickets.map(r => StationTicketAssembler.toEntityFromResource(r)),
                    );
                }
                if (deps.refreshKitchenTickets) {
                    await deps.refreshKitchenTickets();
                }
            } else {
                continue;
            }
            removeOutboxEntry(entry.id);
            replayed += 1;
        } catch (e) {
            notifyOutboxChanged();
            return { replayed, failed: e };
        }
    }

    notifyOutboxChanged();
    return { replayed, failed: null };
}
