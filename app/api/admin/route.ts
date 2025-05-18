// app/api/admin/route.ts
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT * FROM service_requests ORDER BY created_at DESC");
        client.release();

        return NextResponse.json({ requests: result.rows });
    } catch (err) {
        console.error("API error:", err);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
