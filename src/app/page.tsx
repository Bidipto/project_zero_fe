"use client"; // cuz client component
import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "./components/AuthForm";
import { AnimatedBackground } from "./components/AnimatedBackground";
import EnvironmentVariables from "@/config/config";
import { generateOAuthState, storeOAuthState, getGitHubAuthUrl } from "@/utils/githubAuth";

export default function HomePage() {
	const router = useRouter();
	const [loggedInUser, setLoggedInUser] = useState<any>(null);
	const [mode, setMode] = useState<'login' | 'signup'>('login');
	const [name, setName] = useState('');
	const [userName, setUserName] = useState('');
	const [accesstoken, setAccesstoken] = useState('');
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
		// TODO: Implement Google OAuth
		console.log('Google OAuth not implemented yet');
	}, []);

	const loginWithGitHub = useCallback( () => {
        window.location.href = `${EnvironmentVariables.BACKEND_URL}/v1/user/login/github`;
		if (userName) {	
			localStorage.setItem('username', userName);
		}
		if (accessToken) {
			localStorage.setItem('access_token', accessToken);
		}
		const storedUserName = localStorage.getItem('username');
		const storedAccessToken = localStorage.getItem('access_token');
	
		setUserName(storedUserName); 
		setAccesstoken(storedAccessToken); 
	
		console.log("Access Token:", storedAccessToken);
		console.log("Username:", storedUserName);
		router.push('/chat');
	}, [setUserName, setAccesstoken]); 

	const params = new URLSearchParams(window.location.search);
	const named = params.get('username');
	localStorage.setItem('username', named || ''); // Store username in localStorage
	const accessToken = params.get('access_token');
	localStorage.setItem('access_token', accessToken || ''); // Store access token in localStorage
	console.log("GitHub OAuth Params:", { named });

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
					loginWithGitHub={loginWithGitHub}
				/>
			)}
		</main>
	);
}
