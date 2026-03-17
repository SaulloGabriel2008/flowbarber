import {
    DEFAULT_WEEKLY_SCHEDULE,
    SLOT_INTERVAL_MINUTES,
    currency,
    digitsOnly,
    getInitials,
    getMonthKey,
    normalizeWeeklySchedule,
    sumBy,
    toNumber,
} from "./utils.js";

export const DEFAULT_BARBERSHOP_INFO = {
    name: "Atelier Prime Barber",
    slogan: "Agenda inteligente, atendimento preciso e visual de alto padrão.",
    phone: "(11) 99999-9999",
    address: "Rua do Estilo, 142 - Centro",
    mapsLink: "https://maps.google.com/",
    instagram: "@atelierprimebarber",
    heroBadge: "Experiência premium para cortes, barba e assinatura mensal",
};

export const DEFAULT_FEATURE_FLAGS = {
    subscriptionsEnabled: true,
    fiscalReportEnabled: true,
};

export const DEFAULT_SERVICES = [
    {
        id: "corte-classico",
        name: "Corte Clássico",
        description: "Acabamento social com finalização premium e consultoria de estilo.",
        duration: 45,
        price: 45,
        category: "Corte",
        highlight: true,
        active: true,
    },
    {
        id: "corte-degrade",
        name: "Degradê Premium",
        description: "Transição limpa com acabamento detalhado e alinhamento completo.",
        duration: 60,
        price: 55,
        category: "Corte",
        highlight: true,
        active: true,
    },
    {
        id: "barba-executiva",
        name: "Barba Executiva",
        description: "Modelagem, navalha e toalha quente para desenho preciso.",
        duration: 35,
        price: 35,
        category: "Barba",
        highlight: false,
        active: true,
    },
    {
        id: "combo-assinatura",
        name: "Combo Corte + Barba",
        description: "Serviço completo para manutenção de imagem em um único atendimento.",
        duration: 75,
        price: 80,
        category: "Combo",
        highlight: true,
        active: true,
    },
    {
        id: "pigmentacao",
        name: "Pigmentação",
        description: "Correção visual sutil para barba ou cabelo com acabamento natural.",
        duration: 30,
        price: 30,
        category: "Tratamento",
        highlight: false,
        active: true,
    },
    {
        id: "sobrancelha",
        name: "Sobrancelha",
        description: "Desenho discreto para reforçar expressão e limpeza do rosto.",
        duration: 20,
        price: 18,
        category: "Acabamento",
        highlight: false,
        active: true,
    },
];

export function createDefaultPublicBarber(override = {}) {
    const baseName = override.name || "Equipe Prime";
    const barberId = override.id || override.authUid || "owner";
    const normalized = normalizeBarber({
        id: barberId,
        role: "owner",
        active: true,
        acceptsBookings: true,
        commissionPercent: 35,
        serviceIds: DEFAULT_SERVICES.map((service) => service.id),
        weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
        color: "#c89b53",
        photoUrl: "",
        ...override,
    });
    return {
        ...normalized,
        publicProfile: createPublicBarberProfile(normalized),
        name: normalized.name || baseName,
    };
}

export function createPublicBarberProfile(barber) {
    const safeName = barber.name || "Barbeiro";
    return {
        id: barber.id,
        name: safeName,
        roleLabel: barber.role === "owner" ? "Master Barber / Dono" : "Barbeiro Especialista",
        headline: barber.headline || barber.specialty || "Especialista em cortes de alta definição",
        initials: getInitials(safeName),
        photoUrl: barber.photoUrl || "",
        color: barber.color || "#c89b53",
        acceptsBookings: barber.acceptsBookings !== false,
        active: barber.active !== false,
        serviceIds: barber.serviceIds || [],
        specialty: barber.specialty || "Degradês, acabamento e atendimento consultivo",
        rating: barber.rating || "4.9",
    };
}

export function normalizeService(raw = {}) {
    const id = raw.id || raw.serviceId || slugFromName(raw.name || raw.nome || "servico");
    const duration = Math.max(SLOT_INTERVAL_MINUTES, toNumber(raw.duration ?? raw.duracao, SLOT_INTERVAL_MINUTES));
    const price = toNumber(raw.price ?? raw.preco, 0);
    return {
        id,
        name: raw.name || raw.nome || "Serviço",
        description: raw.description || raw.descricao || "Atendimento profissional com acabamento premium.",
        duration,
        price,
        slots: Math.max(1, Math.ceil(duration / SLOT_INTERVAL_MINUTES)),
        category: raw.category || raw.categoria || "Serviço",
        active: raw.active !== false,
        highlight: Boolean(raw.highlight),
    };
}

export function normalizeBarber(raw = {}) {
    const id = raw.id || raw.authUid || raw.uid || slugFromName(raw.name || raw.nome || "barber");
    const weeklySchedule = normalizeWeeklySchedule(raw.weeklySchedule || raw.horarios || raw.schedule || {});
    return {
        id,
        authUid: raw.authUid || raw.uid || id,
        name: raw.name || raw.nome || "Barbeiro",
        email: raw.email || "",
        phone: raw.phone || raw.telefone || "",
        role: raw.role || "barber",
        headline: raw.headline || raw.frase || "",
        specialty: raw.specialty || raw.especialidade || "",
        active: raw.active !== false,
        acceptsBookings: raw.acceptsBookings !== false,
        commissionPercent: clampPercent(raw.commissionPercent ?? raw.comissao ?? 35),
        serviceIds: Array.isArray(raw.serviceIds) ? raw.serviceIds : [],
        weeklySchedule,
        daysOff: Array.isArray(raw.daysOff) ? raw.daysOff : [],
        photoUrl: raw.photoUrl || raw.foto || "",
        color: raw.color || raw.cor || "#c89b53",
        createdAt: raw.createdAt || null,
        updatedAt: raw.updatedAt || null,
    };
}

export function normalizeSubscriptionPlan(raw = {}) {
    const id = raw.id || slugFromName(raw.name || raw.nome || "plano");
    return {
        id,
        name: raw.name || raw.nome || "Plano Signature",
        price: toNumber(raw.price ?? raw.valor, 0),
        frequency: raw.frequency || raw.frequencia || "monthly",
        description: raw.description || raw.descricao || "Plano recorrente para manutenção do visual.",
        active: raw.active !== false,
        includedServiceIds: Array.isArray(raw.includedServiceIds) ? raw.includedServiceIds : Array.isArray(raw.serviceIds) ? raw.serviceIds : [],
        monthlyLimit: Math.max(1, toNumber(raw.monthlyLimit ?? raw.monthlyLimitPerService ?? 4, 4)),
    };
}

export function normalizeSubscription(raw = {}) {
    return {
        id: raw.id || "",
        clientId: raw.clientId || raw.userId || "",
        clientName: raw.clientName || raw.nomeCliente || raw.nome || "Cliente",
        clientPhone: raw.clientPhone || raw.telefone || "",
        status: raw.status || "active",
        active: (raw.status || "active") === "active",
        planId: raw.planId || raw.subscriptionPlanId || raw.plan?.id || "",
        planName: raw.planName || raw.plan?.name || raw.plan || "Plano ativo",
        planPrice: toNumber(raw.planPrice ?? raw.valor ?? raw.plan?.price, 0),
        frequency: raw.frequency || raw.plan?.frequency || "monthly",
        includedServiceIds: Array.isArray(raw.includedServiceIds) ? raw.includedServiceIds : Array.isArray(raw.plan?.includedServiceIds) ? raw.plan.includedServiceIds : [],
        monthlyLimit: Math.max(1, toNumber(raw.monthlyLimit ?? raw.plan?.monthlyLimit ?? 4, 4)),
        createdAt: raw.createdAt || raw.timestamp || null,
        nextBillingDate: raw.nextBillingDate || "",
        paymentStatus: raw.paymentStatus || (raw.pago ? "paid" : "pending"),
        notes: raw.notes || "",
    };
}

export function normalizeBooking(raw = {}, servicesMap = new Map(), barbersMap = new Map(), fallbackBarberId = "") {
    const service = servicesMap.get(raw.serviceId) || Array.from(servicesMap.values()).find((item) => item.name === (raw.servico || raw.serviceNameSnapshot));
    const fallbackBarber = barbersMap.get(fallbackBarberId) || barbersMap.values().next().value || createDefaultPublicBarber();
    const barber = barbersMap.get(raw.barberId) || fallbackBarber;
    const extras = Array.isArray(raw.extras) ? raw.extras.map(normalizeExtra) : [];
    const basePrice = toNumber(raw.priceSnapshot ?? raw.preco ?? service?.price, 0);
    const commissionPercent = clampPercent(raw.commissionPercent ?? barber?.commissionPercent ?? 35);
    const financials = calculateBookingFinancials({
        basePrice,
        extras,
        commissionPercent,
        isSubscription: Boolean(raw.isSubscription),
    });

    return {
        id: raw.id || "",
        userId: raw.userId || raw.clientId || "",
        clientId: raw.clientId || raw.userId || "",
        clientName: raw.clientName || raw.nome || raw.cliente || "Cliente",
        clientPhone: raw.clientPhone || raw.telefone || "",
        serviceId: raw.serviceId || service?.id || slugFromName(raw.servico || raw.serviceNameSnapshot || "servico"),
        serviceNameSnapshot: raw.serviceNameSnapshot || raw.servico || service?.name || "Serviço",
        barberId: raw.barberId || barber?.id || fallbackBarberId || "",
        barberNameSnapshot: raw.barberNameSnapshot || barber?.name || "Equipe Prime",
        data: raw.data || "",
        hora: raw.hora || "09:00",
        status: raw.status || "confirmed",
        slots: Math.max(1, toNumber(raw.slots ?? service?.slots ?? 1, 1)),
        duration: Math.max(SLOT_INTERVAL_MINUTES, toNumber(raw.duration ?? service?.duration ?? (raw.slots ? raw.slots * SLOT_INTERVAL_MINUTES : SLOT_INTERVAL_MINUTES), SLOT_INTERVAL_MINUTES)),
        priceSnapshot: basePrice,
        preco: basePrice,
        cashAmount: toNumber(raw.cashAmount, financials.cashAmount),
        productionAmount: toNumber(raw.productionAmount, financials.productionAmount),
        ownerCommissionAmount: toNumber(raw.ownerCommissionAmount, financials.ownerCommissionAmount),
        barberNetAmount: toNumber(raw.barberNetAmount, financials.barberNetAmount),
        commissionPercent,
        extras,
        notes: raw.notes || raw.observacoes || "",
        isSubscription: Boolean(raw.isSubscription),
        subscriptionId: raw.subscriptionId || "",
        subscriptionPlan: raw.subscriptionPlan || raw.planName || "",
        createdAt: raw.createdAt || raw.timestamp || null,
        updatedAt: raw.updatedAt || null,
        legacy: !raw.barberId || !raw.serviceId,
    };
}

export function normalizeExtra(raw = {}) {
    return {
        id: raw.id || slugFromName(raw.label || raw.nome || "extra"),
        label: raw.label || raw.nome || "Extra",
        price: toNumber(raw.price ?? raw.preco, 0),
    };
}

export function calculateBookingFinancials({ basePrice = 0, extras = [], commissionPercent = 35, isSubscription = false }) {
    const safeBasePrice = toNumber(basePrice, 0);
    const extrasTotal = sumBy(extras, (item) => item.price);
    const productionAmount = safeBasePrice + extrasTotal;
    const ownerCommissionAmount = productionAmount * (clampPercent(commissionPercent) / 100);
    const barberNetAmount = productionAmount - ownerCommissionAmount;
    const cashAmount = isSubscription ? extrasTotal : productionAmount;
    return {
        basePrice: safeBasePrice,
        extrasTotal,
        productionAmount,
        ownerCommissionAmount,
        barberNetAmount,
        cashAmount,
    };
}

export function isServiceAvailableForBarber(serviceId, barber) {
    if (!barber) return false;
    if (!Array.isArray(barber.serviceIds) || barber.serviceIds.length === 0) return true;
    return barber.serviceIds.includes(serviceId);
}

export function getBarbersForService(barbers, serviceId) {
    return barbers.filter((barber) => barber.active !== false && barber.acceptsBookings !== false && isServiceAvailableForBarber(serviceId, barber));
}

export function getPlanUsageForService(bookings, subscription, serviceId, monthKey = "") {
    const targetMonthKey = monthKey || getMonthKey(new Date().toISOString().slice(0, 10));
    const usage = bookings.filter((booking) => {
        return booking.userId === subscription.clientId
            && booking.isSubscription
            && booking.serviceId === serviceId
            && getMonthKey(booking.data) === targetMonthKey
            && booking.status !== "cancelled";
    }).length;
    return {
        used: usage,
        limit: subscription.monthlyLimit || 0,
        remaining: Math.max(0, (subscription.monthlyLimit || 0) - usage),
        eligible: Array.isArray(subscription.includedServiceIds) && subscription.includedServiceIds.includes(serviceId),
    };
}

export function buildUsersMap(users = []) {
    return new Map(users.map((user) => [user.id, user]));
}

export function createClientSummary(bookings, usersMap = new Map(), barbersMap = new Map()) {
    const grouped = new Map();
    bookings.forEach((booking) => {
        const key = booking.userId || digitsOnly(booking.clientPhone) || slugFromName(booking.clientName);
        if (!grouped.has(key)) {
            const user = usersMap.get(booking.userId) || {};
            grouped.set(key, {
                id: key,
                userId: booking.userId || "",
                name: user.nome || booking.clientName || "Cliente",
                phone: user.phone || booking.clientPhone || "",
                email: user.email || "",
                visits: 0,
                completedVisits: 0,
                cancelledVisits: 0,
                revenue: 0,
                lastBookingDate: "",
                favoriteBarberId: "",
                favoriteBarberName: "",
            });
        }

        const client = grouped.get(key);
        client.visits += 1;
        if (booking.status === "completed") {
            client.completedVisits += 1;
            client.revenue += toNumber(booking.cashAmount);
        }
        if (booking.status === "cancelled") {
            client.cancelledVisits += 1;
        }
        if (!client.lastBookingDate || booking.data > client.lastBookingDate) {
            client.lastBookingDate = booking.data;
        }
    });

    grouped.forEach((client) => {
        const clientBookings = bookings.filter((booking) => (booking.userId || digitsOnly(booking.clientPhone)) === (client.userId || digitsOnly(client.phone)));
        const barberCount = {};
        clientBookings.forEach((booking) => {
            barberCount[booking.barberId] = (barberCount[booking.barberId] || 0) + 1;
        });
        const favoriteBarberId = Object.entries(barberCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        client.favoriteBarberId = favoriteBarberId;
        client.favoriteBarberName = favoriteBarberId ? (barbersMap.get(favoriteBarberId)?.name || "") : "";
        client.averageTicket = client.completedVisits ? client.revenue / client.completedVisits : 0;
    });

    return Array.from(grouped.values()).sort((a, b) => (b.lastBookingDate || "").localeCompare(a.lastBookingDate || ""));
}

export function summarizeDashboard(bookings, barbers) {
    const activeBookings = bookings.filter((booking) => booking.status !== "cancelled");
    const completed = activeBookings.filter((booking) => booking.status === "completed");
    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = activeBookings.filter((booking) => booking.data === today);

    return {
        totalBookings: activeBookings.length,
        todayBookings: todayBookings.length,
        completedBookings: completed.length,
        cashRevenue: sumBy(completed, (booking) => booking.cashAmount),
        productionRevenue: sumBy(completed, (booking) => booking.productionAmount),
        ownerCommission: sumBy(completed, (booking) => booking.ownerCommissionAmount),
        barberNet: sumBy(completed, (booking) => booking.barberNetAmount),
        activeBarbers: barbers.filter((barber) => barber.active !== false).length,
    };
}

export function formatPlanHeadline(plan) {
    return `${plan.name} · ${currency(plan.price)} / ${translateFrequency(plan.frequency)}`;
}

export function translateFrequency(value) {
    const map = {
        monthly: "mês",
        quarterly: "trimestre",
        semiannual: "semestre",
        annual: "ano",
    };
    return map[value] || value || "mês";
}

function slugFromName(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "item";
}

function clampPercent(value) {
    return Math.max(0, Math.min(100, toNumber(value, 0)));
}
