import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const BOOTSTRAP_OWNER_EMAIL = "saullinho2008@gmail.com";
const DEFAULT_SCHEDULE = {
  domingo: { opens: false, start: "09:00", end: "18:00", lunchStart: "12:00", lunchEnd: "13:00" },
  segunda: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
  terca: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
  quarta: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
  quinta: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
  sexta: { opens: true, start: "09:00", end: "19:00", lunchStart: "12:00", lunchEnd: "13:00" },
  sabado: { opens: true, start: "09:00", end: "17:00", lunchStart: "12:00", lunchEnd: "13:00" },
};
const DEFAULT_SERVICES = [
  {
    id: "corte-classico",
    name: "Corte Clássico",
    description: "Acabamento social com finalização premium e consultoria de estilo.",
    duration: 45,
    price: 45,
    category: "Corte",
    active: true,
    highlight: true,
  },
  {
    id: "corte-degrade",
    name: "Degradê Premium",
    description: "Transição limpa com acabamento detalhado e alinhamento completo.",
    duration: 60,
    price: 55,
    category: "Corte",
    active: true,
    highlight: true,
  },
  {
    id: "barba-executiva",
    name: "Barba Executiva",
    description: "Modelagem, navalha e toalha quente para desenho preciso.",
    duration: 35,
    price: 35,
    category: "Barba",
    active: true,
    highlight: false,
  },
];

const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function defaultBarberPayload(override = {}) {
  return {
    name: override.name || "Administrador",
    email: override.email || "",
    phone: override.phone || "",
    role: override.role || "owner",
    active: override.active ?? true,
    acceptsBookings: override.acceptsBookings ?? true,
    commissionPercent: toNumber(override.commissionPercent, 35),
    serviceIds: Array.isArray(override.serviceIds) ? override.serviceIds : DEFAULT_SERVICES.map((service) => service.id),
    weeklySchedule: override.weeklySchedule || DEFAULT_SCHEDULE,
    daysOff: Array.isArray(override.daysOff) ? override.daysOff : [],
    color: override.color || "#c89b53",
    headline: override.headline || "",
    authUid: override.authUid || override.id || "",
    updatedAt: new Date(),
  };
}

async function getCallerBarber(authData) {
  if (!authData?.uid) return null;
  const snap = await db.collection("barbers").doc(authData.uid).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

async function assertOwner(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Usuário não autenticado.");
  }
  if (normalizeEmail(request.auth.token.email) === BOOTSTRAP_OWNER_EMAIL) {
    return { bootstrap: true };
  }
  const barber = await getCallerBarber(request.auth);
  if (!barber || barber.role !== "owner") {
    throw new HttpsError("permission-denied", "Apenas o dono pode executar essa ação.");
  }
  return barber;
}

async function ensureDefaultServices() {
  const servicesSnap = await db.collection("services").get();
  if (!servicesSnap.empty) return servicesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  for (const service of DEFAULT_SERVICES) {
    await db.collection("services").doc(service.id).set({
      ...service,
      createdAt: new Date(),
    }, { merge: true });
  }
  return DEFAULT_SERVICES;
}

function matchServiceByName(services, serviceName) {
  const normalized = String(serviceName || "").trim().toLowerCase();
  return services.find((service) => service.id === normalized || String(service.name || "").trim().toLowerCase() === normalized) || services[0] || null;
}

function calculateFinancials(basePrice, extras = [], commissionPercent = 35, isSubscription = false) {
  const safeBase = toNumber(basePrice, 0);
  const extrasTotal = extras.reduce((sum, item) => sum + toNumber(item.price), 0);
  const productionAmount = safeBase + extrasTotal;
  const ownerCommissionAmount = productionAmount * (toNumber(commissionPercent, 35) / 100);
  const barberNetAmount = productionAmount - ownerCommissionAmount;
  const cashAmount = isSubscription ? extrasTotal : productionAmount;
  return {
    priceSnapshot: safeBase,
    cashAmount,
    productionAmount,
    ownerCommissionAmount,
    barberNetAmount,
  };
}

function formatBookingDate(booking) {
  if (!booking?.data || !booking?.hora) return "data não informada";
  const [year, month, day] = booking.data.split("-").map((value) => Number(value));
  const [hour, minute] = booking.hora.split(":").map((value) => Number(value));
  const date = new Date(year, month - 1, day, hour, minute);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function syncPublicBarberProfile(barberId, data) {
  const publicData = {
    name: data.name || "Barbeiro",
    role: data.role || "barber",
    active: data.active !== false,
    acceptsBookings: data.acceptsBookings !== false,
    commissionPercent: toNumber(data.commissionPercent, 35),
    serviceIds: Array.isArray(data.serviceIds) ? data.serviceIds : [],
    weeklySchedule: data.weeklySchedule || DEFAULT_SCHEDULE,
    daysOff: Array.isArray(data.daysOff) ? data.daysOff : [],
    color: data.color || "#c89b53",
    headline: data.headline || "",
    photoUrl: data.photoUrl || "",
    updatedAt: new Date(),
  };
  await db.collection("barbers_public").doc(barberId).set(publicData, { merge: true });
}

async function collectNotificationTokens(barberId) {
  const tokensSnap = await db.collection("barbeirosTokens").get();
  const ownersSnap = await db.collection("barbers").where("role", "==", "owner").get();
  const ownerIds = new Set(ownersSnap.docs.filter((doc) => doc.data().active !== false).map((doc) => doc.id));

  const tokens = new Set();
  tokensSnap.forEach((doc) => {
    const data = doc.data();
    if (!data?.token || data.active === false) return;
    if (data.barberId === barberId || ownerIds.has(data.uid) || data.role === "owner") {
      tokens.add(data.token);
    }
  });

  return [...tokens];
}

async function sendBookingNotification({ booking, title, body }) {
  const tokens = await collectNotificationTokens(booking.barberId);
  if (!tokens.length) return;
  await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    webpush: {
      notification: {
        title,
        body,
        icon: "/icon-192.png",
      },
    },
  });
}

export const debugTokens = onCall(async () => {
  const snapshot = await db.collection("barbeirosTokens").get();
  return {
    count: snapshot.size,
    tokens: snapshot.docs.map((doc) => ({
      id: doc.id,
      uid: doc.data().uid || "",
      email: doc.data().email || "",
      barberId: doc.data().barberId || "",
      role: doc.data().role || "",
    })),
  };
});

export const upsertBarberAccount = onCall(async (request) => {
  await assertOwner(request);

  const barberId = String(request.data?.barberId || "").trim();
  const email = normalizeEmail(request.data?.email);
  const password = String(request.data?.password || "").trim();
  const name = String(request.data?.name || "Barbeiro").trim();
  const role = request.data?.role === "owner" ? "owner" : "barber";
  const active = request.data?.active !== false;

  if (!email) {
    throw new HttpsError("invalid-argument", "E-mail do barbeiro é obrigatório.");
  }

  if (!barberId && password.length < 6) {
    throw new HttpsError("invalid-argument", "Senha inicial do barbeiro deve ter ao menos 6 caracteres.");
  }

  let authUid = barberId;
  let userRecord;

  if (barberId) {
    try {
      userRecord = await auth.getUser(barberId);
      const updatePayload = {
        email,
        displayName: name,
        disabled: !active,
      };
      if (password.length >= 6) {
        updatePayload.password = password;
      }
      userRecord = await auth.updateUser(barberId, updatePayload);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        userRecord = await auth.createUser({
          uid: barberId,
          email,
          password: password || Math.random().toString(36).slice(2, 10) + "Aa1!",
          displayName: name,
          disabled: !active,
        });
      } else {
        throw error;
      }
    }
    authUid = userRecord.uid;
  } else {
    userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      disabled: !active,
    });
    authUid = userRecord.uid;
  }

  await auth.setCustomUserClaims(authUid, {
    role,
    barberId: authUid,
  });

  return {
    barberId: authUid,
    authUid,
    email,
  };
});

export const migrateLegacyData = onCall(async (request) => {
  await assertOwner(request);

  const services = await ensureDefaultServices();
  let barbersSnap = await db.collection("barbers").get();
  if (barbersSnap.empty) {
    const caller = request.auth;
    const ownerProfile = defaultBarberPayload({
      id: caller.uid,
      authUid: caller.uid,
      email: caller.token.email || "",
      name: caller.token.name || "Administrador",
      role: "owner",
      headline: "Perfil inicial gerado pela migração.",
    });
    await db.collection("barbers").doc(caller.uid).set(ownerProfile, { merge: true });
    await syncPublicBarberProfile(caller.uid, ownerProfile);
    barbersSnap = await db.collection("barbers").get();
  }

  const defaultBarber = barbersSnap.docs[0];
  const barbersById = new Map(barbersSnap.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]));

  for (const barberDoc of barbersSnap.docs) {
    await syncPublicBarberProfile(barberDoc.id, barberDoc.data());
  }

  const updates = [];
  const bookingsSnap = await db.collection("agendamentos").get();
  bookingsSnap.forEach((bookingDoc) => {
    const data = bookingDoc.data();
    const barberId = data.barberId || defaultBarber.id;
    const barber = barbersById.get(barberId) || barbersById.get(defaultBarber.id);
    const service = data.serviceId
      ? services.find((item) => item.id === data.serviceId) || matchServiceByName(services, data.servico)
      : matchServiceByName(services, data.servico);

    if (!barber || !service) return;

    const extras = Array.isArray(data.extras) ? data.extras : [];
    const financials = calculateFinancials(
      data.priceSnapshot ?? data.preco ?? service.price,
      extras,
      data.commissionPercent ?? barber.commissionPercent ?? 35,
      Boolean(data.isSubscription)
    );

    updates.push(
      bookingDoc.ref.set({
        barberId,
        barberNameSnapshot: data.barberNameSnapshot || barber.name,
        serviceId: data.serviceId || service.id,
        serviceNameSnapshot: data.serviceNameSnapshot || data.servico || service.name,
        duration: data.duration || service.duration,
        commissionPercent: data.commissionPercent ?? barber.commissionPercent ?? 35,
        ...financials,
        updatedAt: new Date(),
      }, { merge: true })
    );
  });

  await Promise.all(updates);

  await db.collection("configuracoes_gerais").doc("features").set({
    subscriptionsEnabled: true,
    fiscalReportEnabled: true,
    updatedAt: new Date(),
  }, { merge: true });

  return {
    barbers: barbersSnap.size,
    bookingsUpdated: updates.length,
  };
});

export const syncBarberAuthAndPublicProfile = onDocumentWritten("barbers/{barberId}", async (event) => {
  const barberId = event.params.barberId;
  if (!event.data?.after?.exists) {
    await db.collection("barbers_public").doc(barberId).delete().catch(() => null);
    try {
      await auth.updateUser(barberId, { disabled: true });
    } catch {
      // ignore missing auth users
    }
    return;
  }

  const data = event.data.after.data();
  const profile = defaultBarberPayload({ ...data, id: barberId, authUid: data.authUid || barberId });
  await syncPublicBarberProfile(barberId, profile);
  try {
    await auth.setCustomUserClaims(profile.authUid, {
      role: profile.role,
      barberId,
    });
    const updatePayload = {
      disabled: !profile.active,
      displayName: profile.name,
    };
    if (profile.email) {
      updatePayload.email = profile.email;
    }
    await auth.updateUser(profile.authUid, updatePayload);
  } catch {
    // ignore auth sync errors until the user account exists
  }
});

export const notifyNewBooking = onDocumentCreated("agendamentos/{docId}", async (event) => {
  const booking = event.data?.data();
  if (!booking) return;
  await sendBookingNotification({
    booking,
    title: "Novo agendamento",
    body: `${booking.clientName || booking.nome || "Cliente"} • ${booking.serviceNameSnapshot || booking.servico} • ${formatBookingDate(booking)}`,
  });
});

export const notifyBookingStatusChanges = onDocumentUpdated("agendamentos/{docId}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after || before.status === after.status) return;

  const normalized = String(after.status || "").toLowerCase();
  if (normalized === "cancelled") {
    await sendBookingNotification({
      booking: after,
      title: "Agendamento cancelado",
      body: `${after.clientName || after.nome || "Cliente"} cancelou ${after.serviceNameSnapshot || after.servico} em ${formatBookingDate(after)}`,
    });
  }

  if (normalized === "completed") {
    await sendBookingNotification({
      booking: after,
      title: "Atendimento concluído",
      body: `${after.clientName || after.nome || "Cliente"} concluiu ${after.serviceNameSnapshot || after.servico}.`,
    });
  }
});
