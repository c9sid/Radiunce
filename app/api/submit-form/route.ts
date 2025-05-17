import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { name, phone, email, selections, notes, totalPrice } = data;

        const client = await pool.connect();

        const queryText = `
      INSERT INTO service_requests
      (name, phone, email, selections, notes, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

        // Store selections as JSON string
        const values = [name, phone, email || null, JSON.stringify(selections), notes || null, totalPrice];

        const result = await client.query(queryText, values);

        client.release();

        return NextResponse.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error("DB error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
