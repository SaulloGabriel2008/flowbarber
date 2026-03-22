const MARKETING_CONFIG = {
    whatsappNumber: "5511999999999",
    whatsappMessage: "I want to install Flow Barber in my barbershop",
};

const DEMO_SERVICES = [
    {
        id: "corte-degrade",
        name: "Corte Degrade",
        description: "O servico mais buscado para mostrar velocidade e valor.",
        price: 45,
    },
    {
        id: "barba-premium",
        name: "Barba Premium",
        description: "Boa opcao para mostrar ticket medio e acabamento.",
        price: 35,
    },
    {
        id: "combo-completo",
        name: "Combo Completo",
        description: "Mostra como o sistema aumenta clareza em servicos maiores.",
        price: 65,
    },
    {
        id: "plano-mensal",
        name: "Plano Mensal",
        description: "Ajuda a vender recorrencia e previsibilidade.",
        price: 89,
    },
];

const DEMO_TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];

const state = {
    serviceId: "",
    date: "",
    time: "",
};

const refs = {
    services: document.getElementById("demo-services"),
    date: document.getElementById("demo-date"),
    times: document.getElementById("demo-times"),
    summaryService: document.getElementById("demo-summary-service"),
    summaryDate: document.getElementById("demo-summary-date"),
    summaryTime: document.getElementById("demo-summary-time"),
    summaryPrice: document.getElementById("demo-summary-price"),
    confirm: document.getElementById("demo-confirm"),
    feedback: document.getElementById("demo-feedback"),
    whatsappLinks: Array.from(document.querySelectorAll("[data-whatsapp-link]")),
    revealNodes: Array.from(document.querySelectorAll("[data-reveal]")),
};

init();

function init() {
    configureWhatsAppLinks();
    configureDemoDate();
    renderServices();
    renderTimes();
    bindEvents();
    renderSummary();
    setupRevealObserver();
}

function configureWhatsAppLinks() {
    const url = buildWhatsAppUrl();
    refs.whatsappLinks.forEach((link) => {
        link.href = url;
        link.target = "_blank";
        link.rel = "noreferrer noopener";
    });
}

function buildWhatsAppUrl() {
    const number = digitsOnly(MARKETING_CONFIG.whatsappNumber);
    const message = encodeURIComponent(MARKETING_CONFIG.whatsappMessage);
    return `https://wa.me/${number}?text=${message}`;
}

function configureDemoDate() {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    refs.date.min = localDate;
    refs.date.value = localDate;
    state.date = localDate;
}

function bindEvents() {
    refs.services.addEventListener("click", (event) => {
        const button = event.target.closest("[data-service-id]");
        if (!button) return;
        state.serviceId = button.dataset.serviceId;
        resetFeedback();
        renderServices();
        renderSummary();
    });

    refs.times.addEventListener("click", (event) => {
        const button = event.target.closest("[data-time]");
        if (!button) return;
        state.time = button.dataset.time;
        resetFeedback();
        renderTimes();
        renderSummary();
    });

    refs.date.addEventListener("change", () => {
        state.date = refs.date.value;
        resetFeedback();
        renderSummary();
    });

    refs.confirm.addEventListener("click", () => {
        if (!canConfirm()) return;
        refs.feedback.textContent = "Demo confirmado: o cliente finaliza sozinho e o barbeiro recebe tudo organizado.";
        refs.feedback.classList.add("success");
    });
}

function renderServices() {
    refs.services.innerHTML = DEMO_SERVICES.map((service) => {
        const active = service.id === state.serviceId ? " active" : "";
        return `
            <button class="service-option${active}" type="button" data-service-id="${service.id}">
                <strong>${service.name}</strong>
                <span>${service.description}</span>
                <small>${formatCurrency(service.price)}</small>
            </button>
        `;
    }).join("");
}

function renderTimes() {
    refs.times.innerHTML = DEMO_TIMES.map((time) => {
        const active = time === state.time ? " active" : "";
        return `<button class="time-option${active}" type="button" data-time="${time}">${time}</button>`;
    }).join("");
}

function renderSummary() {
    const service = DEMO_SERVICES.find((item) => item.id === state.serviceId);
    refs.summaryService.textContent = service ? service.name : "---";
    refs.summaryDate.textContent = state.date ? formatDate(state.date) : "---";
    refs.summaryTime.textContent = state.time || "---";
    refs.summaryPrice.textContent = service ? formatCurrency(service.price) : "R$ 0";
    refs.confirm.disabled = !canConfirm();
}

function canConfirm() {
    return Boolean(state.serviceId && state.date && state.time);
}

function resetFeedback() {
    refs.feedback.textContent = "O barbeiro recebe tudo organizado e sem precisar responder manualmente.";
    refs.feedback.classList.remove("success");
}

function setupRevealObserver() {
    if (!("IntersectionObserver" in window)) {
        refs.revealNodes.forEach((node) => node.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.2 });

    refs.revealNodes.forEach((node) => observer.observe(node));
}

function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
}

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
    }).format(value || 0);
}

function formatDate(value) {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return "---";
    return `${day}/${month}/${year}`;
}
