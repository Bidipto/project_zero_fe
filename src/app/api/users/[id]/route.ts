import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const users: { [key: string]: { id: string; name: string; password: string } } = {};
import EnvironmentVariables from '@/config/config'

const JWT_SECRET = EnvironmentVariables.JWT_SECRET;

export async function POST(req: NextRequest, context: any) {
    const { id } = await context.params;
    const { password } = await req.json();
    const user = users[id];
    if (!user || user.password !== password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
    return NextResponse.json({ message: 'Login successful', user: { id: user.id, name: user.name }, token });
}

export async function PUT(req: NextRequest, context: any) {
    const { id } = await context.params;
    const { name, password } = await req.json();
    if (users[id]) {
        return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    users[id] = { id, name, password };
    return NextResponse.json({ message: 'Signup successful', user: { id, name } });
}
