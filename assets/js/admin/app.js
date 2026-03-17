import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";
import { auth, bootstrapOwnerEmail, db, functions, vapidKey } from "../shared/firebase.js";
import {
    DEFAULT_BARBERSHOP_INFO,
    DEFAULT_FEATURE_FLAGS,
    DEFAULT_SERVICES,
    calculateBookingFinancials,
    createClientSummary,
    normalizeBarber,
    normalizeBooking,
    normalizeService,
    normalizeSubscription,
    normalizeSubscriptionPlan,
    summarizeDashboard,
} from "../shared/data.js";
import {
    DEFAULT_WEEKLY_SCHEDULE,
    compareBookings,
    currency,
    digitsOnly,
    escapeHtml,
    formatDate,
    formatDateTime,
    formatPhone,
    getTodayISO,
    normalizeWeeklySchedule,
    parseFirestoreDate,
    timeToMinutes,
    toNumber,
} from "../shared/utils.js";

const refs = {
    loginScreen: document.getElementById("login-screen"),
    loginForm: document.getElementById("login-form"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    loginError: document.getElementById("login-error"),
    adminApp: document.getElementById("admin-app"),
    sidebarBrandName: document.getElementById("sidebar-brand-name"),
    profileName: document.getElementById("profile-name"),
    profileRole: document.getElementById("profile-role"),
    viewTitle: document.getElementById("view-title"),
    todayLabel: document.getElementById("today-label"),
    refreshButton: document.getElementById("refresh-button"),
    logoutButton: document.getElementById("logout-button"),
    navButtons: Array.from(document.querySelectorAll(".nav-item")),
    views: Array.from(document.querySelectorAll(".view")),
    ownerOnly: Array.from(document.querySelectorAll(".owner-only")),
    ownerOnlyBlocks: Array.from(document.querySelectorAll(".owner-only-block")),
    ownerOnlyViews: Array.from(document.querySelectorAll(".owner-only-view")),
    ownerOnlyInline: Array.from(document.querySelectorAll(".owner-only-inline")),
    dashboardBarberFilter: document.getElementById("dashboard-barber-filter"),
    dashboardKpis: document.getElementById("dashboard-kpis"),
    dashboardBarberCards: document.getElementById("dashboard-barber-cards"),
    dashboardUpcoming: document.getElementById("dashboard-upcoming"),
    agendaDate: document.getElementById("agenda-date"),
    agendaBarberFilter: document.getElementById("agenda-barber-filter"),
    agendaBookingsList: document.getElementById("agenda-bookings-list"),
    quickBookingForm: document.getElementById("quick-booking-form"),
    quickClientName: document.getElementById("quick-client-name"),
    quickClientPhone: document.getElementById("quick-client-phone"),
    quickServiceId: document.getElementById("quick-service-id"),
    quickBarberId: document.getElementById("quick-barber-id"),
    quickBookingTime: document.getElementById("quick-booking-time"),
    quickBookingNotes: document.getElementById("quick-booking-notes"),
    agendaBookingDetail: document.getElementById("agenda-booking-detail"),
    clientsTableBody: document.getElementById("clients-table-body"),
    financeKpis: document.getElementById("finance-kpis"),
    expenseForm: document.getElementById("expense-form"),
    expenseDescription: document.getElementById("expense-description"),
    expenseCategory: document.getElementById("expense-category"),
    expenseValue: document.getElementById("expense-value"),
    entryForm: document.getElementById("entry-form"),
    entryDescription: document.getElementById("entry-description"),
    entryValue: document.getElementById("entry-value"),
    commissionBoard: document.getElementById("commission-board"),
    financeLedger: document.getElementById("finance-ledger"),
    planForm: document.getElementById("plan-form"),
    planEditId: document.getElementById("plan-edit-id"),
    planName: document.getElementById("plan-name"),
    planPrice: document.getElementById("plan-price"),
    planFrequency: document.getElementById("plan-frequency"),
    planMonthlyLimit: document.getElementById("plan-monthly-limit"),
    planDescription: document.getElementById("plan-description"),
    planServicesChecklist: document.getElementById("plan-services-checklist"),
    plansAdminList: document.getElementById("plans-admin-list"),
    subscriptionsAdminList: document.getElementById("subscriptions-admin-list"),
    serviceForm: document.getElementById("service-form"),
    serviceEditId: document.getElementById("service-edit-id"),
    serviceName: document.getElementById("service-name"),
    servicePrice: document.getElementById("service-price"),
    serviceDuration: document.getElementById("service-duration"),
    serviceCategory: document.getElementById("service-category"),
    serviceDescription: document.getElementById("service-description"),
    servicesAdminList: document.getElementById("services-admin-list"),
    barberForm: document.getElementById("barber-form"),
    barberEditId: document.getElementById("barber-edit-id"),
    barberName: document.getElementById("barber-name"),
    barberEmail: document.getElementById("barber-email"),
    barberPassword: document.getElementById("barber-password"),
    barberPhone: document.getElementById("barber-phone"),
    barberRole: document.getElementById("barber-role"),
    barberCommission: document.getElementById("barber-commission"),
    barberColor: document.getElementById("barber-color"),
    barberHeadline: document.getElementById("barber-headline"),
    barberActive: document.getElementById("barber-active"),
    barberAcceptsBookings: document.getElementById("barber-accepts-bookings"),
    barberDaysOff: document.getElementById("barber-days-off"),
    barberServicesChecklist: document.getElementById("barber-services-checklist"),
    barberScheduleEditor: document.getElementById("barber-schedule-editor"),
    barbersAdminList: document.getElementById("barbers-admin-list"),
    shopForm: document.getElementById("shop-form"),
    shopName: document.getElementById("shop-name"),
    shopSlogan: document.getElementById("shop-slogan"),
    shopPhone: document.getElementById("shop-phone"),
    shopAddress: document.getElementById("shop-address"),
    shopMaps: document.getElementById("shop-maps"),
    featureSubscriptions: document.getElementById("feature-subscriptions"),
    featureFiscal: document.getElementById("feature-fiscal"),
    runMigrationButton: document.getElementById("run-migration-button"),
    toastRegion: document.getElementById("toast-region"),
};

const state = {
    user: null,
    profile: null,
    role: "",
    currentView: "dashboard",
    rawBookings: [],
    bookings: [],
    barbers: [],
    services: [],
    users: [],
    subscriptions: [],
    plans: [],
    expenses: [],
    entries: [],
    settings: {
        barbershop: { ...DEFAULT_BARBERSHOP_INFO },
        features: { ...DEFAULT_FEATURE_FLAGS },
    },
    selectedAgendaBookingId: "",
    bootstrappedServices: false,
};

const listeners = [];

const callUpsertBarberAccount = httpsCallable(functions, "upsertBarberAccount");
const callMigrateLegacyData = httpsCallable(functions, "migrateLegacyData");

init();

function init() {
    refs.todayLabel.textContent = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
    refs.agendaDate.value = getTodayISO();
    refs.agendaDate.min = getTodayISO();
    registerServiceWorker();
    bindEvents();
    observeAuth();
}

function bindEvents() {
    refs.loginForm.addEventListener("submit", handleLogin);
    refs.logoutButton.addEventListener("click", async () => {
        await signOut(auth);
    });
    refs.refreshButton.addEventListener("click", () => renderCurrentView());
    refs.navButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    refs.dashboardBarberFilter.addEventListener("change", renderDashboard);
    refs.agendaDate.addEventListener("change", renderAgenda);
    refs.agendaBarberFilter.addEventListener("change", renderAgenda);
    refs.quickBookingForm.addEventListener("submit", saveQuickBooking);
    refs.expenseForm.addEventListener("submit", saveExpense);
    refs.entryForm.addEventListener("submit", saveEntry);
    refs.planForm.addEventListener("submit", savePlan);
    refs.serviceForm.addEventListener("submit", saveService);
    refs.barberForm.addEventListener("submit", saveBarber);
    refs.shopForm.addEventListener("submit", saveSettings);
    refs.runMigrationButton.addEventListener("click", runMigration);
    refs.agendaBookingsList.addEventListener("click", handleAgendaSelection);
    refs.agendaBookingDetail.addEventListener("click", handleBookingDetailActions);
    refs.plansAdminList.addEventListener("click", handlePlanActions);
    refs.subscriptionsAdminList.addEventListener("click", handleSubscriptionActions);
    refs.servicesAdminList.addEventListener("click", handleServiceActions);
    refs.barbersAdminList.addEventListener("click", handleBarberActions);
}

function observeAuth() {
    onAuthStateChanged(auth, async (user) => {
        cleanupListeners();
        if (!user) {
            state.user = null;
            state.profile = null;
            state.role = "";
            refs.loginScreen.classList.remove("hidden");
            refs.adminApp.classList.add("hidden");
            return;
        }

        state.user = user;
        try {
            state.profile = await ensureStaffProfile(user);
            state.role = state.profile.role || "barber";
            refs.loginError.classList.add("hidden");
            refs.loginScreen.classList.add("hidden");
            refs.adminApp.classList.remove("hidden");
            applyRoleVisibility();
            hydrateProfileUI();
            subscribeData();
            await enableNotifications();
        } catch (error) {
            console.error(error);
            refs.loginError.textContent = error.message || "Usuário não autorizado para o painel.";
            refs.loginError.classList.remove("hidden");
            await signOut(auth);
        }
    });
}

async function handleLogin(event) {
    event.preventDefault();
    refs.loginError.classList.add("hidden");
    try {
        await signInWithEmailAndPassword(auth, refs.loginEmail.value.trim(), refs.loginPassword.value.trim());
    } catch (error) {
        console.error(error);
        refs.loginError.textContent = "Não foi possível autenticar com essas credenciais.";
        refs.loginError.classList.remove("hidden");
    }
}

async function ensureStaffProfile(user) {
    const barberRef = doc(db, "barbers", user.uid);
    const barberSnap = await getDoc(barberRef);
    if (barberSnap.exists()) {
        return normalizeBarber({ id: barberSnap.id, authUid: barberSnap.id, ...barberSnap.data() });
    }

    if (String(user.email || "").toLowerCase() !== bootstrapOwnerEmail.toLowerCase()) {
        throw new Error("Seu usuário não possui perfil cadastrado no painel.");
    }

    const ownerProfile = normalizeBarber({
        id: user.uid,
        authUid: user.uid,
        name: user.displayName || "Administrador",
        email: user.email || "",
        role: "owner",
        active: true,
        acceptsBookings: true,
        commissionPercent: 35,
        serviceIds: DEFAULT_SERVICES.map((service) => service.id),
        weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
        color: "#c89b53",
        headline: "Dono da operação e barbeiro master.",
    });

    await persistBarberProfile(ownerProfile);
    return ownerProfile;
}

function applyRoleVisibility() {
    const owner = state.role === "owner";
    refs.ownerOnly.forEach((item) => item.classList.toggle("hidden-owner", !owner));
    refs.ownerOnlyBlocks.forEach((item) => item.classList.toggle("hidden-owner", !owner));
    refs.ownerOnlyViews.forEach((item) => item.classList.toggle("hidden-owner", !owner));
    refs.ownerOnlyInline.forEach((item) => item.classList.toggle("hidden-owner", !owner));

    if (!owner && !["dashboard", "agenda"].includes(state.currentView)) {
        setView("dashboard");
    } else {
        setView(state.currentView);
    }
}

function hydrateProfileUI() {
    refs.profileName.textContent = state.profile.name;
    refs.profileRole.textContent = state.role === "owner" ? "Dono / visão completa" : "Barbeiro / visão restrita";
    refs.sidebarBrandName.textContent = state.settings.barbershop.name || DEFAULT_BARBERSHOP_INFO.name;
}

function cleanupListeners() {
    while (listeners.length) {
        const unsubscribe = listeners.pop();
        if (typeof unsubscribe === "function") unsubscribe();
    }
}

function subscribeData() {
    listeners.push(onSnapshot(collection(db, "services"), async (snapshot) => {
        state.services = snapshot.docs.map((item) => normalizeService({ id: item.id, ...item.data() })).filter((item) => item.active !== false);
        if (state.role === "owner" && !state.services.length && !state.bootstrappedServices) {
            state.bootstrappedServices = true;
            await seedDefaultServices();
            return;
        }
        populateServiceControls();
        refreshDerivedBookings();
        renderCurrentView();
    }));

    listeners.push(onSnapshot(doc(db, "configuracoes_gerais", "barbearia"), (snapshot) => {
        state.settings.barbershop = snapshot.exists()
            ? {
                ...DEFAULT_BARBERSHOP_INFO,
                name: snapshot.data().barberName || DEFAULT_BARBERSHOP_INFO.name,
                slogan: snapshot.data().slogan || DEFAULT_BARBERSHOP_INFO.slogan,
                phone: snapshot.data().barberPhone || DEFAULT_BARBERSHOP_INFO.phone,
                address: snapshot.data().barberAddress || DEFAULT_BARBERSHOP_INFO.address,
                mapsLink: snapshot.data().barberMapsLink || DEFAULT_BARBERSHOP_INFO.mapsLink,
            }
            : { ...DEFAULT_BARBERSHOP_INFO };
        refs.sidebarBrandName.textContent = state.settings.barbershop.name;
        populateSettingsForm();
    }));

    listeners.push(onSnapshot(doc(db, "configuracoes_gerais", "features"), (snapshot) => {
        state.settings.features = snapshot.exists()
            ? {
                subscriptionsEnabled: snapshot.data().subscriptionsEnabled ?? DEFAULT_FEATURE_FLAGS.subscriptionsEnabled,
                fiscalReportEnabled: snapshot.data().fiscalReportEnabled ?? DEFAULT_FEATURE_FLAGS.fiscalReportEnabled,
            }
            : { ...DEFAULT_FEATURE_FLAGS };
        populateSettingsForm();
        renderCurrentView();
    }));

    if (state.role === "owner") {
        listeners.push(onSnapshot(collection(db, "barbers"), (snapshot) => {
            state.barbers = snapshot.docs.map((item) => normalizeBarber({ id: item.id, authUid: item.id, ...item.data() }));
            populateBarberControls();
            refreshDerivedBookings();
            renderCurrentView();
        }));
        listeners.push(onSnapshot(collection(db, "agendamentos"), (snapshot) => {
            state.rawBookings = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            refreshDerivedBookings();
            renderCurrentView();
        }));
        listeners.push(onSnapshot(collection(db, "users"), (snapshot) => {
            state.users = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            renderClients();
        }));
        listeners.push(onSnapshot(collection(db, "assinaturas"), (snapshot) => {
            state.subscriptions = snapshot.docs.map((item) => normalizeSubscription({ id: item.id, ...item.data() }));
            renderSubscriptions();
            renderDashboard();
        }));
        listeners.push(onSnapshot(collection(db, "subscription_plans"), (snapshot) => {
            state.plans = snapshot.docs.map((item) => normalizeSubscriptionPlan({ id: item.id, ...item.data() })).filter((item) => item.active !== false);
            populatePlanControls();
            renderSubscriptions();
        }));
        listeners.push(onSnapshot(collection(db, "despesas"), (snapshot) => {
            state.expenses = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            renderFinances();
        }));
        listeners.push(onSnapshot(collection(db, "entradas_produtos"), (snapshot) => {
            state.entries = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            renderFinances();
        }));
    } else {
        listeners.push(onSnapshot(doc(db, "barbers", state.profile.id), (snapshot) => {
            if (snapshot.exists()) {
                state.profile = normalizeBarber({ id: snapshot.id, authUid: snapshot.id, ...snapshot.data() });
                state.barbers = [state.profile];
                hydrateProfileUI();
                populateBarberControls();
                refreshDerivedBookings();
                renderCurrentView();
            }
        }));
        listeners.push(onSnapshot(query(collection(db, "agendamentos"), where("barberId", "==", state.profile.id)), (snapshot) => {
            state.rawBookings = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
            refreshDerivedBookings();
            renderCurrentView();
        }));
    }
}

async function seedDefaultServices() {
    for (const service of DEFAULT_SERVICES.map(normalizeService)) {
        await setDoc(doc(db, "services", service.id), {
            name: service.name,
            description: service.description,
            duration: service.duration,
            price: service.price,
            category: service.category,
            active: true,
            highlight: service.highlight,
            createdAt: serverTimestamp(),
        }, { merge: true });
    }
}

function refreshDerivedBookings() {
    const servicesMap = new Map(state.services.map((item) => [item.id, item]));
    const barbersMap = new Map(state.barbers.map((item) => [item.id, item]));
    const defaultBarberId = state.barbers[0]?.id || state.profile?.id || "";
    state.bookings = state.rawBookings
        .map((item) => normalizeBooking(item, servicesMap, barbersMap, defaultBarberId))
        .sort(compareBookings);
}

function setView(view) {
    state.currentView = view;
    refs.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    refs.views.forEach((section) => section.classList.toggle("active", section.id === `view-${view}`));
    refs.viewTitle.textContent = {
        dashboard: "Dashboard",
        agenda: "Agenda",
        clients: "Clientes",
        finances: "Finanças",
        subscriptions: "Assinaturas",
        services: "Serviços",
        barbers: "Barbeiros",
        settings: "Configurações",
    }[view] || "Painel";
    renderCurrentView();
}

function renderCurrentView() {
    renderDashboard();
    renderAgenda();
    if (state.role === "owner") {
        renderClients();
        renderFinances();
        renderSubscriptions();
        renderServices();
        renderBarbers();
        populateSettingsForm();
    }
}

function renderDashboard() {
    const ownerView = state.role === "owner";
    const scopedBarberId = ownerView ? (refs.dashboardBarberFilter.value || "all") : state.profile?.id;
    const scopedBookings = scopedBarberId && scopedBarberId !== "all"
        ? state.bookings.filter((item) => item.barberId === scopedBarberId)
        : state.bookings;
    const scopedBarbers = scopedBarberId && scopedBarberId !== "all"
        ? state.barbers.filter((item) => item.id === scopedBarberId)
        : state.barbers;
    const metrics = summarizeDashboard(scopedBookings, scopedBarbers);

    refs.dashboardKpis.innerHTML = [
        { label: "Agendamentos hoje", value: metrics.todayBookings },
        { label: "Concluídos", value: metrics.completedBookings },
        { label: "Caixa de serviços", value: currency(metrics.cashRevenue) },
        { label: "Comissão do dono", value: currency(metrics.ownerCommission) },
    ].map((metric) => `
        <article class="kpi-card">
            <span>${escapeHtml(metric.label)}</span>
            <strong>${escapeHtml(String(metric.value))}</strong>
        </article>
    `).join("");

    const groupedByBarber = state.barbers.map((barber) => {
        const completed = state.bookings.filter((booking) => booking.barberId === barber.id && booking.status === "completed");
        return {
            barber,
            appointments: completed.length,
            production: completed.reduce((sum, item) => sum + toNumber(item.productionAmount), 0),
            commission: completed.reduce((sum, item) => sum + toNumber(item.ownerCommissionAmount), 0),
            net: completed.reduce((sum, item) => sum + toNumber(item.barberNetAmount), 0),
        };
    }).sort((left, right) => right.production - left.production);

    refs.dashboardBarberCards.innerHTML = groupedByBarber.map((item) => `
        <article class="stack-card">
            <header>
                <div>
                    <strong>${escapeHtml(item.barber.name)}</strong>
                    <small>${item.appointments} concluído(s)</small>
                </div>
                <span class="status-pill confirmed">${escapeHtml(String(item.barber.commissionPercent))}%</span>
            </header>
            <p>Produção: ${currency(item.production)}</p>
            <p>Comissão dono: ${currency(item.commission)}</p>
            <p>Líquido barbeiro: ${currency(item.net)}</p>
        </article>
    `).join("") || `<div class="empty-state">Nenhum barbeiro cadastrado.</div>`;

    const upcoming = scopedBookings
        .filter((booking) => booking.status !== "cancelled" && `${booking.data}T${booking.hora}` >= `${getTodayISO()}T00:00`)
        .slice(0, 8);

    refs.dashboardUpcoming.innerHTML = upcoming.map((booking) => `
        <article class="stack-card">
            <header>
                <div>
                    <strong>${escapeHtml(booking.clientName)}</strong>
                    <small>${escapeHtml(booking.serviceNameSnapshot)}</small>
                </div>
                <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
            </header>
            <p>${escapeHtml(booking.barberNameSnapshot)} · ${formatDateTime(booking.data, booking.hora)}</p>
        </article>
    `).join("") || `<div class="empty-state">Sem atendimentos futuros neste escopo.</div>`;
}

function renderAgenda() {
    const selectedDate = refs.agendaDate.value || getTodayISO();
    const selectedBarberId = state.role === "owner" ? (refs.agendaBarberFilter.value || "all") : state.profile?.id;

    const filtered = state.bookings.filter((booking) => {
        const dateMatch = booking.data === selectedDate;
        const barberMatch = !selectedBarberId || selectedBarberId === "all" || booking.barberId === selectedBarberId;
        return dateMatch && barberMatch;
    });

    refs.agendaBookingsList.innerHTML = filtered.map((booking) => `
        <article class="agenda-card ${state.selectedAgendaBookingId === booking.id ? "active" : ""}" data-booking-id="${booking.id}">
            <header>
                <div>
                    <strong>${escapeHtml(booking.hora)} · ${escapeHtml(booking.clientName)}</strong>
                    <small>${escapeHtml(booking.serviceNameSnapshot)} · ${escapeHtml(booking.barberNameSnapshot)}</small>
                </div>
                <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
            </header>
            <p>${currency(booking.cashAmount)} · ${escapeHtml(booking.clientPhone || "sem telefone")}</p>
        </article>
    `).join("") || `<div class="empty-state">Nenhum atendimento nesta data.</div>`;

    if (!filtered.some((booking) => booking.id === state.selectedAgendaBookingId)) {
        state.selectedAgendaBookingId = filtered[0]?.id || "";
    }
    renderAgendaDetail();
}

function renderAgendaDetail() {
    const booking = state.bookings.find((item) => item.id === state.selectedAgendaBookingId);
    if (!booking) {
        refs.agendaBookingDetail.className = "empty-state";
        refs.agendaBookingDetail.textContent = "Selecione um atendimento para visualizar detalhes, extras e ações.";
        return;
    }

    refs.agendaBookingDetail.className = "detail-card";
    refs.agendaBookingDetail.innerHTML = `
        <header>
            <div>
                <strong>${escapeHtml(booking.clientName)}</strong>
                <p>${escapeHtml(booking.serviceNameSnapshot)} · ${escapeHtml(booking.barberNameSnapshot)}</p>
            </div>
            <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
        </header>
        <div class="stack-grid">
            <div class="stack-card">
                <strong>Horário</strong>
                <p>${formatDateTime(booking.data, booking.hora)}</p>
            </div>
            <div class="stack-card">
                <strong>Financeiro</strong>
                <p>Caixa: ${currency(booking.cashAmount)}</p>
                <p>Produção: ${currency(booking.productionAmount)}</p>
                <p>Comissão dono: ${currency(booking.ownerCommissionAmount)}</p>
            </div>
            <div class="stack-card">
                <strong>Extras</strong>
                <div class="stack-grid">
                    ${(booking.extras || []).map((extra) => `<div>${escapeHtml(extra.label)} · ${currency(extra.price)}</div>`).join("") || "<div class='empty-state'>Nenhum extra lançado.</div>"}
                </div>
                <div class="form-grid" style="margin-top: 12px;">
                    <label>
                        <span>Extra</span>
                        <input type="text" id="detail-extra-label">
                    </label>
                    <label>
                        <span>Valor</span>
                        <input type="number" step="0.01" id="detail-extra-price">
                    </label>
                    <button class="ghost-button" type="button" data-booking-action="add-extra" data-booking-id="${booking.id}">Adicionar extra</button>
                </div>
            </div>
            <div class="stack-card">
                <strong>Observações</strong>
                <p>${escapeHtml(booking.notes || "Sem observações")}</p>
            </div>
        </div>
        <div class="detail-actions">
            <button class="success-button" type="button" data-booking-action="complete" data-booking-id="${booking.id}">Concluir</button>
            <button class="danger-button" type="button" data-booking-action="cancel" data-booking-id="${booking.id}">Cancelar</button>
        </div>
    `;
}

function renderClients() {
    if (state.role !== "owner") return;
    const barbersMap = new Map(state.barbers.map((item) => [item.id, item]));
    const usersMap = new Map(state.users.map((item) => [item.id, item]));
    const clients = createClientSummary(state.bookings, usersMap, barbersMap);
    refs.clientsTableBody.innerHTML = clients.map((client) => `
        <tr>
            <td>${escapeHtml(client.name)}</td>
            <td>${escapeHtml(formatPhone(client.phone) || client.email || "-")}</td>
            <td>${escapeHtml(String(client.completedVisits))}</td>
            <td>${currency(client.averageTicket)}</td>
            <td>${escapeHtml(client.lastBookingDate ? formatDate(client.lastBookingDate) : "-")}</td>
            <td>${escapeHtml(client.favoriteBarberName || "-")}</td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="empty-state">Sem clientes cadastrados.</td></tr>`;
}

function renderFinances() {
    if (state.role !== "owner") return;
    const completedBookings = state.bookings.filter((item) => item.status === "completed");
    const totalExpenses = state.expenses.reduce((sum, item) => sum + toNumber(item.value || item.valor), 0);
    const totalEntries = state.entries.reduce((sum, item) => sum + toNumber(item.value || item.valor), 0);
    const totalCash = completedBookings.reduce((sum, item) => sum + toNumber(item.cashAmount), 0);
    const totalCommission = completedBookings.reduce((sum, item) => sum + toNumber(item.ownerCommissionAmount), 0);

    refs.financeKpis.innerHTML = [
        { label: "Receita de serviços", value: currency(totalCash) },
        { label: "Entradas extras", value: currency(totalEntries) },
        { label: "Despesas", value: currency(totalExpenses) },
        { label: "Comissão do dono", value: currency(totalCommission) },
    ].map((metric) => `
        <article class="kpi-card">
            <span>${escapeHtml(metric.label)}</span>
            <strong>${escapeHtml(metric.value)}</strong>
        </article>
    `).join("");

    const commissionRows = state.barbers.map((barber) => {
        const rows = completedBookings.filter((item) => item.barberId === barber.id);
        return {
            barber,
            production: rows.reduce((sum, item) => sum + toNumber(item.productionAmount), 0),
            commission: rows.reduce((sum, item) => sum + toNumber(item.ownerCommissionAmount), 0),
            net: rows.reduce((sum, item) => sum + toNumber(item.barberNetAmount), 0),
        };
    }).filter((row) => row.production > 0);

    refs.commissionBoard.innerHTML = commissionRows.map((row) => `
        <article class="stack-card">
            <header>
                <div>
                    <strong>${escapeHtml(row.barber.name)}</strong>
                    <small>${escapeHtml(String(row.barber.commissionPercent))}% do dono</small>
                </div>
                <strong>${currency(row.production)}</strong>
            </header>
            <p>Comissão dono: ${currency(row.commission)}</p>
            <p>Líquido barbeiro: ${currency(row.net)}</p>
        </article>
    `).join("") || `<div class="empty-state">Nenhuma produção concluída ainda.</div>`;

    const ledger = [
        ...state.expenses.map((item) => ({ type: "Despesa", tone: "danger", description: item.description || item.descricao, value: -(toNumber(item.value || item.valor)), createdAt: item.createdAt || item.timestamp })),
        ...state.entries.map((item) => ({ type: "Entrada", tone: "success", description: item.description || item.descricao, value: toNumber(item.value || item.valor), createdAt: item.createdAt || item.timestamp })),
    ].sort((left, right) => (parseFirestoreDate(right.createdAt)?.getTime() || 0) - (parseFirestoreDate(left.createdAt)?.getTime() || 0));

    refs.financeLedger.innerHTML = ledger.map((item) => `
        <div class="ledger-row">
            <div>
                <strong>${escapeHtml(item.description || item.type)}</strong>
                <div class="ledger-meta">${escapeHtml(item.type)}</div>
            </div>
            <strong style="color:${item.tone === "danger" ? "#ffbcbc" : "#98e3be"}">${currency(item.value)}</strong>
        </div>
    `).join("") || `<div class="empty-state">Sem lançamentos financeiros.</div>`;
}

function renderSubscriptions() {
    if (state.role !== "owner") return;

    refs.plansAdminList.innerHTML = state.plans.map((plan) => {
        const services = state.services.filter((service) => plan.includedServiceIds.includes(service.id)).map((service) => service.name);
        return `
            <article class="stack-card">
                <header>
                    <div>
                        <strong>${escapeHtml(plan.name)}</strong>
                        <small>${currency(plan.price)} · ${escapeHtml(plan.frequency)}</small>
                    </div>
                    <div class="detail-actions">
                        <button class="ghost-inline" type="button" data-plan-action="edit" data-plan-id="${plan.id}">Editar</button>
                        <button class="danger-button" type="button" data-plan-action="delete" data-plan-id="${plan.id}">Excluir</button>
                    </div>
                </header>
                <p>${escapeHtml(plan.description)}</p>
                <p>Limite mensal: ${plan.monthlyLimit}</p>
                <p>${services.length ? escapeHtml(services.join(" · ")) : "Sem serviços vinculados"}</p>
            </article>
        `;
    }).join("") || `<div class="empty-state">Cadastre o primeiro plano de assinatura.</div>`;

    refs.subscriptionsAdminList.innerHTML = state.subscriptions.map((subscription) => `
        <article class="stack-card">
            <header>
                <div>
                    <strong>${escapeHtml(subscription.clientName)}</strong>
                    <small>${escapeHtml(subscription.planName)}</small>
                </div>
                <span class="status-pill ${escapeHtml(subscription.status)}">${escapeHtml(subscription.status)}</span>
            </header>
            <p>${currency(subscription.planPrice)} · ${escapeHtml(subscription.frequency)}</p>
            <p>Próxima cobrança: ${escapeHtml(subscription.nextBillingDate || "-")}</p>
            <div class="detail-actions">
                <button class="ghost-inline" type="button" data-subscription-action="toggle-status" data-subscription-id="${subscription.id}">
                    ${subscription.status === "active" ? "Pausar" : "Reativar"}
                </button>
                <button class="ghost-inline" type="button" data-subscription-action="toggle-payment" data-subscription-id="${subscription.id}">
                    ${subscription.paymentStatus === "paid" ? "Marcar pendente" : "Marcar pago"}
                </button>
            </div>
        </article>
    `).join("") || `<div class="empty-state">Nenhuma assinatura encontrada.</div>`;
}

function renderServices() {
    if (state.role !== "owner") return;
    refs.servicesAdminList.innerHTML = state.services.map((service) => `
        <article class="stack-card">
            <header>
                <div>
                    <strong>${escapeHtml(service.name)}</strong>
                    <small>${escapeHtml(service.category)} · ${service.duration} min</small>
                </div>
                <div class="detail-actions">
                    <button class="ghost-inline" type="button" data-service-action="edit" data-service-id="${service.id}">Editar</button>
                    <button class="danger-button" type="button" data-service-action="delete" data-service-id="${service.id}">Excluir</button>
                </div>
            </header>
            <p>${escapeHtml(service.description)}</p>
            <p>${currency(service.price)}</p>
        </article>
    `).join("") || `<div class="empty-state">Cadastre o primeiro serviço.</div>`;
}

function renderBarbers() {
    if (state.role !== "owner") return;
    refs.barbersAdminList.innerHTML = state.barbers.map((barber) => `
        <article class="stack-card">
            <header>
                <div>
                    <strong>${escapeHtml(barber.name)}</strong>
                    <small>${escapeHtml(barber.email || "sem e-mail")}</small>
                </div>
                <span class="status-pill ${barber.active ? "confirmed" : "cancelled"}">${barber.active ? "ativo" : "inativo"}</span>
            </header>
            <p>${escapeHtml(barber.headline || "Sem headline")}</p>
            <p>Comissão do dono: ${escapeHtml(String(barber.commissionPercent))}%</p>
            <div class="detail-actions">
                <button class="ghost-inline" type="button" data-barber-action="edit" data-barber-id="${barber.id}">Editar</button>
                <button class="ghost-inline" type="button" data-barber-action="toggle-active" data-barber-id="${barber.id}">
                    ${barber.active ? "Desativar" : "Ativar"}
                </button>
            </div>
        </article>
    `).join("") || `<div class="empty-state">Cadastre o primeiro barbeiro.</div>`;
}

function populateServiceControls() {
    const options = state.services.map((service) => `<option value="${service.id}">${escapeHtml(service.name)}</option>`).join("");
    refs.quickServiceId.innerHTML = options;
    refs.planServicesChecklist.innerHTML = buildChecklist(state.services, refs.planEditId.dataset.selected || "");
    refs.barberServicesChecklist.innerHTML = buildChecklist(state.services, refs.barberEditId.dataset.selected || "");
}

function populateBarberControls() {
    const ownerOptions = ['<option value="all">Todos os barbeiros</option>']
        .concat(state.barbers.map((barber) => `<option value="${barber.id}">${escapeHtml(barber.name)}</option>`))
        .join("");
    refs.dashboardBarberFilter.innerHTML = ownerOptions;
    refs.agendaBarberFilter.innerHTML = ownerOptions;

    const quickOptions = state.barbers.map((barber) => `<option value="${barber.id}">${escapeHtml(barber.name)}</option>`).join("");
    refs.quickBarberId.innerHTML = quickOptions;
    if (state.role !== "owner") {
        refs.quickBarberId.value = state.profile.id;
    }

    refs.barberScheduleEditor.innerHTML = buildScheduleEditor();
}

function populatePlanControls() {
    refs.planServicesChecklist.innerHTML = buildChecklist(state.services, refs.planEditId.dataset.selected || "");
}

function populateSettingsForm() {
    refs.shopName.value = state.settings.barbershop.name;
    refs.shopSlogan.value = state.settings.barbershop.slogan;
    refs.shopPhone.value = state.settings.barbershop.phone;
    refs.shopAddress.value = state.settings.barbershop.address;
    refs.shopMaps.value = state.settings.barbershop.mapsLink;
    refs.featureSubscriptions.checked = state.settings.features.subscriptionsEnabled;
    refs.featureFiscal.checked = state.settings.features.fiscalReportEnabled;
}

function buildChecklist(items, selectedIdsRaw) {
    const selectedIds = new Set(String(selectedIdsRaw || "").split(",").filter(Boolean));
    return items.map((item) => `
        <label class="check-option">
            <input type="checkbox" value="${item.id}" ${selectedIds.has(item.id) ? "checked" : ""}>
            <span>${escapeHtml(item.name)}</span>
        </label>
    `).join("");
}

function buildScheduleEditor(schedule = DEFAULT_WEEKLY_SCHEDULE) {
    const normalized = normalizeWeeklySchedule(schedule);
    return Object.entries(normalized).map(([dayKey, day]) => `
        <div class="schedule-row" data-day="${dayKey}">
            <strong>${escapeHtml(dayKey)}</strong>
            <label class="toggle-line"><input type="checkbox" data-field="opens" ${day.opens ? "checked" : ""}><span>Abre</span></label>
            <input type="time" data-field="start" value="${day.start}">
            <input type="time" data-field="end" value="${day.end}">
            <input type="time" data-field="lunchStart" value="${day.lunchStart}">
            <input type="time" data-field="lunchEnd" value="${day.lunchEnd}">
        </div>
    `).join("");
}

function handleAgendaSelection(event) {
    const card = event.target.closest("[data-booking-id]");
    if (!card) return;
    state.selectedAgendaBookingId = card.dataset.bookingId;
    renderAgenda();
}

async function handleBookingDetailActions(event) {
    const actionButton = event.target.closest("[data-booking-action]");
    if (!actionButton) return;
    const booking = state.bookings.find((item) => item.id === actionButton.dataset.bookingId);
    if (!booking) return;

    if (actionButton.dataset.bookingAction === "complete") {
        await updateDoc(doc(db, "agendamentos", booking.id), {
            status: "completed",
            updatedAt: serverTimestamp(),
        });
        toast("Atendimento concluído.", "success");
    }

    if (actionButton.dataset.bookingAction === "cancel") {
        await updateDoc(doc(db, "agendamentos", booking.id), {
            status: "cancelled",
            updatedAt: serverTimestamp(),
        });
        toast("Atendimento cancelado.", "success");
    }

    if (actionButton.dataset.bookingAction === "add-extra") {
        const extraLabel = document.getElementById("detail-extra-label")?.value.trim();
        const extraPrice = toNumber(document.getElementById("detail-extra-price")?.value, 0);
        if (!extraLabel || extraPrice <= 0) {
            toast("Informe nome e valor do extra.", "error");
            return;
        }
        const updatedExtras = [...(booking.extras || []), { label: extraLabel, price: extraPrice }];
        const barber = state.barbers.find((item) => item.id === booking.barberId) || state.profile;
        const financials = calculateBookingFinancials({
            basePrice: booking.priceSnapshot,
            extras: updatedExtras,
            commissionPercent: barber.commissionPercent,
            isSubscription: booking.isSubscription,
        });
        await updateDoc(doc(db, "agendamentos", booking.id), {
            extras: updatedExtras,
            cashAmount: financials.cashAmount,
            productionAmount: financials.productionAmount,
            ownerCommissionAmount: financials.ownerCommissionAmount,
            barberNetAmount: financials.barberNetAmount,
            updatedAt: serverTimestamp(),
        });
        toast("Extra adicionado.", "success");
    }
}

async function saveQuickBooking(event) {
    event.preventDefault();
    const service = state.services.find((item) => item.id === refs.quickServiceId.value);
    const barberId = state.role === "owner" ? refs.quickBarberId.value : state.profile.id;
    const barber = state.barbers.find((item) => item.id === barberId) || state.profile;
    const date = refs.agendaDate.value || getTodayISO();
    const time = refs.quickBookingTime.value;
    const clientName = refs.quickClientName.value.trim();
    const clientPhone = digitsOnly(refs.quickClientPhone.value);

    if (!service || !barber || !date || !time || !clientName) {
        toast("Preencha cliente, serviço, barbeiro e horário.", "error");
        return;
    }

    if (hasConflict({ barberId, date, time, duration: service.duration })) {
        toast("Conflito de horário para esse barbeiro.", "error");
        return;
    }

    const financials = calculateBookingFinancials({
        basePrice: service.price,
        extras: [],
        commissionPercent: barber.commissionPercent,
        isSubscription: false,
    });

    await addDoc(collection(db, "agendamentos"), {
        clientId: "",
        userId: "",
        clientName,
        clientPhone,
        nome: clientName,
        cliente: clientName,
        telefone: clientPhone,
        serviceId: service.id,
        servico: service.name,
        serviceNameSnapshot: service.name,
        barberId: barber.id,
        barberNameSnapshot: barber.name,
        data: date,
        hora: time,
        duration: service.duration,
        slots: Math.max(1, Math.ceil(service.duration / 30)),
        notes: refs.quickBookingNotes.value.trim(),
        observacoes: refs.quickBookingNotes.value.trim(),
        status: "confirmed",
        priceSnapshot: service.price,
        preco: service.price,
        cashAmount: financials.cashAmount,
        productionAmount: financials.productionAmount,
        ownerCommissionAmount: financials.ownerCommissionAmount,
        barberNetAmount: financials.barberNetAmount,
        commissionPercent: barber.commissionPercent,
        extras: [],
        isSubscription: false,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
    });

    refs.quickBookingForm.reset();
    refs.quickBookingTime.value = "";
    if (state.role !== "owner") refs.quickBarberId.value = state.profile.id;
    toast("Agendamento manual salvo.", "success");
}

async function saveExpense(event) {
    event.preventDefault();
    if (!refs.expenseDescription.value.trim() || !refs.expenseValue.value) {
        toast("Preencha a despesa.", "error");
        return;
    }
    await addDoc(collection(db, "despesas"), {
        description: refs.expenseDescription.value.trim(),
        category: refs.expenseCategory.value.trim(),
        value: toNumber(refs.expenseValue.value),
        createdAt: serverTimestamp(),
        createdBy: state.user.uid,
    });
    refs.expenseForm.reset();
    toast("Despesa salva.", "success");
}

async function saveEntry(event) {
    event.preventDefault();
    if (!refs.entryDescription.value.trim() || !refs.entryValue.value) {
        toast("Preencha a entrada.", "error");
        return;
    }
    await addDoc(collection(db, "entradas_produtos"), {
        description: refs.entryDescription.value.trim(),
        value: toNumber(refs.entryValue.value),
        createdAt: serverTimestamp(),
        createdBy: state.user.uid,
    });
    refs.entryForm.reset();
    toast("Entrada registrada.", "success");
}

async function savePlan(event) {
    event.preventDefault();
    const payload = {
        name: refs.planName.value.trim(),
        price: toNumber(refs.planPrice.value),
        frequency: refs.planFrequency.value,
        monthlyLimit: Math.max(1, toNumber(refs.planMonthlyLimit.value, 4)),
        description: refs.planDescription.value.trim(),
        includedServiceIds: collectCheckedValues(refs.planServicesChecklist),
        active: true,
        updatedAt: serverTimestamp(),
    };

    if (!payload.name || !payload.price) {
        toast("Preencha nome e valor do plano.", "error");
        return;
    }

    if (refs.planEditId.value) {
        await setDoc(doc(db, "subscription_plans", refs.planEditId.value), payload, { merge: true });
    } else {
        await addDoc(collection(db, "subscription_plans"), {
            ...payload,
            createdAt: serverTimestamp(),
        });
    }
    refs.planForm.reset();
    refs.planEditId.value = "";
    refs.planEditId.dataset.selected = "";
    populatePlanControls();
    toast("Plano salvo.", "success");
}

async function saveService(event) {
    event.preventDefault();
    const payload = {
        name: refs.serviceName.value.trim(),
        price: toNumber(refs.servicePrice.value),
        duration: Math.max(15, toNumber(refs.serviceDuration.value, 30)),
        category: refs.serviceCategory.value.trim() || "Serviço",
        description: refs.serviceDescription.value.trim(),
        active: true,
        updatedAt: serverTimestamp(),
    };

    if (!payload.name || !payload.price) {
        toast("Preencha nome e preço do serviço.", "error");
        return;
    }

    if (refs.serviceEditId.value) {
        await setDoc(doc(db, "services", refs.serviceEditId.value), payload, { merge: true });
    } else {
        await addDoc(collection(db, "services"), {
            ...payload,
            createdAt: serverTimestamp(),
        });
    }

    refs.serviceForm.reset();
    refs.serviceEditId.value = "";
    toast("Serviço salvo.", "success");
}

async function saveBarber(event) {
    event.preventDefault();
    const existingId = refs.barberEditId.value;
    const requestedId = existingId || "";
    const accountResult = await callUpsertBarberAccount({
        barberId: requestedId,
        email: refs.barberEmail.value.trim(),
        password: refs.barberPassword.value.trim(),
        name: refs.barberName.value.trim(),
        role: refs.barberRole.value,
        active: refs.barberActive.checked,
    });

    const barberId = accountResult.data.barberId;
    const schedule = collectScheduleFromForm();
    const profile = normalizeBarber({
        id: barberId,
        authUid: accountResult.data.authUid || barberId,
        name: refs.barberName.value.trim(),
        email: refs.barberEmail.value.trim(),
        phone: digitsOnly(refs.barberPhone.value),
        role: refs.barberRole.value,
        active: refs.barberActive.checked,
        acceptsBookings: refs.barberAcceptsBookings.checked,
        commissionPercent: toNumber(refs.barberCommission.value, 35),
        color: refs.barberColor.value,
        headline: refs.barberHeadline.value.trim(),
        daysOff: refs.barberDaysOff.value.split(",").map((item) => item.trim()).filter(Boolean),
        serviceIds: collectCheckedValues(refs.barberServicesChecklist),
        weeklySchedule: schedule,
    });

    await persistBarberProfile(profile);
    refs.barberForm.reset();
    refs.barberEditId.value = "";
    refs.barberServicesChecklist.innerHTML = buildChecklist(state.services, "");
    refs.barberScheduleEditor.innerHTML = buildScheduleEditor();
    toast("Barbeiro salvo.", "success");
}

async function saveSettings(event) {
    event.preventDefault();
    await setDoc(doc(db, "configuracoes_gerais", "barbearia"), {
        barberName: refs.shopName.value.trim(),
        slogan: refs.shopSlogan.value.trim(),
        barberPhone: refs.shopPhone.value.trim(),
        barberAddress: refs.shopAddress.value.trim(),
        barberMapsLink: refs.shopMaps.value.trim(),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, "configuracoes_gerais", "features"), {
        subscriptionsEnabled: refs.featureSubscriptions.checked,
        fiscalReportEnabled: refs.featureFiscal.checked,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    toast("Configurações salvas.", "success");
}

async function runMigration() {
    await callMigrateLegacyData();
    toast("Migração executada.", "success");
}

async function handlePlanActions(event) {
    const button = event.target.closest("[data-plan-action]");
    if (!button) return;
    const plan = state.plans.find((item) => item.id === button.dataset.planId);
    if (!plan) return;

    if (button.dataset.planAction === "edit") {
        refs.planEditId.value = plan.id;
        refs.planEditId.dataset.selected = plan.includedServiceIds.join(",");
        refs.planName.value = plan.name;
        refs.planPrice.value = String(plan.price);
        refs.planFrequency.value = plan.frequency;
        refs.planMonthlyLimit.value = String(plan.monthlyLimit);
        refs.planDescription.value = plan.description;
        populatePlanControls();
        setView("subscriptions");
    }

    if (button.dataset.planAction === "delete" && window.confirm(`Excluir o plano ${plan.name}?`)) {
        await deleteDoc(doc(db, "subscription_plans", plan.id));
        toast("Plano removido.", "success");
    }
}

async function handleSubscriptionActions(event) {
    const button = event.target.closest("[data-subscription-action]");
    if (!button) return;
    const subscription = state.subscriptions.find((item) => item.id === button.dataset.subscriptionId);
    if (!subscription) return;

    if (button.dataset.subscriptionAction === "toggle-status") {
        await updateDoc(doc(db, "assinaturas", subscription.id), {
            status: subscription.status === "active" ? "paused" : "active",
            updatedAt: serverTimestamp(),
        });
        toast("Status da assinatura atualizado.", "success");
    }

    if (button.dataset.subscriptionAction === "toggle-payment") {
        await updateDoc(doc(db, "assinaturas", subscription.id), {
            paymentStatus: subscription.paymentStatus === "paid" ? "pending" : "paid",
            updatedAt: serverTimestamp(),
        });
        toast("Status de pagamento atualizado.", "success");
    }
}

async function handleServiceActions(event) {
    const button = event.target.closest("[data-service-action]");
    if (!button) return;
    const service = state.services.find((item) => item.id === button.dataset.serviceId);
    if (!service) return;

    if (button.dataset.serviceAction === "edit") {
        refs.serviceEditId.value = service.id;
        refs.serviceName.value = service.name;
        refs.servicePrice.value = String(service.price);
        refs.serviceDuration.value = String(service.duration);
        refs.serviceCategory.value = service.category;
        refs.serviceDescription.value = service.description;
        setView("services");
    }

    if (button.dataset.serviceAction === "delete" && window.confirm(`Excluir o serviço ${service.name}?`)) {
        await deleteDoc(doc(db, "services", service.id));
        toast("Serviço removido.", "success");
    }
}

async function handleBarberActions(event) {
    const button = event.target.closest("[data-barber-action]");
    if (!button) return;
    const barber = state.barbers.find((item) => item.id === button.dataset.barberId);
    if (!barber) return;

    if (button.dataset.barberAction === "edit") {
        refs.barberEditId.value = barber.id;
        refs.barberName.value = barber.name;
        refs.barberEmail.value = barber.email;
        refs.barberPhone.value = barber.phone;
        refs.barberRole.value = barber.role;
        refs.barberCommission.value = String(barber.commissionPercent);
        refs.barberColor.value = barber.color;
        refs.barberHeadline.value = barber.headline || "";
        refs.barberActive.checked = barber.active;
        refs.barberAcceptsBookings.checked = barber.acceptsBookings;
        refs.barberDaysOff.value = barber.daysOff.join(", ");
        refs.barberEditId.dataset.selected = barber.serviceIds.join(",");
        refs.barberServicesChecklist.innerHTML = buildChecklist(state.services, barber.serviceIds.join(","));
        refs.barberScheduleEditor.innerHTML = buildScheduleEditor(barber.weeklySchedule);
        setView("barbers");
    }

    if (button.dataset.barberAction === "toggle-active") {
        const updated = { ...barber, active: !barber.active };
        await persistBarberProfile(updated);
        toast("Status do barbeiro atualizado.", "success");
    }
}

async function persistBarberProfile(profile) {
    await setDoc(doc(db, "barbers", profile.id), {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        active: profile.active,
        acceptsBookings: profile.acceptsBookings,
        commissionPercent: profile.commissionPercent,
        serviceIds: profile.serviceIds,
        weeklySchedule: profile.weeklySchedule,
        daysOff: profile.daysOff,
        color: profile.color,
        headline: profile.headline || "",
        authUid: profile.authUid || profile.id,
        updatedAt: serverTimestamp(),
    }, { merge: true });

    await setDoc(doc(db, "barbers_public", profile.id), {
        name: profile.name,
        role: profile.role,
        active: profile.active,
        acceptsBookings: profile.acceptsBookings,
        commissionPercent: profile.commissionPercent,
        serviceIds: profile.serviceIds,
        weeklySchedule: profile.weeklySchedule,
        daysOff: profile.daysOff,
        color: profile.color,
        headline: profile.headline || "",
        photoUrl: "",
        updatedAt: serverTimestamp(),
    }, { merge: true });
}

function collectCheckedValues(container) {
    return Array.from(container.querySelectorAll("input[type='checkbox']:checked")).map((input) => input.value);
}

function collectScheduleFromForm() {
    const rows = Array.from(refs.barberScheduleEditor.querySelectorAll(".schedule-row"));
    const output = {};
    rows.forEach((row) => {
        const day = row.dataset.day;
        output[day] = {
            opens: row.querySelector("[data-field='opens']").checked,
            start: row.querySelector("[data-field='start']").value || "09:00",
            end: row.querySelector("[data-field='end']").value || "18:00",
            lunchStart: row.querySelector("[data-field='lunchStart']").value || "12:00",
            lunchEnd: row.querySelector("[data-field='lunchEnd']").value || "13:00",
        };
    });
    return output;
}

function hasConflict({ barberId, date, time, duration }) {
    const start = timeToMinutes(time);
    const end = start + duration;
    return state.bookings.some((booking) => {
        if (booking.barberId !== barberId || booking.data !== date || booking.status === "cancelled") return false;
        const bookingStart = timeToMinutes(booking.hora);
        const bookingEnd = bookingStart + toNumber(booking.duration, 30);
        return start < bookingEnd && end > bookingStart;
    });
}

async function enableNotifications() {
    try {
        if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
        const messagingModule = await import("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js");
        const supported = await messagingModule.isSupported().catch(() => false);
        if (!supported) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const messaging = messagingModule.getMessaging();
        const token = await messagingModule.getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration,
        });
        if (!token || !state.profile) return;
        await setDoc(doc(db, "barbeirosTokens", `${state.profile.id}-${token.slice(0, 12)}`), {
            barberId: state.profile.id,
            uid: state.profile.id,
            email: state.profile.email || state.user.email || "",
            role: state.profile.role,
            token,
            active: true,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn("Notificações não habilitadas:", error.message);
    }
}

function toast(message, type = "success") {
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.textContent = message;
    refs.toastRegion.appendChild(node);
    window.setTimeout(() => node.remove(), 3200);
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js").catch((error) => {
            console.warn("Falha ao registrar service worker:", error.message);
        });
    }
}
