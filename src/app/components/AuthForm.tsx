"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FormInput } from "./FormInput";
import { OAuthButton } from "./OAuthButton";

interface AuthFormProps {
    mode: "login" | "signup";
    setMode: (mode: "login" | "signup") => void;
    onSubmit: (e: React.FormEvent) => void;
    name: string;
    setName: (name: string) => void;
    username: string;
    setUserName: (username: string) => void;
    email: string;
    setEmail: (email: string) => void;
    password: string;
    setPassword: (password: string) => void;
    loading: boolean;
    error: string;
    success: string;
    loginWithGoogle: () => void;
    loginWithGitHub: () => void;
}

// Enhanced FormInput component with password toggle
interface EnhancedFormInputProps {
    label: string;
    type: string;
    id: string;
    placeholder: string;
    required?: boolean;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    autoComplete?: string;
    showPasswordToggle?: boolean;
}

const EnhancedFormInput: React.FC<EnhancedFormInputProps> = ({
    label,
    type,
    id,
    placeholder,
    required,
    value,
    onChange,
    autoComplete,
    showPasswordToggle = false
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const togglePassword = () => {
        setShowPassword(!showPassword);
    };

    const eyeVariants: Variants = {
        hidden: { scale: 0, rotate: -180, opacity: 0 },
        visible: { 
            scale: 1, 
            rotate: 0, 
            opacity: 1,
            transition: { 
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        },
        hover: {
            scale: 1.1,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.95,
            rotate: 15,
            transition: { duration: 0.1 }
        }
    };

    const eyeSlashVariants: Variants = {
        draw: {
            pathLength: 1,
            opacity: 1,
            transition: {
                pathLength: { type: "spring", duration: 0.6, bounce: 0 },
                opacity: { duration: 0.2 }
            }
        },
        hide: {
            pathLength: 0,
            opacity: 0,
            transition: {
                pathLength: { duration: 0.3 },
                opacity: { duration: 0.1 }
            }
        }
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-semibold text-gray-300">
                {label}
            </label>
            <div className="relative">
                <input
                    type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
                    id={id}
                    placeholder={placeholder}
                    required={required}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className="w-full px-4 py-3 pr-12 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                />
                {showPasswordToggle && (
                    <motion.button
                        type="button"
                        onClick={togglePassword}
						aria-label={showPassword ? "Hide password" : "Show password"}
						aria-pressed={showPassword}
                        onHoverStart={() => setIsHovered(true)}
                        onHoverEnd={() => setIsHovered(false)}
                        variants={eyeVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap="tap"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 focus:outline-none focus:text-purple-400 transition-colors duration-200"
                    >
                        <motion.div
                            animate={{
                                rotate: showPassword ? 0 : 0,
                                scale: isHovered ? 1.1 : 1
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {showPassword ? (
                                    // Eye open
                                    <motion.g
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <motion.circle
                                            cx="12"
                                            cy="12"
                                            r="3"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ 
                                                delay: 0.1,
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 20
                                            }}
                                        />
                                    </motion.g>
                                ) : (
                                    // Eye closed with slash
                                    <motion.g>
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <motion.path
                                            d="M1 1l22 22"
                                            variants={eyeSlashVariants}
                                            initial="hide"
                                            animate="draw"
                                            strokeDasharray="100"
                                            strokeDashoffset="100"
                                        />
                                    </motion.g>
                                )}
                            </svg>
                        </motion.div>
                    </motion.button>
                )}
            </div>
        </div>
    );
};

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
    username,
    setUserName,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    success,
    loginWithGoogle,
    loginWithGitHub
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
                                <EnhancedFormInput
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
                            <EnhancedFormInput
                                label="Username"
                                type="text"
                                id="username"
                                placeholder={mode === 'signup' ? "Username" : "Username"}
                                required
                                value={username}
                                onChange={e => setUserName(e.target.value)}
                                autoComplete="username"
                            />
                        </motion.div>
                        {mode === 'signup' && (
                            <motion.div variants={itemVariants}>
                                <EnhancedFormInput
                                    label="Email"
                                    type="email"
                                    id="email"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </motion.div>
                        )}
                        <motion.div variants={itemVariants}>
                            <EnhancedFormInput
                                label="Password"
                                type="password"
                                id="password"
                                placeholder="Password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                showPasswordToggle={true}
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
                <motion.div variants={itemVariants} className="space-y-3">
                    <OAuthButton provider="Google" onClick={loginWithGoogle} />
                    <OAuthButton provider="GitHub" onClick={loginWithGitHub} />
                </motion.div>
                <motion.p variants={itemVariants} className="text-xs text-gray-400 text-center mt-4">
                    By proceeding, you agree to our{' '}
                    <a href="#" className="font-semibold underline hover:text-purple-300 transition-colors">nefarious data stealing policies</a>.
                </motion.p>
            </motion.section>
        </div>
    );
};
