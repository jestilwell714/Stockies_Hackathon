# Stockies Hackathon

Existing Expo frontend, Java Spring backend, Python classifier, and Supabase Postgres integration.

## Demo Loop

1. Start the Python classifier, Java backend, and Expo frontend.
2. Each participant enters their name on the Expo join screen.
3. The backend creates a demo user and assigns them to a demo team with up to 8 people.
4. Run `./scripts/run-demo-week.sh` from the repo root.
5. The script sends transactions to the Java backend over about two minutes.
6. Java sends each transaction to the Python classifier.
7. Java saves the categorized transaction to Supabase Postgres.
8. The frontend polls the Java backend and refreshes the live feed, weekly graph, and leaderboard.
9. At the end, the script rolls every demo team into a new week so the completed week appears in Weekly Memories.

If the Java backend is down, the app shows **Server Unavaliable** and does not fall back to mock data.

## Python Classifier

```bash
cd social-finance-api/python-classifier
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main_classifier.py
```

Default classifier URL: `http://localhost:8000/classify-one`.

## Java Backend

Supabase demo:

```bash
cp social-finance-api/java-backend/.env.example social-finance-api/java-backend/.env
open social-finance-api/java-backend/.env
```

Set `SPRING_DATASOURCE_PASSWORD` to your real Supabase database password, then start the backend:

```bash
./scripts/run-backend.sh
```

The backend listens on `http://localhost:8080`. Demo seed data is inserted only when the users table is empty. The seeder creates 8 users, one friend group, banned categories, 8 weekly challenges, and 2 months of mock transactions.

The backend intentionally has no runtime H2 fallback. If `.env` is missing or Supabase is unreachable, Spring Boot fails to start and the frontend shows **Server Unavaliable** instead of writing to a local in-memory database.

Useful endpoints:

```text
GET  /api/dashboard?userId=00000000-0000-0000-0000-000000000001
GET  /api/groups/00000000-0000-0000-0000-000000000100/leaderboard?challengeId=00000000-0000-0000-0000-000000000200
GET  /api/groups/00000000-0000-0000-0000-000000000100/points-leaderboard
GET  /api/groups/00000000-0000-0000-0000-000000000100/activity-feed?limit=8
GET  /api/users/00000000-0000-0000-0000-000000000001/transactions
POST /api/transactions/simulate
POST /api/demo/join
GET  /api/demo/participants
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
export SPRING_DATASOURCE_PASSWORD='your-supabase-database-password'
export SPRING_DATASOURCE_DRIVER='org.postgresql.Driver'
export SPRING_JPA_DATABASE_PLATFORM='org.hibernate.dialect.PostgreSQLDialect'
export SPRING_JPA_HIBERNATE_DDL_AUTO='update'
export CLASSIFIER_URL='http://localhost:8000/classify-one'
export APP_SEED_DEMO_DATA='true'
```

Set `APP_SEED_DEMO_DATA=false` if your Supabase database already has users, groups, and a weekly challenge.

You can also put these values in `social-finance-api/java-backend/.env` and start the backend with:

```bash
./scripts/run-backend.sh
```

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
./mvnw spring-boot:run

# terminal 3
cd front-end
npm start
```

Then run the scripted transaction stream from the repo root:

```bash
API_BASE_URL=http://localhost:8080 ./scripts/run-demo-week.sh
```

Before running the script, have participants open the Expo app and enter their name. The backend assigns new participants into `Demo Team 1`, `Demo Team 2`, and so on, with up to 8 people per team.

The script discovers all joined users through `GET /api/demo/participants`, resets every live demo team to Sunday, sends dated transactions for Sunday through Saturday over about two minutes, then rolls every team into a new week. Keep the Expo app open on the home or leaderboard tab while it runs, then open **Profile -> Weekly Memories** to show the completed recap.

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
```

The app stores the joined demo user/group on the device with AsyncStorage. To rejoin as a different person during testing, clear Expo app storage or reinstall the app.

## Verification

```bash
cd front-end
npm run typecheck

cd ../social-finance-api/java-backend
./mvnw test
```
