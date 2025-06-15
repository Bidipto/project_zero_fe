"use client";
import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FormInput } from "./FormInput";
import { OAuthButton } from "./OAuthButton";

interface AuthFormProps {
	mode: "login" | "signup";
	setMode: (mode: "login" | "signup") => void;
	onSubmit: (e: React.FormEvent) => void;
	name: string;
	setName: (name: string) => void;
	email: string;
	setEmail: (email: string) => void;
	password: string;
	setPassword: (password: string) => void;
	loading: boolean;
	error: string;
	success: string;
	loginWithGoogle: () => void;
}

const containerVariants: Variants = {
	initial: { opacity: 0, scale: 0.95 },
	animate: { 
		opacity: 1, 
		scale: 1,
		transition: { 
			duration: 0.4, 
			ease: "easeOut",
			staggerChildren: 0.1 
		} 
	},
};

const itemVariants: Variants = {
	initial: { opacity: 0, y: 20 },
	animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export const AuthForm: React.FC<AuthFormProps> = ({
	mode,
	setMode,
	onSubmit,
	name,
	setName,
	email,
	setEmail,
	password,
	setPassword,
	loading,
	error,
	success,
	loginWithGoogle
}) => {
	const formVariants: Variants = {
		hidden: { opacity: 0, x: -30 },
		visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.1, duration: 0.3 } },
		exit: { opacity: 0, x: 30, transition: { duration: 0.2 } },
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 font-sans relative z-10">
			<motion.section 
				variants={containerVariants}
				initial="initial"
				animate="animate"
				className="w-full max-w-md p-6 bg-gray-800/80 rounded-2xl shadow-2xl border border-gray-700 backdrop-blur-sm"
			>
				<motion.div variants={itemVariants} className="flex flex-col items-center mb-4 text-center">
					<div className="p-2 bg-gray-900 rounded-full mb-3 border border-purple-500 shadow-lg">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="9" cy="7" r="4" />
							<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
							<path d="M16 3.13a4 4 0 0 1 0 7.75" />
						</svg>
					</div>
					<h1 className="text-3xl font-extrabold text-white mb-1">Project Zero</h1>
					<p className="text-base text-purple-300 font-medium mb-2">Real-time connections, redefined.</p>
					<p className="text-gray-400 text-sm">{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
				</motion.div>
				<motion.div variants={itemVariants} className="flex justify-center gap-4 mb-4">
					<button
						className={`text-base pb-2 px-3 transition-all duration-300 border-b-2 ${mode === 'login' ? 'font-bold text-purple-400 border-purple-400' : 'font-semibold text-gray-500 border-transparent hover:text-purple-400 hover:border-purple-400/50'}`}
						onClick={() => setMode('login')}
						disabled={mode === 'login'}
					>
						Log In
					</button>
					<button
						className={`text-base pb-2 px-3 transition-all duration-300 border-b-2 ${mode === 'signup' ? 'font-bold text-purple-400 border-purple-400' : 'font-semibold text-gray-500 border-transparent hover:text-purple-400 hover:border-purple-400/50'}`}
						onClick={() => setMode('signup')}
						disabled={mode === 'signup'}
					>
						Sign Up
					</button>
				</motion.div>
				<AnimatePresence mode="wait">
					<motion.form
						key={mode}
						variants={formVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						className="space-y-4"
						onSubmit={onSubmit}
					>
						{mode === 'signup' && (
							<motion.div variants={itemVariants}>
								<FormInput
									label="Name"
									type="text"
									id="name"
									placeholder="Your Name"
									required
									value={name}
									onChange={e => setName(e.target.value)}
									autoComplete="name"
								/>
							</motion.div>
						)}
						<motion.div variants={itemVariants}>
							<FormInput
								label="Email"
								type="email"
								id="email"
								placeholder="Email Address"
								required
								value={email}
								onChange={e => setEmail(e.target.value)}
								autoComplete="email"
							/>
						</motion.div>
						<motion.div variants={itemVariants}>
							<FormInput
								label="Password"
								type="password"
								id="password"
								placeholder="Password (min 8 characters)"
								required
								value={password}
								onChange={e => setPassword(e.target.value)}
								autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
							/>
						</motion.div>
						{mode === 'login' && (
							<div className="text-right -mt-2">
								<button
									type="button"
									onClick={() => console.log("Forgot password clicked")}
									className="text-xs font-semibold text-gray-400 hover:text-purple-400 underline transition-colors"
								>
									Forgot Password?
								</button>
							</div>
						)}
						{error && <div className="text-red-500 text-sm text-center font-bold py-1">{error}</div>}
						{success && <div className="text-green-500 text-sm text-center font-bold py-1">{success}</div>}
						<motion.div variants={itemVariants}>
							<motion.button
								whileHover={{ scale: 1.03, y: -2, boxShadow: "0 10px 20px -5px rgba(168, 85, 247, 0.3)" }}
								whileTap={{ scale: 0.98, y: 0 }}
								type="submit"
								className="w-full py-2.5 px-6 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-base shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
								disabled={loading}
							>
								{loading ? (mode === 'login' ? 'Logging in...' : 'Signing up...') : (mode === 'login' ? 'Log In' : 'Sign Up')}
							</motion.button>
						</motion.div>
					</motion.form>
				</AnimatePresence>
				<motion.div variants={itemVariants} className="flex items-center my-4">
					<div className="flex-grow h-px bg-gray-600" />
					<span className="mx-4 text-gray-400 text-sm">OR</span>
					<div className="flex-grow h-px bg-gray-600" />
				</motion.div>
				<motion.div variants={itemVariants} className="flex flex-col gap-3">
					<OAuthButton provider="Google" onClick={loginWithGoogle} mode={mode} />
				</motion.div>
				<motion.p variants={itemVariants} className="text-xs text-gray-400 text-center mt-4">
					By proceeding, you agree to our{' '}
					<a href="#" className="font-semibold underline hover:text-purple-300 transition-colors">nefarious data stealing policies</a>.
				</motion.p>
			</motion.section>
		</div>
	);
}; 