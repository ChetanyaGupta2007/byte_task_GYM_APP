# byte_task_GYM_APP# Gym Booking

A web app where members book hourly gym sessions, join a waitlist when a session is full, and check in with a code. Admins create sessions and check members in.

frontend https://byte-task-gym-app.vercel.app/

## Test accounts

| Role  Email  Password |

| Admin  <SEED_ADMIN_EMAIL>  <SEED_ADMIN_PASSWORD> |
| Member  member1@test.com  password123 |
| Member  member2@test.com  password123 |
| Member  member3@test.com  password123 |

The database contains sessions over the next few days, including one that is full (with a waitlist) and one with a single seat left. member1 holds bookings with check-in codes (see "My bookings").

## Design note

1. **Stack:** React (Vite, React Router) frontend; Node + Express API; MongoDB (Mongoose); JWT auth; Zod validation.
2. **Models:** `User` (name, email, passwordHash, role), `Session` (startsAt, capacity, bookedCount), `Booking` (user, session, status, checkInCode, checkedInAt), `Waitlist` (user, session, createdAt).
3. **No overbooking:** one atomic `findOneAndUpdate` raises `bookedCount` only while `bookedCount < capacity`, so concurrent requests cannot take the same last seat.
4. **No double booking:** a partial unique index on (user, session) for `confirmed` bookings; cancelled bookings are kept for history.
5. **Waitlist:** ordered by (createdAt, _id). Cancelling hands the seat to the first entry, so `bookedCount` stays unchanged.
6. **Check-in:** 6-character code with a unique index; only accepted from the session's start until one hour later, once per booking.
7. **Time:** sessions start exactly on the UTC hour; all times are stored and shown in UTC.
8. **Live updates:** the frontend polls every 5 seconds (10 on My bookings).

## Run locally

Requires Node 20+ and a MongoDB connection string (local or Atlas).


# backend
cd backend
cp .env.example .env        # fill in MONGODB_URI, JWT_SECRET, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (12+ chars)
npm install
npm run seed                # creates the admin
npm run dev                 # http://localhost:4000

# frontend (second terminal)
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173




