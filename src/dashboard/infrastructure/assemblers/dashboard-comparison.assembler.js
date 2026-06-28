import { DashboardComparison } from '../../domain/models/dashboard-comparison.entity.js';

export class DashboardComparisonAssembler {
    static fromApiResponse(raw) {
        if (!raw) return null;
        return new DashboardComparison({
            businessDate: raw.businessDate ?? null,
            compareWith: raw.compareWith ?? 'yesterday',
            compareDate: raw.compareDate ?? null,
            timezone: raw.timezone ?? 'America/Lima',
            revenue: raw.revenue,
            paymentCount: raw.paymentCount,
            avgTicket: raw.avgTicket,
            covers: raw.covers,
            cancellations: raw.cancellations,
            hourlyCurrent: raw.hourlyCurrent ?? [],
            hourlyPrevious: raw.hourlyPrevious ?? [],
            channels: raw.channels ?? [],
            topItems: raw.topItems ?? [],
            summary: raw.summary ?? {},
        });
    }
}
