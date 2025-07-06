"use client"; // cuz client component
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "./components/AuthForm";
import { AnimatedBackground } from "./components/AnimatedBackground";
import EnvironmentVariables from "@/config/config";
export default function HomePage() {
	const router = useRouter();
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [name, setName] = useState('');
	const [userName, setUserName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);

	useEffect(() => {
		setCheckingSession(false);
	}, []);

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);
		try {
			if (mode === 'login') {
				const res = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/user/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
					body: JSON.stringify({
					"username": userName,
					"password": password
					})
				});
				const data = await res.json();
				if (res.status === 403) throw new Error('Invalid username or password');
				if (!res.ok) throw new Error(data?.error ?? 'Login failed');
				setLoggedInUser(data.user);
				if (data.token) {
					localStorage.setItem('jwt', data.token);
				}
				router.push('/chat');
			} else {
				const res = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/user/register`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
					body: JSON.stringify({
						"email": email,
						"username": userName,
						"full_name": name,
						"password": password
					})
				});
				
				const data = await res.json();
				if (!res.ok) throw new Error(data?.error ?? 'Signup failed');
				setSuccess('We are thriled to welcome you to Project Zero. Login to access your Project Zero chat!');
			}
		} catch (err: any) {
			setError(err.message ?? 'Something went wrong.');
		} finally {
			setLoading(false);
		}
	}, [mode, email, password, name, router]);

	const loginWithGoogle = useCallback(() => {
	}, []);

	if (checkingSession) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<p className="text-white text-xl animate-pulse">Loading Session...</p>
			</div>
		)
	}

	return (
		<main className="relative bg-gray-900 h-screen overflow-hidden">
			<AnimatedBackground />
			{!loggedInUser && (
				<AuthForm
					mode={mode}
					setMode={setMode}
					onSubmit={handleSubmit}
					name={name}
					setName={setName}
					username={userName}
					setUserName={setUserName}
					email={email}
					setEmail={setEmail}
					password={password}
					setPassword={setPassword}
					loading={loading}
					error={error}
					success={success}
					loginWithGoogle={loginWithGoogle}
				/>
			)}
		</main>
	);
}
