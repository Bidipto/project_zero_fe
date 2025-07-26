"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import EnvironmentVariables from "@/config/config";
import { getStoredOAuthState, clearOAuthState, validateOAuthState } from "@/utils/githubAuth";

export default function GitHubCallback() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [message, setMessage] = useState('Processing GitHub authentication...');

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const code = searchParams.get('code');
				const state = searchParams.get('state');
				const error = searchParams.get('error');

				if (error) {
					setStatus('error');
					setMessage(`GitHub OAuth error: ${error}`);
					return;
				}

				if (!code || !state) {
					setStatus('error');
					setMessage('Missing required OAuth parameters');
					return;
				}

				const storedState = getStoredOAuthState();
				if (!validateOAuthState(state, storedState)) {
					setStatus('error');
					setMessage('Invalid state parameter. Possible CSRF attack.');
					return;
				}
				clearOAuthState();
				const response = await fetch(`${EnvironmentVariables.BACKEND_URL}/login/github/callback`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						code,
						state,
						redirect_uri: EnvironmentVariables.GITHUB_REDIRECT_URI || `${EnvironmentVariables.BACKEND_URL}/login/github/callback`
					}),
				});
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to authenticate with GitHub');
				}
				if (data.token) {
					localStorage.setItem('jwt', data.token);
				}
				if (data.user) {
					localStorage.setItem('user', JSON.stringify(data.user));
				}

				setStatus('success');
				setMessage('Successfully authenticated with GitHub! Redirecting...');
				setTimeout(() => {
					router.push('/chat');
				}, 1500);

			} catch (error: any) {
				console.error('GitHub OAuth callback error:', error);
				setStatus('error');
				setMessage(error.message || 'An unexpected error occurred during authentication');
			}
		};

		handleCallback();
	}, [searchParams, router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-900">
			<motion.div
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				className="max-w-md w-full mx-4 p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700"
			>
				<div className="text-center">
					{status === 'loading' && (
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
							className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
						/>
					)}
					
					{status === 'success' && (
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center"
						>
							<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</motion.div>
					)}

					<h2 className="text-2xl font-bold text-white mb-4">
						{status === 'loading' && 'Authenticating...'}
						{status === 'success' && 'Success!'}
						{status === 'error' && 'Authentication Failed'}
					</h2>
					
					<p className="text-gray-300 mb-6">{message}</p>
					
					{status === 'error' && (
						<motion.button
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							onClick={() => router.push('/')}
							className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
						>
							Back to Login
						</motion.button>
					)}
				</div>
			</motion.div>
		</div>
	);
} 