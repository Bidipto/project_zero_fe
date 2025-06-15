import { NextResponse } from "next/server";
import { serverUsers } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
export async function GET() {
    try {
        const users = await serverUsers.list();
        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function POST(request: Request) {
    try {
        const { userId, email, password, name } = await request.json();
        const newUser = await serverUsers.create(userId, email, password, name);
        return NextResponse.json(newUser);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 