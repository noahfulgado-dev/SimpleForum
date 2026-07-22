import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "../components/ui/button";
import { Link } from 'react-router-dom';
import { Input } from "@/components/ui/input";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export function Login() {
    document.title ="Login | SimpleForum";

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await authAPI.login({ email, password });
            const { access, refresh } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            navigate('/');
        } catch (err: any) {
            const data = err.response?.data;
            if (data?.non_field_errors) {
                setError(data.non_field_errors.join(' '));
            } else if (typeof data === 'string') {
                setError(data);
            } else {
                setError('Login failed. Please try again.');
            }
        }
    };

    return (
        <>
            <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
                <div className="w-dvw h-1/2 flex items-center justify-center flex-col gap-5">
                    <h1 className="text-[clamp(0.5rem,5vw,3rem)] tracking-wider font-semibold leading-none text-[#2d2a32] primary-font neutral-color">
                        SimpleForum
                    </h1>
                    <Card className="w-125 h-[400px]! rounded-none drop-shadow-none primary-font">
                        <CardHeader>
                            <CardTitle className="text-4xl text-left text-box-trim neutral-color">Login</CardTitle>
                            <Link to="/signup"><CardAction className="under neutral-color">Sign Up</CardAction></Link>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="flex flex-col gap-6">
                                    <div className="">
                                        <Input
                                            className="rounded-none"
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
                                            className="rounded-none"
                                            id="password"
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <a className="text-[0.7em] cursor-pointer hover:text-[#9ec1a3] transition-all duration-500 ease-in-out underline">Forgot your password?</a>
                                    </div>
                                    {error && (
                                        <p className="text-red-500 text-sm">{error}</p>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" onClick={handleSubmit} className="cursor-pointer neutral-bg-color hover:bg-[#9ec1a3]! transition-all duration-300 ease-in-out">Login</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    )
}
