-- ============================================================================
-- ResQMesh — Supabase Postgres schema
-- Paste this whole file into Supabase Dashboard -> SQL Editor -> New query
-- -> Run. Safe to re-run (uses IF NOT EXISTS / DROP ... IF EXISTS guards).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── users ───────────────────────────────────────────────────────────────
create table if not exists users (
    id              text primary key,
    username        text unique not null,
    email           text unique,
    password_hash   text,                    -- null for Google-only accounts
    google_sub      text unique,
    display_name    text not null,
    role            text not null check (role in ('REQUESTER','VOLUNTEER','PROVIDER','ADMIN')),
    created_at      timestamptz not null default now()
);

-- ── locations (named-area reference table) ─────────────────────────────
create table if not exists locations (
    id              text primary key,
    label           text unique not null,
    latitude        double precision not null,
    longitude       double precision not null
);

-- ── resources ───────────────────────────────────────────────────────────
create table if not exists resources (
    id                text primary key,
    provider_id       text not null,
    provider_name     text not null,          -- display name only — no PII
    type              text not null check (type in (
                          'VEHICLE','FIRST_AID_KIT','MEDICINE','BLOOD','FOOD','WATER',
                          'SHELTER','POWER_BANK','MEDICAL_SKILL','RESCUE_SKILL','TRANSPORT',
                          'COMMUNICATION_EQUIPMENT','OTHER')),
    name              text not null,
    capacity          integer,
    skills            jsonb,                  -- list[string]
    latitude          double precision not null,
    longitude         double precision not null,
    location_label    text not null,
    availability      text not null default 'AVAILABLE' check (availability in ('AVAILABLE','BUSY','OFFLINE')),
    status            text not null default 'IDLE' check (status in ('IDLE','ASSIGNED','EN_ROUTE','ON_MISSION')),
    response_history  integer not null default 0,
    created_at        timestamptz not null default now()
);
create index if not exists idx_resources_type on resources(type);
create index if not exists idx_resources_availability on resources(availability);

-- ── emergency_requests ──────────────────────────────────────────────────
create table if not exists emergency_requests (
    id                        text primary key,
    request_code              text unique not null,          -- REQ-1042
    user_id                   text references users(id) on delete set null,
    description               text not null,
    category                  text not null check (category in (
                                  'MEDICAL','FIRE','FLOOD','EVACUATION','ACCIDENT','FOOD','WATER',
                                  'MEDICINE','SHELTER','RESCUE','TRANSPORT','POWER','OTHER')),
    secondary_category        text,
    severity                  text not null check (severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
    priority_score            integer not null check (priority_score between 0 and 100),
    required_resource         jsonb not null,                 -- list[string]
    latitude                  double precision not null,
    longitude                 double precision not null,
    location_label            text not null,
    people_count              integer not null default 1,
    special_requirements      text,
    vulnerable_flags          jsonb,
    status                    text not null default 'SEARCHING' check (status in (
                                  'SEARCHING','ASSIGNED','ACCEPTED','EN_ROUTE','ARRIVED','RESOLVED','CANCELLED')),
    assigned_resource_id      text references resources(id) on delete set null,
    classification_breakdown  jsonb,
    matched_keywords          jsonb,
    recommended_action        text,
    confidence                double precision,
    created_at                timestamptz not null default now(),
    updated_at                timestamptz not null default now()
);
create index if not exists idx_emergencies_status on emergency_requests(status);
create index if not exists idx_emergencies_severity on emergency_requests(severity);
create index if not exists idx_emergencies_category on emergency_requests(category);

-- ── resource_assignments ────────────────────────────────────────────────
create table if not exists resource_assignments (
    id              text primary key,
    request_id      text not null references emergency_requests(id) on delete cascade,
    resource_id     text not null references resources(id) on delete cascade,
    match_score     integer not null check (match_score between 0 and 100),
    distance_km     double precision not null,
    eta_minutes     integer not null,
    status          text not null default 'ASSIGNED' check (status in (
                        'ASSIGNED','ACCEPTED','EN_ROUTE','ARRIVED','RESOLVED','CANCELLED')),
    assigned_at     timestamptz not null default now(),
    completed_at    timestamptz
);
create index if not exists idx_assignments_request on resource_assignments(request_id);
create index if not exists idx_assignments_resource on resource_assignments(resource_id);

-- ── facilities (hospitals / shelters / pharmacies / food & water centers) ─
create table if not exists facilities (
    id              text primary key,
    name            text not null,
    type            text not null check (type in ('HOSPITAL','SHELTER','PHARMACY','FOOD_CENTER','WATER_CENTER')),
    latitude        double precision not null,
    longitude       double precision not null,
    location_label  text not null,
    capacity        integer not null default 0,
    availability    text not null default 'AVAILABLE' check (availability in ('AVAILABLE','LIMITED','FULL')),
    contact         text,
    services        jsonb
);
create index if not exists idx_facilities_type on facilities(type);

-- ── mission_events ──────────────────────────────────────────────────────
create table if not exists mission_events (
    id              text primary key,
    request_id      text not null references emergency_requests(id) on delete cascade,
    event_type      text not null,
    message         text not null,
    event_metadata  jsonb,
    created_at      timestamptz not null default now()
);
create index if not exists idx_events_request on mission_events(request_id);

-- ── notifications (broadcast + per-user feed) ──────────────────────────
create table if not exists notifications (
    id              text primary key,
    user_id         text references users(id) on delete cascade,  -- null = broadcast to everyone
    request_id      text references emergency_requests(id) on delete set null,
    title           text not null,
    body            text,
    read            boolean not null default false,
    created_at      timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- ── analytics (optional periodic rollups; live queries are the default) ─
create table if not exists analytics (
    id                      text primary key,
    snapshot_date           timestamptz not null default now(),
    total_emergencies       integer not null default 0,
    resolved_emergencies    integer not null default 0,
    avg_response_time_min   double precision not null default 0,
    successful_matches      integer not null default 0,
    failed_matches          integer not null default 0,
    avg_match_score         double precision not null default 0
);

-- ============================================================================
-- Row Level Security — enabled with permissive policies suitable for this
-- hackathon prototype (the FastAPI backend, not client-side Supabase calls,
-- is the trust boundary). Tighten these before any real production use:
-- e.g. restrict emergency_requests reads/writes to authenticated service
-- roles only, and scope notifications to auth.uid() = user_id OR user_id
-- IS NULL.
-- ============================================================================
alter table users enable row level security;
alter table resources enable row level security;
alter table emergency_requests enable row level security;
alter table resource_assignments enable row level security;
alter table facilities enable row level security;
alter table mission_events enable row level security;
alter table notifications enable row level security;
alter table analytics enable row level security;
alter table locations enable row level security;

drop policy if exists "service role full access" on users;
create policy "service role full access" on users for all using (true) with check (true);
drop policy if exists "service role full access" on resources;
create policy "service role full access" on resources for all using (true) with check (true);
drop policy if exists "service role full access" on emergency_requests;
create policy "service role full access" on emergency_requests for all using (true) with check (true);
drop policy if exists "service role full access" on resource_assignments;
create policy "service role full access" on resource_assignments for all using (true) with check (true);
drop policy if exists "service role full access" on facilities;
create policy "service role full access" on facilities for all using (true) with check (true);
drop policy if exists "service role full access" on mission_events;
create policy "service role full access" on mission_events for all using (true) with check (true);
drop policy if exists "service role full access" on notifications;
create policy "service role full access" on notifications for all using (true) with check (true);
drop policy if exists "service role full access" on analytics;
create policy "service role full access" on analytics for all using (true) with check (true);
drop policy if exists "service role full access" on locations;
create policy "service role full access" on locations for all using (true) with check (true);

-- Done. The FastAPI backend will auto-create any missing tables on boot as
-- a convenience fallback, but running this script first is recommended so
-- indexes, constraints, and RLS are set up exactly as intended.
