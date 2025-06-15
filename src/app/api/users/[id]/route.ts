import { NextResponse } from "next/server";
import { serverUsers } from "@/lib/appwrite-server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const user = await serverUsers.get(params.id);
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { name } = await request.json();
        const updatedUser = await serverUsers.updateName(params.id, name);
        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
export async function DELETE(request: Request, { params }: { params: { id:string } }) {
    try {
        await serverUsers.delete(params.id);
        return new Response(null, { status: 204 }); // No Content
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 