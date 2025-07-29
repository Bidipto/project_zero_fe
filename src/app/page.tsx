"use client";
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
  const [accesstoken, setAccesstoken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    setCheckingSession(false);
  }, []);

  // Handle OAuth parameters
  useEffect(() => {
    if (!isClient) return;

    const params = new URLSearchParams(window.location.search);
    const named = params.get('username');
    const accessToken = params.get('access_token');

    if (named) {
      setUserName(named);
      localStorage.setItem('username', named);
    }
    if (accessToken) {
      setAccesstoken(accessToken);
      localStorage.setItem('access_token', accessToken);
    }

    if (named || accessToken) {
      console.log("GitHub OAuth Params:", { named, accessToken });
      // Optionally redirect after OAuth:
      // router.push('/chat');
    }
  }, [isClient]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const res = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/user/login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'accept': 'application/json' 
          },
          body: JSON.stringify({
            username: userName,
            password: password
          })
        });
        
        const data = await res.json();
        
        if (res.status === 403) {
          throw new Error('Invalid username or password');
        }
        if (!res.ok) {
          throw new Error(data?.error ?? 'Login failed');
        }
        
        setLoggedInUser(data.user);
        if (data.token && isClient) {
          localStorage.setItem('jwt', data.token);
        }
      } else {
        const res = await fetch(`${EnvironmentVariables.BACKEND_URL}/v1/user/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'accept': 'application/json' 
          },
          body: JSON.stringify({
            email: email,
            username: userName,
            full_name: name,
            password: password
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data?.error ?? 'Signup failed');
        }
        
        setSuccess('We are thrilled to welcome you to Project Zero. Login to access your Project Zero chat!');
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [mode, email, password, name, userName, isClient]);

  // Placeholders for OAuth functionality
  const loginWithGoogle = useCallback(() => {
    // TODO: Implement Google OAuth
    console.log('Google OAuth not implemented yet');
  }, []);

  const loginWithGitHub = useCallback(() => {
    if (!isClient) return;
    
    // Store current values before redirect
    if (userName) {
      localStorage.setItem('username', userName);
    }
    if (accesstoken) {
      localStorage.setItem('access_token', accesstoken);
    }
    
    // Redirect to your backend's GitHub OAuth endpoint
    window.location.href = `${EnvironmentVariables.BACKEND_URL}/v1/user/login/github`;
  }, [userName, accesstoken, isClient]);

  // Show loading state during SSR/hydration
  if (!isClient || checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white text-xl animate-pulse">Loading Session...</p>
      </div>
    );
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