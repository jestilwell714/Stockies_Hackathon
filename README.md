# Stockies Hackathon

Existing Expo frontend, Java Spring backend, Python classifier, and Supabase Postgres integration.

## Demo Loop

1. Start the Python classifier, Java backend, and Expo frontend.
2. Run `./scripts/run-demo-week.sh` from the repo root.
3. The script sends transactions to the Java backend over about two minutes.
4. Java sends each transaction to the Python classifier.
5. Java saves the categorized transaction to Postgres/H2.
6. The frontend polls the Java backend and refreshes the live feed, weekly graph, and leaderboard.
7. Near the end, the script rolls into a new week and sends a few more transactions.

If the Java backend is down, the app shows **Server Unavaliable** and does not fall back to mock data.

## Python Classifier

The classifier is a FastAPI app defined in `social-finance-api/python-classifier/main_classifier.py`. It loads `.env` files automatically and starts Uvicorn itself when you run the module directly.

```bash
cd social-finance-api/python-classifier
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main_classifier.py
```

If you prefer to run Uvicorn explicitly, use:

```bash
uvicorn main_classifier:app --host 0.0.0.0 --port 8000 --reload
```

Default classifier URL: `http://localhost:8000/classify-one`.

## Java Backend

Use the Maven wrapper so the command works even when Maven is not installed globally.

Local H2 demo:

```bash
cd social-finance-api/java-backend
./mvnw spring-boot:run
```

The backend listens on `http://localhost:8080`. Demo seed data is inserted only when the users table is empty. The seeder creates 8 users, one friend group, banned categories, 8 weekly challenges, and 2 months of mock transactions.

Useful endpoints:

```text
GET  /api/dashboard?userId=00000000-0000-0000-0000-000000000001
GET  /api/groups/00000000-0000-0000-0000-000000000100/leaderboard?challengeId=00000000-0000-0000-0000-000000000200
GET  /api/groups/00000000-0000-0000-0000-000000000100/points-leaderboard
GET  /api/groups/00000000-0000-0000-0000-000000000100/activity-feed?limit=8
GET  /api/users/00000000-0000-0000-0000-000000000001/transactions
POST /api/transactions/simulate
POST /api/demo/reset-live-week
POST /api/demo/roll-week
```

Simulate payload:

```json
{
  "userId": "00000000-0000-0000-0000-000000000001",
  "amount": 12.8,
  "description": "Uber Eats Ponsonby dinner",
  "timestamp": "2026-05-02T12:00:00"
}
```

## Supabase Postgres

Set these before starting the Java backend:

```bash
export SPRING_DATASOURCE_URL='jdbc:postgresql://aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require'
export SPRING_DATASOURCE_USERNAME='postgres.your-project-ref'
export SPRING_DATASOURCE_DRIVER='org.postgresql.Driver'
export SPRING_JPA_DATABASE_PLATFORM='org.hibernate.dialect.PostgreSQLDialect'
export SPRING_JPA_HIBERNATE_DDL_AUTO='update'
export CLASSIFIER_URL='http://localhost:8000/classify-one'
export APP_SEED_DEMO_DATA='true'
```

Set `APP_SEED_DEMO_DATA=false` if your Supabase database already has users, groups, and a weekly challenge.

Equivalent placeholders live in:

```text
social-finance-api/java-backend/src/main/resources/application-example.properties
```

### Dev Schema Reset

The Java backend uses UUID primary keys and UUID foreign keys for users, friend groups, weekly challenges, and transactions. If your Supabase project already has old `bigint` Java tables, Hibernate `update` cannot safely convert those column types in place.

For a dev database, drop the affected Java demo tables and let Spring recreate them:

```sql
drop table if exists transactions cascade;
drop table if exists weekly_challenges cascade;
drop table if exists friend_group_banned_categories cascade;
drop table if exists users cascade;
drop table if exists friend_groups cascade;
```

Then restart the Java backend with `APP_SEED_DEMO_DATA=true`.

## Two-Minute Demo Script

Start all three services first:

```bash
# terminal 1
cd social-finance-api/python-classifier
source .venv/bin/activate
python main_classifier.py

# terminal 2
cd social-finance-api/java-backend

set -a
source .env
set +a

echo $SPRING_DATASOURCE_URL

./mvnw spring-boot:run

# terminal 3
cd front-end
npm start
```

Then run the scripted transaction stream from the repo root:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/run-demo-week.sh
```

The script resets the live week, sends demo transactions every few seconds, rolls the backend into a new week, then sends a final burst of transactions. Keep the Expo app open on the home or leaderboard tab to see the live feed and leaderboard change while it runs.

## Expo Frontend

```bash
cd front-end
cp .env.example .env
npm install
npm start
```

For a physical phone, replace `EXPO_PUBLIC_SKIMP_API_URL=http://localhost:8080` with the LAN URL of the computer running the Java backend, for example `http://192.168.1.20:8080`.

Frontend env:

```bash
EXPO_PUBLIC_SKIMP_API_URL=http://localhost:8080
EXPO_PUBLIC_SKIMP_CURRENT_USER_ID=00000000-0000-0000-0000-000000000001
EXPO_PUBLIC_SKIMP_CURRENT_GROUP_ID=00000000-0000-0000-0000-000000000100
EXPO_PUBLIC_SKIMP_CURRENT_CHALLENGE_ID=00000000-0000-0000-0000-000000000200
```

## Vercel Deployment

Deploy the frontend from the `front-end` directory.

Vercel project settings:

```text
Root Directory: front-end
Build Command: npm run build
Output Directory: dist
```

Set these environment variables in Vercel before deploying:

```bash
EXPO_PUBLIC_SKIMP_API_URL=https://your-backend-tunnel.example.com
EXPO_PUBLIC_SKIMP_CURRENT_USER_ID=00000000-0000-0000-0000-000000000001
EXPO_PUBLIC_SKIMP_CURRENT_GROUP_ID=00000000-0000-0000-0000-000000000100
EXPO_PUBLIC_SKIMP_CURRENT_CHALLENGE_ID=00000000-0000-0000-0000-000000000200
```

If you change the backend tunnel URL, update `EXPO_PUBLIC_SKIMP_API_URL` and redeploy the frontend so the web build picks up the new value.

## Cloudflare Tunnel

Use Cloudflare Tunnel to expose the Java backend to the deployed Vercel app.

Quick tunnel for local development:

```bash
cloudflared tunnel --url http://localhost:8080
```

Take the public HTTPS URL Cloudflare prints and set it as `EXPO_PUBLIC_SKIMP_API_URL` in Vercel.

For a stable production setup, create a named tunnel and map it to a fixed hostname in your Cloudflare account, then use that hostname as the frontend API URL.

## Verification

```bash
cd front-end
npm run typecheck

cd ../social-finance-api/java-backend
./mvnw test
```
