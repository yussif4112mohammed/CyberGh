import { Pool, PoolClient } from 'pg';

// Singleton pool — reused across serverless function invocations
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  // Aiven provides a full connection string — use it directly if available
  // Otherwise fall back to individual env vars
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Required for Aiven
    max: 3, // Low for serverless — avoids Aiven free-tier connection limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  // PostgreSQL uses $1, $2 placeholders — convert from ? if needed
  const pgSql = convertPlaceholders(sql);
  const result = await getPool().query(pgSql, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params?: any[]): Promise<{ rowCount: number }> {
  const pgSql = convertPlaceholders(sql);
  const result = await getPool().query(pgSql, params);
  return { rowCount: result.rowCount ?? 0 };
}

// Convert MySQL ? placeholders to PostgreSQL $1, $2, $3...
function convertPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

