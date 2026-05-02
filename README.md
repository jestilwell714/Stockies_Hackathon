# Stockies Hackathon

Existing Expo frontend, Java Spring backend, Python classifier, and Supabase Postgres integration.

## Demo Loop

1. Tap **Simulate Transaction** in the Expo app.
2. The frontend calls the Java backend.
3. Java sends the transaction to the Python classifier.
4. Java saves the categorized transaction to Postgres/H2.
5. The frontend polls the Java backend and refreshes the live feed, weekly graph, and leaderboard.

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

Local H2 demo:

```bash
cd social-finance-api/java-backend
./mvnw spring-boot:run
```

The backend listens on `http://localhost:8080`. Demo seed data is inserted only when the users table is empty.

Useful endpoints:

```text
GET  /api/dashboard?userId=00000000-0000-0000-0000-000000000001
GET  /api/groups/00000000-0000-0000-0000-000000000100/leaderboard?challengeId=00000000-0000-0000-0000-000000000200
GET  /api/groups/00000000-0000-0000-0000-000000000100/points-leaderboard
GET  /api/groups/00000000-0000-0000-0000-000000000100/activity-feed?limit=8
GET  /api/users/00000000-0000-0000-0000-000000000001/transactions
POST /api/transactions/simulate
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

## Verification

```bash
cd front-end
npm run typecheck

cd ../social-finance-api/java-backend
./mvnw test
```
