# Setting PostgreSQL Password on Windows

## Option 1: Using pgAdmin (GUI)
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Login/Group Roles" → "postgres"
4. Go to "Definition" tab
5. Set password to: `postgres` (or any password you prefer)
6. Save

## Option 2: Using Command Line (if psql is in PATH)
```bash
psql -U postgres
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

## Option 3: Edit pg_hba.conf (Trust Method - Development Only)
1. Find `pg_hba.conf` file (usually in PostgreSQL data directory)
2. Find line: `host all all 127.0.0.1/32 md5`
3. Change to: `host all all 127.0.0.1/32 trust`
4. Restart PostgreSQL service
5. Now you can connect without password
6. Then set password: `ALTER USER postgres WITH PASSWORD 'postgres';`
7. Change pg_hba.conf back to `md5`
8. Restart PostgreSQL

## Option 4: Create New User (Recommended for Development)
```sql
CREATE USER cafeteria_user WITH PASSWORD 'dev_password';
ALTER USER cafeteria_user CREATEDB;
```

Then update .env:
```
DATABASE_URL=postgresql://cafeteria_user:dev_password@localhost:5432/cafeteria_burger?schema=public
```



