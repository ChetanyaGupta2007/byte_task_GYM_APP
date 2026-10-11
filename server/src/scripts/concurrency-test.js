const base = `http://localhost:${process.env.PORT || 4000}/api`;

async function call(path, method, token, body) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return { status: res.status, data: await res.json() };
}

const admin = await call("/auth/login", "POST", null, {
  email: process.env.SEED_ADMIN_EMAIL,
  password: process.env.SEED_ADMIN_PASSWORD,
});
const adminToken = admin.data.token;

const startsAt = new Date();
startsAt.setUTCDate(startsAt.getUTCDate() + 30 + Math.floor(Math.random() * 300));
startsAt.setUTCHours(Math.floor(Math.random() * 24), 0, 0, 0);

const created = await call("/sessions", "POST", adminToken, {
  startsAt: startsAt.toISOString(),
  capacity: 1,
});
if (created.status !== 201) {
  console.error("Could not create test session:", created.data);
  process.exit(1);
}
const sessionId = created.data.session.id;

const members = await Promise.all(
  [1, 2, 3, 4, 5].map((n) =>
    call("/auth/register", "POST", null, {
      name: `Racer ${n}`,
      email: `racer-${Date.now()}-${n}@test.com`,
      password: "password123",
    })
  )
);

const results = await Promise.all(
  members.map((member) =>
    call("/bookings", "POST", member.data.token, { sessionId })
  )
);

const statuses = results.map((result) => result.status);
const wins = statuses.filter((status) => status === 201).length;

const date = startsAt.toISOString().slice(0, 10);
const list = await call(`/sessions?date=${date}`, "GET", adminToken);
const saved = list.data.sessions.find((session) => session.id === sessionId);

console.log("Statuses:", statuses.join(", "));
console.log("Bookings accepted:", wins);
console.log("bookedCount in database:", saved.bookedCount);

if (wins === 1 && saved.bookedCount === 1) {
  console.log("PASS");
} else {
  console.log("FAIL");
  process.exitCode = 1;
}