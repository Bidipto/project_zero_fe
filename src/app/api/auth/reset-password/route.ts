import { NextResponse } from "next/server";
import { serverAccount } from "@/lib/appwrite-server";
import { ID } from "node-appwrite";

// need to update this func in order to handle token verification
export async function POST(request: Request) {
    try {
        const { email } = await request.json();
        const url = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

        await serverAccount.createRecovery(email, `${url}/reset-password`);

        return NextResponse.json({ message: "Password recovery email sent. Please check your inbox." });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 