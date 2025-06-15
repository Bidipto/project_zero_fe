import { NextResponse } from "next/server";
import { serverUsers } from "@/lib/appwrite-server";

export async function GET() {
    try {
        const users = await serverUsers.list();
        return NextResponse.json({ total: users.total });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 