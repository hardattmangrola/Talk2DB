import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            login(data);
            navigate('/chat');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Monochromatic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gray-500/5 rounded-full blur-[120px] animate-pulse"></div>

            <Card className="w-[380px] bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-10">
                <CardHeader className="text-white text-center">
                    <CardTitle className="text-3xl font-extrabold tracking-tighter uppercase mb-2">Talk2DB</CardTitle>
                    <CardDescription className="text-gray-400">Secure Access Portal</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 px-8">
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="username" className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="ADMIN / VIEWER"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="bg-white/5 border-white/5 text-white placeholder:text-gray-700 h-11 focus-visible:ring-white/20 rounded-none border-b-white/20 border-b-2"
                                />
                            </div>
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/5 border-white/5 text-white placeholder:text-gray-700 h-11 focus-visible:ring-white/20 rounded-none border-b-white/20 border-b-2"
                                />
                            </div>
                        </div>
                        {error && (
                            <div className="p-3 bg-white/5 border border-white/10 text-white text-[10px] uppercase tracking-wider text-center">
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 p-8 pt-4">
                        <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-widest h-12 rounded-none transition-all" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                        <div className="flex items-center gap-3 w-full opacity-20">
                            <div className="h-px bg-white flex-1"></div>
                            <span className="text-[9px] text-white uppercase tracking-tighter">System Access</span>
                            <div className="h-px bg-white flex-1"></div>
                        </div>
                        <Button
                            variant="ghost"
                            type="button"
                            className="w-full text-gray-500 hover:text-white hover:bg-white/5 text-[10px] uppercase tracking-widest rounded-none h-10"
                            onClick={() => { setUsername('viewer'); setPassword('viewer123') }}
                        >
                            Guest Mode
                        </Button>
                    </CardFooter>
                </form>
            </Card>
            <div className="absolute bottom-4 text-center w-full">
                <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em]">Quantum Data Interface v2.0</p>
            </div>
        </div>
    );
};

export default Login;
