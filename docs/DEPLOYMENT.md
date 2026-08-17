# ResQMesh — Deployment Guide

Three parts, in this order: **Supabase** (database) → **AWS EC2 free tier** (backend) →
**Vercel** (frontend). Each step is free-tier only, no credit card charges if you stay
within the limits noted below.

---

## Part 1 — Supabase (Postgres database)

1. Go to **[supabase.com](https://supabase.com)** → sign up (free) → **New project**.
   - Pick a region close to you, set a strong database password, save it somewhere safe.
   - Wait ~2 minutes for provisioning.

2. Open **SQL Editor** (left sidebar) → **New query** → paste the entire contents of
   [`backend/supabase/schema.sql`](../backend/supabase/schema.sql) → **Run**.
   This creates all 10 tables, indexes, and RLS policies in one shot. Safe to re-run.

3. Get your connection string: **Project Settings → Database → Connection string**.
   - Use the **"Transaction pooler"** connection (port 6543) — it's the one designed for
     apps like this on the free tier (session pooler also works if you hit issues).
   - Copy the URI, e.g.:
     ```
     postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
     ```
   - **Change the prefix** from `postgresql://` to `postgresql+psycopg2://` (SQLAlchemy
     needs the driver name) and substitute your actual password:
     ```
     postgresql+psycopg2://postgres.xxxxxxxx:YOUR_ACTUAL_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
     ```
   - If your password contains special characters (`@`, `#`, `/`, etc.), URL-encode them
     (e.g. `@` → `%40`).

4. This is your `DATABASE_URL` — you'll paste it into the backend's `.env` in Part 2.

> **Note:** ResQMesh uses its own JWT auth system (email/password + Google), not
> Supabase Auth — Supabase here is purely the Postgres host. You don't need to touch
> the Auth section of the Supabase dashboard at all.

---

## Part 2 — AWS EC2 (backend, free tier)

AWS's free tier includes 750 hours/month of a `t2.micro` or `t3.micro` instance for the
first 12 months — enough to run this continuously at no cost.

### 2.1 — Launch the instance

1. Sign in to the **[AWS Console](https://console.aws.amazon.com)** → **EC2** → **Launch instance**.
2. **Name:** `resqmesh-backend`
3. **AMI:** Ubuntu Server 22.04 LTS (marked "Free tier eligible")
4. **Instance type:** `t2.micro` (or `t3.micro` — whichever shows "Free tier eligible" in your region)
5. **Key pair:** Create new → download the `.pem` file and keep it safe (you can't
   re-download it later).
6. **Network settings → Edit:**
   - Allow SSH (port 22) from **My IP** only
   - Allow HTTP (port 80) from **Anywhere**
   - Allow HTTPS (port 443) from **Anywhere**
7. **Launch instance.**

### 2.2 — Connect and install dependencies

```bash
chmod 400 resqmesh-backend.pem
ssh -i resqmesh-backend.pem ubuntu@<YOUR-EC2-PUBLIC-IP>
```

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip nginx git certbot python3-certbot-nginx
```

### 2.3 — Get the code onto the instance

```bash
git clone https://github.com/<your-username>/resqmesh.git
cd resqmesh/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2.4 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Set at minimum:
```bash
DATABASE_URL=postgresql+psycopg2://postgres.xxxx:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres
ENVIRONMENT=production
DEMO_MODE=true
JWT_SECRET_KEY=<generate with the command below>
CORS_ORIGINS=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

Generate a real secret (don't ship the default one):
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 2.5 — Test it runs

```bash
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
# in another terminal / from your laptop:
curl http://<YOUR-EC2-PUBLIC-IP>:8000/api/health
```
Press `Ctrl+C` once you see `{"status":"ok",...}`.

### 2.6 — Run it persistently with systemd

```bash
sudo cp deploy/resqmesh.service /etc/systemd/system/resqmesh.service
sudo systemctl daemon-reload
sudo systemctl enable --now resqmesh
sudo systemctl status resqmesh   # should show "active (running)"
```

It will now survive reboots and SSH disconnects, and auto-restart if it crashes.

### 2.7 — Free HTTPS (required — Vercel serves your frontend over HTTPS, and
browsers block a HTTPS page from calling a plain HTTP API)

If you don't own a domain, use **[sslip.io](https://sslip.io)** — a free service that
turns any IP into a real, publicly-resolvable hostname with no signup:
your hostname is simply `<your-ec2-public-ip-with-dashes>.sslip.io`, e.g.
`52-14-201-9.sslip.io` for IP `52.14.201.9`.

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/resqmesh
sudo nano /etc/nginx/sites-available/resqmesh
# replace YOUR_DOMAIN_OR_SSLIP_HOST with e.g. 52-14-201-9.sslip.io

sudo ln -s /etc/nginx/sites-available/resqmesh /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d 52-14-201-9.sslip.io
# follow the prompts (enter an email, agree to terms) — certbot edits the
# nginx config in place to add the TLS block and sets up auto-renewal
```

Your backend is now live at `https://52-14-201-9.sslip.io` (or your real domain, if
you have one — same steps, just use your domain instead of the sslip.io hostname).

Verify:
```bash
curl https://52-14-201-9.sslip.io/api/health
```

### 2.8 — Lock down the security group (optional but recommended)

Once Nginx/HTTPS is working, edit the EC2 security group to remove direct public
access to port 8000 (Nginx on 80/443 is the only public entry point now).

### 2.9 — Have Supabase provision the tables (if you skipped Part 1 step 2)

The backend also auto-creates any missing tables on startup as a safety net, so even
if you forget to run `schema.sql`, the app will still boot — but running it first is
recommended so indexes and RLS policies are set up correctly.

---

## Part 3 — Vercel (frontend)

1. Push your code to GitHub if you haven't (see the main README for `git push` steps).
2. Go to **[vercel.com](https://vercel.com)** → **Add New → Project** → import your
   `resqmesh` GitHub repo.
3. **Root Directory:** set to `frontend`
4. **Environment Variables** — add:
   ```
   VITE_API_BASE_URL=https://52-14-201-9.sslip.io
   VITE_GOOGLE_CLIENT_ID=<optional — see below>
   ```
5. **Deploy.**

Once deployed, copy your Vercel URL (e.g. `https://resqmesh.vercel.app`) and go back to
the EC2 instance to update `CORS_ORIGINS` and `FRONTEND_URL` in `.env` to match it exactly,
then:
```bash
sudo systemctl restart resqmesh
```

---

## Optional — Google Sign-In

1. **[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)**
   → **Create Credentials → OAuth client ID** → Application type: **Web application**.
2. Under **Authorized JavaScript origins**, add your Vercel URL (e.g.
   `https://resqmesh.vercel.app`) and `http://localhost:5173` for local dev.
3. Copy the **Client ID** (not the secret — the frontend only needs the public Client ID).
4. Set it in **both** places:
   - Backend `.env`: `GOOGLE_CLIENT_ID=...` → `sudo systemctl restart resqmesh`
   - Vercel env vars: `VITE_GOOGLE_CLIENT_ID=...` → redeploy
5. No billing account is required for basic Google Sign-In usage.

---

## Optional — Password reset emails via SMTP

Without SMTP configured, `forgot-password` returns the reset link directly in the API
response (clearly labeled "DEMO MODE") so the flow is fully testable without email setup.
To send real emails, use a free Gmail **App Password**:

1. Enable 2-Step Verification on the Google account you'll send from.
2. **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)** →
   generate an app password.
3. In the backend `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=<the 16-character app password>
   SMTP_FROM=your.email@gmail.com
   ```
4. `sudo systemctl restart resqmesh`

---

## Redeploying after code changes

```bash
# on the EC2 instance
cd resqmesh
git pull
cd backend
source .venv/bin/activate
pip install -r requirements.txt   # only if requirements.txt changed
sudo systemctl restart resqmesh
```

Vercel redeploys automatically on every push to your connected GitHub branch.

---

## Cost check — staying inside free tiers

| Service | Free tier limit | This app's usage |
|---|---|---|
| AWS EC2 t2/t3.micro | 750 hrs/month for 12 months | 1 instance running continuously ≈ 730 hrs/month |
| AWS data transfer out | 100 GB/month (first 12 months) | Hackathon-scale traffic is far below this |
| Supabase | 500 MB database, 2 free projects | This schema is a few MB even with heavy demo use |
| Vercel | 100 GB bandwidth/month (Hobby plan) | Fine for a demo/hackathon audience |
| Google Sign-In | No cost, no billing account needed | — |
| Gmail SMTP (optional) | Free, personal-use sending limits apply | Fine for occasional reset emails |

After 12 months, AWS EC2 free tier ends — at that point either stop the instance or
move to a paid tier; everything else here stays free indefinitely at hackathon scale.
