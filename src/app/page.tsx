"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/appwrite";
import { Account, ID, OAuthProvider, Models } from "appwrite";
import { AuthForm } from "./components/AuthForm";
import { AnimatedBackground } from "./components/AnimatedBackground";

const account = new Account(client);

export default function HomePage() {
	const router = useRouter();
	const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);
	const [checkingSession, setCheckingSession] = useState(true);

	useEffect(() => {
		const checkSession = async () => {
			try {
				await account.get();
				router.push('/chat');
			} catch (_error) {
				setLoggedInUser(null);
			} finally {
				setCheckingSession(false);
			}
		};
		checkSession();
	}, [router]);

	const handleSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);
		try {
			if (mode === 'login') {
				await account.createEmailPasswordSession(email, password);
				router.push('/chat');
			} else {
				await account.create(ID.unique(), email, password, name);
				setSuccess('Account created! Please check your email to verify.');
			}
		} catch (err: any) {
			setError(err.message || 'Something went wrong.');
		} finally {
			setLoading(false);
		}
	}, [mode, email, password, name, router]);

	const loginWithGoogle = useCallback(() => {
		try {
			account.createOAuth2Session(OAuthProvider.Google, `${window.location.origin}/`, `${window.location.origin}/`);
		} catch (err: any) {
			setError(err.message || 'Something went wrong during Google login.');
		}
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
			