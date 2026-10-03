# MySQL setup

The API now stores accounts, bookings, leave requests, and notifications in MySQL. Create the database before starting the API:

```sql
CREATE DATABASE repairhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy `backend/.env.example` to `backend/.env`, then set your local MySQL account values (do not commit `.env`):

```dotenv
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=repairhub
JWT_SECRET=your-existing-jwt-secret
```

Create the `repairhub` database and set `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` in `backend/.env`. A missing MySQL configuration now prevents startup with an explicit message instead of leaving the API unavailable. The API creates its tables on startup. Install the backend packages and start it from the backend directory:

```sh
npm install
npm run dev
```

## Preserve data from MongoDB

Back up both databases before migrating. The one-time importer transfers MongoDB `users`, `admins`, `bookings`, `leaverequests`, and `notifications` collections into empty MySQL tables. It preserves MongoDB ObjectId values, password hashes, and references, so existing IDs and JWTs continue to work when `JWT_SECRET` remains unchanged.

Temporarily keep `MONGODB_URI` in `backend/.env` and ensure the URI selects the source database (or set `MONGODB_DATABASE`). After configuring MySQL, run:

```sh
npm run migrate:mongo-to-mysql
```

The importer refuses to run if any destination table contains data, and its inserts run in a transaction. Verify the imported data before switching application traffic to the MySQL-backed API. Once verified, `MONGODB_URI` and `MONGODB_DATABASE` are no longer needed for normal API operation.

For an empty development database, `npm run seed` creates the sample accounts instead. Do not run the seed command after importing production data.
