import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const res = await fetch(`${BACKEND_URL}/users/${params.id}`);
        if (!res.ok) throw new Error('try again');
        const user = await res.json();
        return new Response(JSON.stringify(user), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/users/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update user');
        const updatedUser = await res.json();
        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
