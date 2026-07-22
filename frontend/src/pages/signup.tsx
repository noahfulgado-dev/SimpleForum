import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "../components/ui/button";
import { Link, useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";

import React, { useState } from 'react';
import { authAPI } from '../services/api';

export function Signup() {
    document.title ="Signup | SimpleForum";

    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            await authAPI.register({
                email,
                password1: password,
                password2: confirmPassword,
            });
            navigate('/login');
        } catch (err: any) {
            const data = err.response?.data;
            if (typeof data === 'object' && data !== null) {
                const messages = Object.values(data).flat().join(' ');
                setError(messages || 'Registration failed. Please try again.');
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        <>
            <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
                <div className="w-dvw h-1/2 flex items-center justify-center flex-col gap-5">
                    <h1 className="text-[clamp(0.5rem,5vw,3rem)] font-semibold leading-none neutral-color] primary-font tracking-wider">
                        SimpleForum
                    </h1>
                    <Card className="w-125 h-[400px]! rounded-none drop-shadow-none font-lexend">
                        <CardHeader>
                            <CardTitle className="text-4xl text-left text-box-trim primary-font neutral-color">Sign Up</CardTitle>
                            <Link to="/login"><CardAction className="under primary-font">Login</CardAction></Link>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                
                                <div className="flex flex-col gap-6">
                                    <div className="">
                                        <Input
                                            className="rounded-none primary-font"
                                            id="username"
                                            type="username"
                                            placeholder="Username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="">
                                        <Input
                                            className="rounded-none primary-font"
                                            id="email"
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            className="rounded-none primary-font"
                                            id="password"
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Input
                                            className="rounded-none primary-font"
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-red-500 text-sm">{error}</p>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" onClick={handleSubmit} className="cursor-pointer hover:bg-[#9ec1a3]! transition-all duration-300 ease-in-out neutral-bg-color primary-font">Sign Up</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    )
}
