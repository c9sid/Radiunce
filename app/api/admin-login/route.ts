import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { password } = body;

    if (password === process.env.ADMIN_PASSWORD) {
        (await cookies()).set("admin_token", "secure-token", {
            httpOnly: true,
            maxAge: 60 * 60, // 1 hour
            path: "/",
        });

        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
