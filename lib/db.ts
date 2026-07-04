import mysql from 'mysql2/promise';

// Singleton pool — reused across serverless function invocations
let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
  if (pool) return pool;

  const sslConfig = process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;

  pool = mysql.createPool({
    host:     process.env.DB_HOST!,
    port:     Number(process.env.DB_PORT || 3306),
    user:     process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
    waitForConnections: true,
    connectionLimit: 3, // low for serverless — avoids Aiven free-tier connection limit
    queueLimit: 0,
    charset: 'utf8mb4',
    ...(sslConfig ? { ssl: sslConfig } : {}),
  });

  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().execute(sql, params);
  return result as mysql.ResultSetHeader;
}
