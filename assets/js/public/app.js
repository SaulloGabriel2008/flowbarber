import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    addDoc,
    collection,
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
import { auth, db } from "../shared/firebase.js";
import {
    DEFAULT_BARBERSHOP_INFO,
    DEFAULT_FEATURE_FLAGS,
    DEFAULT_SERVICES,
    calculateBookingFinancials,
    createDefaultPublicBarber,
    createPublicBarberProfile,
    formatPlanHeadline,
    getBarbersForService,
    normalizeBarber,
    normalizeBooking,
    normalizeService,
    normalizeSubscription,
    normalizeSubscriptionPlan,
} from "../shared/data.js";
import {
    addDays,
    buildTimeSlots,
    compareBookings,
    currency,
    digitsOnly,
    escapeHtml,
    formatDateTime,
    formatPhone,
    getMonthKey,
    getTodayISO,
    getWeekdayKey,
    isPastSlot,
    timeToMinutes,
    toNumber,
} from "../shared/utils.js";

const refs = {
    brandName: document.getElementById("brand-name"),
    brandSlogan: document.getElementById("brand-slogan"),
    heroBadge: document.getElementById("hero-badge"),
    heroTitle: document.getElementById("hero-title"),
    heroDescription: document.getElementById("hero-description"),
    metricBarbers: document.getElementById("metric-barbers"),
    metricServices: document.getElementById("metric-services"),
    metricMemberships: document.getElementById("metric-memberships"),
    footerName: document.getElementById("footer-name"),
    footerAddress: document.getElementById("footer-address"),
    footerPhone: document.getElementById("footer-phone"),
    footerMaps: document.getElementById("footer-maps"),
    servicesShowcase: document.getElementById("services-showcase"),
    teamGrid: document.getElementById("team-grid"),
    bookingServicesGrid: document.getElementById("booking-services-grid"),
    bookingBarbersGrid: document.getElementById("booking-barbers-grid"),
    bookingDate: document.getElementById("booking-date"),
    bookingSlotsGrid: document.getElementById("booking-slots-grid"),
    bookingSlotFeedback: document.getElementById("booking-slot-feedback"),
    bookingNotes: document.getElementById("booking-notes"),
    bookingSubmit: document.getElementById("booking-submit"),
    summaryService: document.getElementById("summary-service"),
    summaryBarber: document.getElementById("summary-barber"),
    summarySlot: document.getElementById("summary-slot"),
    summaryDuration: document.getElementById("summary-duration"),
    summaryPrice: document.getElementById("summary-price"),
    summarySubscriptionNote: document.getElementById("summary-subscription-note"),
    plansGrid: document.getElementById("plans-grid"),
    authPanel: document.getElementById("auth-panel"),
    accountPanel: document.getElementById("account-panel"),
    accountName: document.getElementById("account-name"),
    accountContact: document.getElementById("account-contact"),
    accountNextBooking: document.getElementById("account-next-booking"),
    accountSubscriptionStatus: document.getElementById("account-subscription-status"),
    myBookingsList: document.getElementById("my-bookings-list"),
    mySubscriptionPanel: document.getElementById("my-subscription-panel"),
    loginForm: document.getElementById("login-form"),
    signupForm: document.getElementById("signup-form"),
    btnShowLogin: document.getElementById("btn-show-login"),
    btnShowSignup: document.getElementById("btn-show-signup"),
    loginIdentifier: document.getElementById("login-identifier"),
    loginPassword: document.getElementById("login-password"),
    signupName: document.getElementById("signup-name"),
    signupPhone: document.getElementById("signup-phone"),
    signupEmail: document.getElementById("signup-email"),
    signupPassword: document.getElementById("signup-password"),
    logoutButton: document.getElementById("logout-button"),
    toastRegion: document.getElementById("toast-region"),
};

const state = {
    barbershop: { ...DEFAULT_BARBERSHOP_INFO },
    features: { ...DEFAULT_FEATURE_FLAGS },
    services: [],
    barbers: [],
    plans: [],
    selectedServiceId: "",
    selectedBarberId: "",
    selectedDate: "",
    selectedTime: "",
    dateBookings: [],
    user: null,
    userProfile: null,
    userBookings: [],
    userSubscription: null,
};

const unsubscribers = {
    userBookings: null,
    userSubscription: null,
};

init();

function init() {
    refs.bookingDate.min = getTodayISO();
    refs.bookingDate.value = getTodayISO();
    state.selectedDate = getTodayISO();
    registerServiceWorker();
    bindEvents();
    subscribePublicData();
    observeAuth();
}

function bindEvents() {
    refs.btnShowLogin.addEventListener("click", () => switchAuthMode("login"));
    refs.btnShowSignup.addEventListener("click", () => switchAuthMode("signup"));
    refs.loginForm.addEventListener("submit", handleLogin);
    refs.signupForm.addEventListener("submit", handleSignup);
    refs.logoutButton.addEventListener("click", async () => {
        await signOut(auth);
        toast("Sessão encerrada.", "success");
    });

    refs.bookingServicesGrid.addEventListener("click", (event) => {
        const card = event.target.closest("[data-service-id]");
        if (!card) return;
        selectService(card.dataset.serviceId);
    });

    refs.bookingBarbersGrid.addEventListener("click", (event) => {
        const card = event.target.closest("[data-barber-id]");
        if (!card) return;
        selectBarber(card.dataset.barberId);
    });

    refs.bookingSlotsGrid.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-slot]");
        if (!button) return;
        selectTime(button.dataset.slot);
    });

    refs.bookingDate.addEventListener("change", () => {
        state.selectedDate = refs.bookingDate.value;
        state.selectedTime = "";
        renderSummary();
        renderSlots();
    });

    refs.bookingSubmit.addEventListener("click", finalizeBooking);
    refs.plansGrid.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-subscribe-plan]");
        if (!button) return;
        await subscribeToPlan(button.dataset.subscribePlan);
    });

    refs.myBookingsList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-cancel-booking]");
        if (!button) return;
        await cancelBooking(button.dataset.cancelBooking);
    });
}

function subscribePublicData() {
    onSnapshot(collection(db, "services"), (snapshot) => {
        const services = snapshot.docs.map((item) => normalizeService({ id: item.id, ...item.data() })).filter((item) => item.active !== false);
        state.services = services.length ? services : DEFAULT_SERVICES.map(normalizeService);
        renderServices();
        renderPlans();
        reconcileSelection();
    });

    onSnapshot(doc(db, "configuracoes_gerais", "barbearia"), (snapshot) => {
        state.barbershop = snapshot.exists()
            ? {
                ...DEFAULT_BARBERSHOP_INFO,
                name: snapshot.data().barberName || snapshot.data().name || DEFAULT_BARBERSHOP_INFO.name,
                slogan: snapshot.data().slogan || DEFAULT_BARBERSHOP_INFO.slogan,
                phone: snapshot.data().barberPhone || snapshot.data().phone || DEFAULT_BARBERSHOP_INFO.phone,
                address: snapshot.data().barberAddress || snapshot.data().address || DEFAULT_BARBERSHOP_INFO.address,
                mapsLink: snapshot.data().barberMapsLink || snapshot.data().mapsLink || DEFAULT_BARBERSHOP_INFO.mapsLink,
                heroBadge: snapshot.data().heroBadge || DEFAULT_BARBERSHOP_INFO.heroBadge,
                instagram: snapshot.data().instagram || DEFAULT_BARBERSHOP_INFO.instagram,
            }
            : { ...DEFAULT_BARBERSHOP_INFO };
        renderBarbershopInfo();
    });

    onSnapshot(doc(db, "configuracoes_gerais", "features"), (snapshot) => {
        if (!snapshot.exists()) {
            state.features = { ...DEFAULT_FEATURE_FLAGS };
        } else {
            state.features = {
                subscriptionsEnabled: snapshot.data().subscriptionsEnabled ?? DEFAULT_FEATURE_FLAGS.subscriptionsEnabled,
                fiscalReportEnabled: snapshot.data().fiscalReportEnabled ?? DEFAULT_FEATURE_FLAGS.fiscalReportEnabled,
            };
        }
        renderPlans();
        renderSubscriptionPanel();
    });

    onSnapshot(collection(db, "subscription_plans"), (snapshot) => {
        state.plans = snapshot.docs.map((item) => normalizeSubscriptionPlan({ id: item.id, ...item.data() })).filter((plan) => plan.active !== false);
        renderPlans();
        renderMetrics();
    });

    onSnapshot(collection(db, "barbers_public"), (snapshot) => {
        if (snapshot.empty) {
            const fallback = createDefaultPublicBarber({
                name: state.barbershop.name,
                headline: "Equipe pronta para cortes, barba e acabamento premium.",
            });
            state.barbers = [fallback];
        } else {
            state.barbers = snapshot.docs
                .map((item) => normalizeBarber({ id: item.id, ...item.data() }))
                .filter((barber) => barber.active !== false && barber.acceptsBookings !== false)
                .map((barber) => ({
                    ...barber,
                    publicProfile: createPublicBarberProfile(barber),
                }));
        }
        if (!state.barbers.length) {
            state.barbers = [createDefaultPublicBarber()];
        }
        renderBarbers();
        renderBookingBarbers();
        reconcileSelection();
        renderMetrics();
    });
}

function observeAuth() {
    onAuthStateChanged(auth, async (user) => {
        state.user = user;
        if (!user) {
            state.userProfile = null;
            state.userBookings = [];
            state.userSubscription = null;
            resetUserListeners();
            renderAccount();
            renderBookings();
            renderSubscriptionPanel();
            renderSummary();
            return;
        }

        state.userProfile = await loadUserProfile(user);
        subscribeUserCollections(user.uid);
        renderAccount();
        renderSummary();
    });
}

async function loadUserProfile(user) {
    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
    }

    const fallbackProfile = {
        nome: user.displayName || "Cliente",
        phone: "",
        email: user.email || "",
        role: "client",
        createdAt: serverTimestamp(),
    };
    await setDoc(userRef, fallbackProfile, { merge: true });
    return { id: user.uid, ...fallbackProfile };
}

function subscribeUserCollections(uid) {
    resetUserListeners();

    unsubscribers.userBookings = onSnapshot(query(collection(db, "agendamentos"), where("userId", "==", uid)), (snapshot) => {
        const servicesMap = new Map(state.services.map((item) => [item.id, item]));
        const barbersMap = new Map(state.barbers.map((item) => [item.id, item]));
        const defaultBarberId = state.barbers[0]?.id || "";
        state.userBookings = snapshot.docs
            .map((item) => normalizeBooking({ id: item.id, ...item.data() }, servicesMap, barbersMap, defaultBarberId))
            .sort(compareBookings);
        renderBookings();
        renderAccount();
        renderSubscriptionPanel();
        renderSummary();
    });

    unsubscribers.userSubscription = onSnapshot(query(collection(db, "assinaturas"), where("clientId", "==", uid)), (snapshot) => {
        const activeSubscription = snapshot.docs
            .map((item) => normalizeSubscription({ id: item.id, ...item.data() }))
            .find((item) => item.status === "active");
        state.userSubscription = activeSubscription || null;
        renderSubscriptionPanel();
        renderAccount();
        renderSummary();
    });
}

function resetUserListeners() {
    if (typeof unsubscribers.userBookings === "function") unsubscribers.userBookings();
    if (typeof unsubscribers.userSubscription === "function") unsubscribers.userSubscription();
    unsubscribers.userBookings = null;
    unsubscribers.userSubscription = null;
}

function switchAuthMode(mode) {
    const isLogin = mode === "login";
    refs.btnShowLogin.classList.toggle("active", isLogin);
    refs.btnShowSignup.classList.toggle("active", !isLogin);
    refs.loginForm.classList.toggle("hidden", !isLogin);
    refs.signupForm.classList.toggle("hidden", isLogin);
}

async function handleLogin(event) {
    event.preventDefault();
    const identifier = refs.loginIdentifier.value.trim();
    const password = refs.loginPassword.value.trim();

    if (!identifier || !password) {
        toast("Preencha o login e a senha.", "error");
        return;
    }

    let email = identifier;
    if (!identifier.includes("@")) {
        const phone = digitsOnly(identifier);
        const usersSnapshot = await getDocs(query(collection(db, "users"), where("phone", "==", phone)));
        if (usersSnapshot.empty) {
            toast("Telefone não encontrado.", "error");
            return;
        }
        email = usersSnapshot.docs[0].data().email;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        toast("Login realizado com sucesso.", "success");
        refs.loginForm.reset();
    } catch (error) {
        toast("Não foi possível entrar. Verifique os dados.", "error");
        console.error(error);
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const name = refs.signupName.value.trim();
    const phone = digitsOnly(refs.signupPhone.value);
    const email = refs.signupEmail.value.trim();
    const password = refs.signupPassword.value.trim();

    if (!name || !phone || !email || password.length < 6) {
        toast("Preencha nome, telefone, e-mail e uma senha com 6 caracteres.", "error");
        return;
    }

    try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credentials.user, { displayName: name });
        await setDoc(doc(db, "users", credentials.user.uid), {
            nome: name,
            phone,
            email,
            role: "client",
            createdAt: serverTimestamp(),
        }, { merge: true });
        toast("Conta criada com sucesso.", "success");
        refs.signupForm.reset();
    } catch (error) {
        toast("Não foi possível criar a conta.", "error");
        console.error(error);
    }
}

function renderBarbershopInfo() {
    document.title = `${state.barbershop.name} | Agendamento online`;
    refs.brandName.textContent = state.barbershop.name;
    refs.brandSlogan.textContent = state.barbershop.slogan;
    refs.heroBadge.textContent = state.barbershop.heroBadge;
    refs.heroTitle.textContent = `${state.barbershop.name}: agendamento profissional com equipe multi-barbeiros.`;
    refs.heroDescription.textContent = state.barbershop.slogan;
    refs.footerName.textContent = state.barbershop.name;
    refs.footerAddress.textContent = state.barbershop.address;
    refs.footerPhone.textContent = formatPhone(state.barbershop.phone);
    refs.footerPhone.href = `https://wa.me/${digitsOnly(state.barbershop.phone)}`;
    refs.footerMaps.href = state.barbershop.mapsLink || DEFAULT_BARBERSHOP_INFO.mapsLink;
}

function renderMetrics() {
    refs.metricBarbers.textContent = String(state.barbers.length);
    refs.metricServices.textContent = String(state.services.length);
    refs.metricMemberships.textContent = state.features.subscriptionsEnabled ? formatPlural(state.plans.length, "plano ativo", "planos ativos") : "Off";
}

function renderServices() {
    const serviceCards = state.services.map((service) => {
        return `
            <article class="showcase-card">
                <span class="service-topline">${escapeHtml(service.category)}</span>
                <strong>${escapeHtml(service.name)}</strong>
                <p>${escapeHtml(service.description)}</p>
                <div class="service-footer">
                    <span>${service.duration} min</span>
                    <strong>${currency(service.price)}</strong>
                </div>
            </article>
        `;
    }).join("");

    refs.servicesShowcase.innerHTML = serviceCards || `<article class="showcase-card"><strong>Catálogo em preparação</strong><p>Cadastre os serviços no admin para publicar no site.</p></article>`;

    refs.bookingServicesGrid.innerHTML = state.services.map((service) => {
        const selected = service.id === state.selectedServiceId;
        return `
            <button type="button" class="booking-option ${selected ? "selected" : ""}" data-service-id="${service.id}">
                <span class="booking-chip">${escapeHtml(service.category)}</span>
                <h4>${escapeHtml(service.name)}</h4>
                <p>${escapeHtml(service.description)}</p>
                <div class="service-footer">
                    <span>${service.duration} min</span>
                    <strong>${currency(service.price)}</strong>
                </div>
            </button>
        `;
    }).join("");
}

function renderBarbers() {
    refs.teamGrid.innerHTML = state.barbers.map((barber) => {
        const profile = barber.publicProfile || createPublicBarberProfile(barber);
        const assignedServices = state.services.filter((service) => {
            return !barber.serviceIds?.length || barber.serviceIds.includes(service.id);
        }).slice(0, 3);

        return `
            <article class="team-card">
                <div class="team-avatar" style="background: linear-gradient(135deg, ${profile.color}, #f1e2be);">${escapeHtml(profile.initials)}</div>
                <div>
                    <span class="team-role">${escapeHtml(profile.roleLabel)}</span>
                    <h3>${escapeHtml(profile.name)}</h3>
                    <p>${escapeHtml(profile.headline || profile.specialty)}</p>
                </div>
                <div class="team-tags">
                    ${assignedServices.map((service) => `<span>${escapeHtml(service.name)}</span>`).join("")}
                </div>
            </article>
        `;
    }).join("");

    renderBookingBarbers();
}

function renderBookingBarbers() {
    const activeBarbers = state.selectedServiceId
        ? getBarbersForService(state.barbers, state.selectedServiceId)
        : state.barbers;

    refs.bookingBarbersGrid.innerHTML = activeBarbers.map((barber) => {
        const selected = barber.id === state.selectedBarberId;
        const profile = barber.publicProfile || createPublicBarberProfile(barber);
        return `
            <button type="button" class="booking-option ${selected ? "selected" : ""}" data-barber-id="${barber.id}">
                <div class="booking-avatar" style="background: linear-gradient(135deg, ${profile.color}, #f1e2be);">${escapeHtml(profile.initials)}</div>
                <div>
                    <h4>${escapeHtml(barber.name)}</h4>
                    <small>${escapeHtml(profile.headline || profile.specialty)}</small>
                    <div class="availability-badge">Agenda própria e atendimento especializado</div>
                </div>
            </button>
        `;
    }).join("");

    if (!activeBarbers.length) {
        refs.bookingBarbersGrid.innerHTML = `<div class="booking-option disabled"><h4>Nenhum barbeiro disponível</h4><p>Escolha outro serviço ou habilite barbeiros no painel.</p></div>`;
    }
}

async function renderSlots() {
    refs.bookingSlotsGrid.innerHTML = "";
    refs.bookingSlotFeedback.textContent = "";

    const service = state.services.find((item) => item.id === state.selectedServiceId);
    const barber = state.barbers.find((item) => item.id === state.selectedBarberId);
    if (!service || !barber || !state.selectedDate) {
        refs.bookingSlotFeedback.textContent = "Selecione o serviço, o barbeiro e a data para visualizar os horários.";
        return;
    }

    if (barber.daysOff?.includes(state.selectedDate)) {
        refs.bookingSlotFeedback.textContent = "Esse barbeiro está indisponível nesta data.";
        return;
    }

    const weekdayKey = getWeekdayKey(state.selectedDate);
    const schedule = barber.weeklySchedule?.[weekdayKey];
    if (!schedule?.opens) {
        refs.bookingSlotFeedback.textContent = "Esse barbeiro não atende nesse dia da semana.";
        return;
    }

    const snapshot = await getDocs(query(collection(db, "agendamentos"), where("data", "==", state.selectedDate)));
    const servicesMap = new Map(state.services.map((item) => [item.id, item]));
    const barbersMap = new Map(state.barbers.map((item) => [item.id, item]));
    const defaultBarberId = state.barbers[0]?.id || "";
    state.dateBookings = snapshot.docs.map((item) => normalizeBooking({ id: item.id, ...item.data() }, servicesMap, barbersMap, defaultBarberId));

    const sameBarberBookings = state.dateBookings.filter((booking) => {
        const bookingBarberId = booking.barberId || defaultBarberId;
        return bookingBarberId === barber.id && booking.status !== "cancelled";
    });

    const occupiedSlots = new Set();
    sameBarberBookings.forEach((booking) => {
        const totalSlots = Math.max(1, Math.ceil(toNumber(booking.duration, booking.slots * 30) / 30));
        const startMinutes = timeToMinutes(booking.hora);
        for (let index = 0; index < totalSlots; index += 1) {
            occupiedSlots.add(startMinutes + (index * 30));
        }
    });

    const baseTimes = buildTimeSlots(schedule, service.duration);
    const slotStates = baseTimes.map((slot) => {
        const startMinutes = timeToMinutes(slot);
        const requiredSlots = Math.max(1, Math.ceil(service.duration / 30));
        for (let index = 0; index < requiredSlots; index += 1) {
            if (occupiedSlots.has(startMinutes + (index * 30))) {
                return { slot, disabled: true };
            }
        }
        return { slot, disabled: isPastSlot(state.selectedDate, slot) };
    });
    const availableTimes = slotStates.filter((entry) => !entry.disabled).map((entry) => entry.slot);

    if (state.selectedTime && !availableTimes.includes(state.selectedTime)) {
        state.selectedTime = "";
        renderSummary();
    }

    if (!availableTimes.length) {
        refs.bookingSlotFeedback.textContent = "Nenhum horário disponível para essa combinação. Tente outra data.";
        return;
    }

    refs.bookingSlotFeedback.textContent = `Selecione um horário livre para ${barber.name}.`;
    refs.bookingSlotsGrid.innerHTML = slotStates.map(({ slot, disabled }) => `
        <button type="button" class="${slot === state.selectedTime ? "active" : ""}" data-slot="${slot}" ${disabled ? "disabled" : ""}>${slot}</button>
    `).join("");
}

function renderPlans() {
    if (!state.features.subscriptionsEnabled) {
        refs.plansGrid.innerHTML = `<article class="plan-card"><h3>Assinaturas desativadas</h3><p>O admin pode reativar o sistema de planos a qualquer momento.</p></article>`;
        return;
    }

    refs.plansGrid.innerHTML = state.plans.map((plan, index) => {
        const featuredClass = index === 1 ? "featured" : "";
        const includedServices = state.services
            .filter((service) => plan.includedServiceIds.includes(service.id))
            .map((service) => service.name);

        return `
            <article class="plan-card ${featuredClass}">
                <span class="eyebrow">Plano recorrente</span>
                <h3>${escapeHtml(plan.name)}</h3>
                <p>${escapeHtml(plan.description)}</p>
                <strong class="plan-price">${currency(plan.price)}</strong>
                <small>${escapeHtml(formatPlanHeadline(plan))}</small>
                <ul class="plan-features">
                    <li>${plan.monthlyLimit} uso(s) por serviço ao mês</li>
                    ${includedServices.map((name) => `<li>${escapeHtml(name)}</li>`).join("")}
                </ul>
                <button class="primary-button" type="button" data-subscribe-plan="${plan.id}">Assinar plano</button>
            </article>
        `;
    }).join("") || `<article class="plan-card"><h3>Nenhum plano publicado</h3><p>Cadastre os planos no admin para exibi-los aqui.</p></article>`;
}

function renderAccount() {
    const signedIn = Boolean(state.user);
    refs.authPanel.classList.toggle("hidden", signedIn);
    refs.accountPanel.classList.toggle("hidden", !signedIn);

    if (!signedIn) return;

    refs.accountName.textContent = state.userProfile?.nome || state.user.displayName || "Cliente";
    const contactInfo = [formatPhone(state.userProfile?.phone || ""), state.user?.email || ""].filter(Boolean).join(" · ");
    refs.accountContact.textContent = contactInfo || "Cadastro sem contato adicional";

    const nextBooking = state.userBookings.find((booking) => booking.status !== "cancelled" && `${booking.data}T${booking.hora}` >= `${getTodayISO()}T00:00`);
    refs.accountNextBooking.textContent = nextBooking
        ? `${nextBooking.serviceNameSnapshot} · ${formatDateTime(nextBooking.data, nextBooking.hora)}`
        : "Sem horário futuro";

    refs.accountSubscriptionStatus.textContent = state.userSubscription
        ? `${state.userSubscription.planName} · ${state.userSubscription.status}`
        : "Sem assinatura";
}

function renderBookings() {
    if (!state.user) {
        refs.myBookingsList.className = "stack-list empty-state";
        refs.myBookingsList.textContent = "Entre na sua conta para carregar seus agendamentos.";
        return;
    }

    if (!state.userBookings.length) {
        refs.myBookingsList.className = "stack-list empty-state";
        refs.myBookingsList.textContent = "Nenhum agendamento encontrado.";
        return;
    }

    refs.myBookingsList.className = "stack-list";
    refs.myBookingsList.innerHTML = state.userBookings
        .slice()
        .sort(compareBookings)
        .reverse()
        .map((booking) => {
            const isFuture = `${booking.data}T${booking.hora}` >= `${getTodayISO()}T00:00`;
            return `
                <article class="booking-list-item">
                    <header>
                        <div>
                            <strong>${escapeHtml(booking.serviceNameSnapshot)}</strong>
                            <p>${escapeHtml(booking.barberNameSnapshot)} · ${formatDateTime(booking.data, booking.hora)}</p>
                        </div>
                        <span class="status-pill ${escapeHtml(booking.status)}">${escapeHtml(booking.status)}</span>
                    </header>
                    <footer>
                        <span>${currency(booking.cashAmount)}</span>
                        ${isFuture && booking.status === "confirmed"
                ? `<button class="inline-button danger" type="button" data-cancel-booking="${booking.id}">Cancelar</button>`
                : ""
            }
                    </footer>
                </article>
            `;
        }).join("");
}

function renderSubscriptionPanel() {
    if (!state.user) {
        refs.mySubscriptionPanel.className = "stack-list empty-state";
        refs.mySubscriptionPanel.textContent = "Faça login para visualizar sua assinatura.";
        return;
    }

    if (!state.features.subscriptionsEnabled) {
        refs.mySubscriptionPanel.className = "stack-list empty-state";
        refs.mySubscriptionPanel.textContent = "O sistema de assinaturas está desativado no momento.";
        return;
    }

    if (!state.userSubscription) {
        refs.mySubscriptionPanel.className = "stack-list empty-state";
        refs.mySubscriptionPanel.textContent = "Nenhuma assinatura ativa encontrada.";
        return;
    }

    const serviceBadges = state.services
        .filter((service) => state.userSubscription.includedServiceIds.includes(service.id))
        .map((service) => {
            const usage = getSubscriptionUsage(service.id);
            return `
                <span class="booking-chip">
                    ${escapeHtml(service.name)} · ${usage.used}/${state.userSubscription.monthlyLimit}
                </span>
            `;
        }).join("");

    refs.mySubscriptionPanel.className = "stack-list";
    refs.mySubscriptionPanel.innerHTML = `
        <article class="subscription-status-card">
            <header>
                <div>
                    <strong>${escapeHtml(state.userSubscription.planName)}</strong>
                    <p>${currency(state.userSubscription.planPrice)} / ${escapeHtml(state.userSubscription.frequency)}</p>
                </div>
                <span class="status-pill confirmed">${escapeHtml(state.userSubscription.status)}</span>
            </header>
            <p>Próxima cobrança: ${escapeHtml(state.userSubscription.nextBillingDate || "não informada")}</p>
            <div class="team-tags">${serviceBadges || "<span>Sem serviços vinculados</span>"}</div>
        </article>
    `;
}

function renderSummary() {
    const service = state.services.find((item) => item.id === state.selectedServiceId);
    const barber = state.barbers.find((item) => item.id === state.selectedBarberId);
    const usage = service ? getSubscriptionUsage(service.id) : null;
    const canUseSubscription = Boolean(
        usage
        && usage.eligible
        && usage.remaining > 0
        && state.userSubscription?.status === "active"
    );

    refs.summaryService.textContent = service ? service.name : "Selecione um serviço";
    refs.summaryBarber.textContent = barber ? barber.name : "Selecione um barbeiro";
    refs.summarySlot.textContent = state.selectedDate && state.selectedTime
        ? formatDateTime(state.selectedDate, state.selectedTime)
        : "Escolha data e hora";
    refs.summaryDuration.textContent = service ? `${service.duration} minutos` : "--";
    refs.summaryPrice.textContent = service ? currency(canUseSubscription ? 0 : service.price) : currency(0);
    refs.summarySubscriptionNote.textContent = canUseSubscription
        ? `Incluído no seu plano (${usage.remaining} uso(s) restante(s) neste mês).`
        : "";

    const ready = Boolean(service && barber && state.selectedDate && state.selectedTime);
    refs.bookingSubmit.disabled = !ready;
}

function selectService(serviceId) {
    state.selectedServiceId = serviceId;
    if (!getBarbersForService(state.barbers, serviceId).some((barber) => barber.id === state.selectedBarberId)) {
        state.selectedBarberId = "";
        state.selectedTime = "";
    }
    renderServices();
    renderBookingBarbers();
    renderSummary();
    renderSlots();
}

function selectBarber(barberId) {
    state.selectedBarberId = barberId;
    state.selectedTime = "";
    renderBookingBarbers();
    renderSummary();
    renderSlots();
}

function selectTime(time) {
    state.selectedTime = time;
    renderSummary();
    Array.from(refs.bookingSlotsGrid.querySelectorAll("button")).forEach((button) => {
        button.classList.toggle("active", button.dataset.slot === time);
    });
}

async function finalizeBooking() {
    if (!state.user) {
        toast("Entre na sua conta para confirmar o agendamento.", "error");
        document.getElementById("cliente").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    const service = state.services.find((item) => item.id === state.selectedServiceId);
    const barber = state.barbers.find((item) => item.id === state.selectedBarberId);
    if (!service || !barber || !state.selectedDate || !state.selectedTime) {
        toast("Complete o serviço, o barbeiro, a data e o horário.", "error");
        return;
    }

    const usage = getSubscriptionUsage(service.id);
    const isSubscription = Boolean(
        usage
        && usage.eligible
        && usage.remaining > 0
        && state.userSubscription?.status === "active"
    );

    const financials = calculateBookingFinancials({
        basePrice: service.price,
        extras: [],
        commissionPercent: barber.commissionPercent,
        isSubscription,
    });

    const bookingDateTime = new Date(`${state.selectedDate}T${state.selectedTime}:00`);
    if (bookingDateTime.getTime() < Date.now()) {
        toast("O horário selecionado já passou. Escolha outro.", "error");
        await renderSlots();
        return;
    }

    refs.bookingSubmit.disabled = true;
    refs.bookingSubmit.textContent = "Confirmando...";

    try {
        await addDoc(collection(db, "agendamentos"), {
            userId: state.user.uid,
            clientId: state.user.uid,
            clientName: state.userProfile?.nome || state.user.displayName || "Cliente",
            clientPhone: state.userProfile?.phone || "",
            nome: state.userProfile?.nome || state.user.displayName || "Cliente",
            cliente: state.userProfile?.nome || state.user.displayName || "Cliente",
            telefone: state.userProfile?.phone || "",
            serviceId: service.id,
            servico: service.name,
            serviceNameSnapshot: service.name,
            barberId: barber.id,
            barberNameSnapshot: barber.name,
            data: state.selectedDate,
            hora: state.selectedTime,
            duration: service.duration,
            slots: Math.max(1, Math.ceil(service.duration / 30)),
            notes: refs.bookingNotes.value.trim(),
            observacoes: refs.bookingNotes.value.trim(),
            status: "confirmed",
            priceSnapshot: service.price,
            preco: service.price,
            cashAmount: financials.cashAmount,
            productionAmount: financials.productionAmount,
            ownerCommissionAmount: financials.ownerCommissionAmount,
            barberNetAmount: financials.barberNetAmount,
            commissionPercent: barber.commissionPercent,
            extras: [],
            isSubscription,
            subscriptionId: state.userSubscription?.id || "",
            subscriptionPlan: state.userSubscription?.planName || "",
            createdAt: serverTimestamp(),
            timestamp: serverTimestamp(),
        });

        refs.bookingNotes.value = "";
        state.selectedTime = "";
        toast("Agendamento confirmado com sucesso.", "success");
        await renderSlots();
        renderSummary();
    } catch (error) {
        console.error(error);
        toast("Não foi possível confirmar o agendamento.", "error");
    } finally {
        refs.bookingSubmit.textContent = "Confirmar agendamento";
        renderSummary();
    }
}

async function subscribeToPlan(planId) {
    if (!state.features.subscriptionsEnabled) {
        toast("Assinaturas estão desativadas.", "error");
        return;
    }

    if (!state.user) {
        toast("Entre na sua conta para contratar um plano.", "error");
        document.getElementById("cliente").scrollIntoView({ behavior: "smooth", block: "start" });
        return;
    }

    if (state.userSubscription?.status === "active") {
        toast("Você já possui uma assinatura ativa.", "error");
        return;
    }

    const plan = state.plans.find((item) => item.id === planId);
    if (!plan) {
        toast("Plano não encontrado.", "error");
        return;
    }

    try {
        await addDoc(collection(db, "assinaturas"), {
            clientId: state.user.uid,
            clientName: state.userProfile?.nome || state.user.displayName || "Cliente",
            clientPhone: state.userProfile?.phone || "",
            planId: plan.id,
            planName: plan.name,
            planPrice: plan.price,
            includedServiceIds: plan.includedServiceIds,
            monthlyLimit: plan.monthlyLimit,
            frequency: plan.frequency,
            status: "active",
            paymentStatus: "pending",
            nextBillingDate: addDays(getTodayISO(), 30),
            createdAt: serverTimestamp(),
        });
        toast("Assinatura criada com sucesso.", "success");
    } catch (error) {
        console.error(error);
        toast("Não foi possível contratar o plano.", "error");
    }
}

async function cancelBooking(bookingId) {
    const booking = state.userBookings.find((item) => item.id === bookingId);
    if (!booking) return;
    if (!window.confirm(`Cancelar ${booking.serviceNameSnapshot} em ${formatDateTime(booking.data, booking.hora)}?`)) {
        return;
    }

    try {
        await updateDoc(doc(db, "agendamentos", bookingId), {
            status: "cancelled",
            updatedAt: serverTimestamp(),
        });
        toast("Agendamento cancelado.", "success");
    } catch (error) {
        console.error(error);
        toast("Não foi possível cancelar o agendamento.", "error");
    }
}

function getSubscriptionUsage(serviceId) {
    if (!state.userSubscription || state.userSubscription.status !== "active") return null;
    const eligible = state.userSubscription.includedServiceIds.includes(serviceId);
    const used = state.userBookings.filter((booking) => {
        return booking.isSubscription
            && booking.serviceId === serviceId
            && booking.status !== "cancelled"
            && getMonthKey(booking.data) === getMonthKey(state.selectedDate || getTodayISO());
    }).length;
    return {
        eligible,
        used,
        remaining: Math.max(0, state.userSubscription.monthlyLimit - used),
    };
}

function reconcileSelection() {
    if (state.selectedServiceId && !state.services.some((item) => item.id === state.selectedServiceId)) {
        state.selectedServiceId = "";
    }

    if (state.selectedBarberId && !state.barbers.some((item) => item.id === state.selectedBarberId)) {
        state.selectedBarberId = "";
    }

    renderServices();
    renderBookingBarbers();
    renderSummary();
}

function toast(message, type = "success") {
    const toastElement = document.createElement("div");
    toastElement.className = `toast ${type}`;
    toastElement.textContent = message;
    refs.toastRegion.appendChild(toastElement);
    window.setTimeout(() => {
        toastElement.remove();
    }, 3400);
}

function formatPlural(value, singular, plural) {
    const amount = toNumber(value, 0);
    return `${amount} ${amount === 1 ? singular : plural}`;
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js").catch((error) => {
            console.warn("Falha ao registrar service worker:", error.message);
        });
    }
}
