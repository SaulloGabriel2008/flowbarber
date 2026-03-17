export const SLOT_INTERVAL_MINUTES = 30;

export const WEEKDAY_KEYS = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
];

export const DEFAULT_WEEKLY_SCHEDULE = {
    domingo: { opens: false, start: "09:00", end: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
    segunda: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
    terca: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
    quarta: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
    quinta: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
    sexta: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
    sabado: { opens: true, start: "09:00", end: "17:00", lunchStart: "12:00", lunchEnd: "13:00" },
};

export function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function currency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(toNumber(value));
}

export function percent(value) {
    return `${toNumber(value).toFixed(0)}%`;
}

export function titleCase(text) {
    return String(text || "")
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join(" ");
}

export function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
}

export function formatPhone(value) {
    const digits = digitsOnly(value);
    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return value || "";
}

export function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = String(time).split(":").map((part) => toNumber(part));
    return (hours * 60) + minutes;
}

export function minutesToTime(totalMinutes) {
    const safeMinutes = Math.max(0, totalMinutes);
    const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
    const minutes = String(safeMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
}

export function getTodayISO() {
    const now = new Date();
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");
}

export function addDays(dateISO, amount) {
    const date = new Date(`${dateISO}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
    ].join("-");
}

export function formatDate(dateISO, options = {}) {
    if (!dateISO) return "";
    const date = new Date(`${dateISO}T12:00:00`);
    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...options,
    });
}

export function formatDateLong(dateISO) {
    if (!dateISO) return "";
    const date = new Date(`${dateISO}T12:00:00`);
    return date.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
    });
}

export function formatDateTime(dateISO, time) {
    return `${formatDate(dateISO)} às ${time || "--:--"}`;
}

export function getWeekdayKey(dateISO) {
    const date = new Date(`${dateISO}T12:00:00`);
    return WEEKDAY_KEYS[date.getDay()];
}

export function getMonthKey(dateISO) {
    return String(dateISO || "").slice(0, 7);
}

export function compareBookings(a, b) {
    const left = `${a.data || ""}T${a.hora || "00:00"}:00`;
    const right = `${b.data || ""}T${b.hora || "00:00"}:00`;
    return new Date(left) - new Date(right);
}

export function normalizeWeeklySchedule(rawSchedule = {}, fallback = DEFAULT_WEEKLY_SCHEDULE) {
    const normalized = {};
    WEEKDAY_KEYS.forEach((dayKey) => {
        const source = rawSchedule?.[dayKey] || {};
        const base = fallback?.[dayKey] || DEFAULT_WEEKLY_SCHEDULE[dayKey];
        normalized[dayKey] = {
            opens: source.opens ?? source.abre ?? base.opens ?? base.abre ?? true,
            start: source.start || source.abertura || base.start || base.abertura || "09:00",
            end: source.end || source.fechamento || base.end || base.fechamento || "18:00",
            lunchStart: source.lunchStart || source.almocoInicio || base.lunchStart || base.almocoInicio || "12:00",
            lunchEnd: source.lunchEnd || source.almocoFim || base.lunchEnd || base.almocoFim || "13:00",
        };
    });
    return normalized;
}

export function buildTimeSlots(schedule, durationMinutes, stepMinutes = SLOT_INTERVAL_MINUTES) {
    if (!schedule?.opens) return [];
    const openMinutes = timeToMinutes(schedule.start);
    const closeMinutes = timeToMinutes(schedule.end);
    const lunchStart = timeToMinutes(schedule.lunchStart);
    const lunchEnd = timeToMinutes(schedule.lunchEnd);
    const duration = Math.max(stepMinutes, toNumber(durationMinutes, stepMinutes));
    const results = [];

    for (let cursor = openMinutes; cursor + duration <= closeMinutes; cursor += stepMinutes) {
        const appointmentEnd = cursor + duration;
        const overlapsLunch = lunchStart < lunchEnd && cursor < lunchEnd && appointmentEnd > lunchStart;
        if (overlapsLunch) continue;
        results.push(minutesToTime(cursor));
    }

    return results;
}

export function isPastSlot(dateISO, time) {
    const candidate = new Date(`${dateISO}T${time}:00`);
    return candidate.getTime() < Date.now();
}

export function chunk(array, size) {
    const groups = [];
    for (let index = 0; index < array.length; index += size) {
        groups.push(array.slice(index, index + size));
    }
    return groups;
}

export function unique(array) {
    return Array.from(new Set(array));
}

export function sumBy(items, selector) {
    return items.reduce((total, item) => total + toNumber(selector(item)), 0);
}

export function parseFirestoreDate(value) {
    if (!value) return null;
    if (typeof value === "string") return new Date(value);
    if (value?.toDate) return value.toDate();
    if (value instanceof Date) return value;
    return null;
}

export function formatCount(value, singular, plural) {
    const amount = toNumber(value);
    return `${amount} ${amount === 1 ? singular : plural}`;
}

export function getInitials(name) {
    return String(name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");
}

export function makeId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
