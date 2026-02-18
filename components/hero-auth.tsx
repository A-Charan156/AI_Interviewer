'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spotlight } from '@/components/ui/spotlight';
import { SplineScene } from '@/components/ui/spline-scene';
import { useRouter } from 'next/navigation';
import { Loader2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function HeroAuth() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [view, setView] = React.useState<'initial' | 'email'>('initial');
    const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            const { supabase } = await import('@/lib/supabase');
            const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${origin}/dashboard` },
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Error logging in with Google:', err);
            setError(err.message || 'Google login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const { supabase } = await import('@/lib/supabase');
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: `${window.location.origin}/dashboard` }
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="rounded-none border-none shadow-none w-full h-full bg-black/[0.96] relative overflow-hidden">
            <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />

            <div className="flex h-full flex-col lg:flex-row w-full max-w-7xl mx-auto z-10 relative">
                {/* Left Side (Content) */}
                <div className="flex-1 flex flex-col justify-center px-8 lg:px-12 py-12 lg:py-0">
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                        Master Your Interview
                    </h1>
                    <p className="mt-4 text-neutral-300 text-lg md:text-xl max-w-lg leading-relaxed">
                        Real-time voice coaching powered by AI. Get instant feedback on your communication and technical skills.
                    </p>

                    <div className="mt-8 w-full max-w-sm">
                        {view === 'initial' ? (
                            <div className="space-y-4">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 relative bg-white/5 border-neutral-800 hover:bg-white/10 text-white"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 488 512">
                                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                                        </svg>
                                    )}
                                    Continue with Google
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-800" /></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-neutral-500 font-bold">Or</span></div>
                                </div>

                                <Button
                                    variant="secondary"
                                    className="w-full h-12 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white"
                                    onClick={() => setView('email')}
                                    disabled={isLoading}
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    Sign In with Email
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleEmailAuth} className="space-y-4 bg-neutral-900/40 p-6 rounded-2xl border border-neutral-800 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">{mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                                    <Button variant="ghost" size="sm" type="button" onClick={() => setView('initial')} className="text-neutral-400">Back</Button>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-black border-neutral-800 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-black border-neutral-800 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                                <Button className="w-full h-11 bg-white text-black hover:bg-neutral-200" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
                                </Button>

                                <p className="text-center text-sm text-neutral-500 mt-4">
                                    {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                                    {' '}
                                    <button
                                        type="button"
                                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                        className="text-blue-400 hover:underline font-medium"
                                    >
                                        {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right Side (3D) */}
                <div className="flex-1 h-[400px] lg:h-auto relative w-full">
                    <SplineScene
                        scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                        className="w-full h-full"
                    />
                </div>
            </div>
        </Card>
    );
}
