export const ALL_ZONES = 'all'
export const TAKEAWAY_FILTER = 'takeaway'
export const DELIVERY_FILTER = 'delivery'

export function buildZoneFilterOptions(zones = [], activeOrders = []) {
    const options = [{ label: 'Todas las zonas', value: ALL_ZONES }]

    for (const zone of zones) {
        options.push({ label: zone.name, value: String(zone.id) })
    }

    if (activeOrders.some((order) => order.isTakeaway)) {
        options.push({ label: 'Para llevar', value: TAKEAWAY_FILTER })
    }

    if (activeOrders.some((order) => order.isDelivery)) {
        options.push({ label: 'Delivery', value: DELIVERY_FILTER })
    }

    return options
}

export function orderZoneId(order, tableById) {
    return order.zoneId ?? tableById(order.tableId)?.zoneId ?? null
}

export function filterActiveOrders(orders = [], zoneFilter, tableById) {
    if (zoneFilter === ALL_ZONES) return orders
    if (zoneFilter === TAKEAWAY_FILTER) return orders.filter((order) => order.isTakeaway)
    if (zoneFilter === DELIVERY_FILTER) return orders.filter((order) => order.isDelivery)

    return orders.filter((order) => {
        if (order.isOffPremise) return false
        return String(orderZoneId(order, tableById)) === String(zoneFilter)
    })
}

/** Zona destino al crear orden desde el terminal (respeta filtro activo). */
export function resolveNewOrderZoneId(zoneFilter, zones = []) {
    if (zoneFilter !== ALL_ZONES && zoneFilter !== TAKEAWAY_FILTER && zoneFilter !== DELIVERY_FILTER) {
        const match = zones.find((zone) => String(zone.id) === String(zoneFilter))
        if (match) return match.id
    }
    return zones[0]?.id ?? null
}

export function deliveryStatusLabel(status) {
    switch (status) {
        case 'pending':    return 'Pendiente'
        case 'dispatched': return 'En camino'
        case 'delivered':  return 'Entregado'
        case 'cancelled':  return 'Cancelado'
        default:           return '—'
    }
}
