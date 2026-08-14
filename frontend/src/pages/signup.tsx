import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useGoogleLogin } from '@react-oauth/google'
import { Link, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Huni } from "@/components/ui/huni"
import { AuthBackdrop } from "@/components/decor"

export function Signup() {
    document.title = "Signup | HuniSpace"

    const navigate = useNavigate()
    const { googleLogin } = useAuth()
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setIsSubmitting(true)
        try {
            await authAPI.register({
                username,
                email,
                password1: password,
                password2: confirmPassword,
            })
            navigate('/login')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const data = err.response?.data
            if (typeof data === 'object' && data !== null) {
                const messages = Object.values(data).flat().join(' ')
                setError(messages || 'Registration failed. Please try again.')
            } else {
                setError('Registration failed. Please try again.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleGoogleLogin = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async (codeResponse) => {
            setError('')
            try {
                await googleLogin(codeResponse.code)
                navigate('/feed')
            } catch {
                setError('Google sign-in failed. Please try again.')
            }
        },
        onError: () => setError('Google sign-in failed'),
    })

    return (
        <div className="absolute inset-0 -z-10 h-full w-full bg-background flex items-center justify-center overflow-hidden">
            <AuthBackdrop />
            <div className="relative z-10 w-full max-w-md px-4 flex items-center justify-center flex-col gap-6">
                <div className="flex-row flex items-center gap-1">
                    <Huni></Huni>
                    <h1 className="text-[clamp(1.5rem,5vw,3rem)] tracking-wider font-bold leading-none text-foreground primary-font">
                        huni
                    </h1>
                </div>
                <Card className="w-full shadow-xl shadow-black/5">
                    <CardHeader>
                        <span className="font-cousine text-[0.65rem] uppercase tracking-[0.3em] text-primary">
                            Join the circle — Nº 02
                        </span>
                        <CardTitle className="text-3xl text-left text-foreground primary-font">
                            Sign Up
                        </CardTitle>
                        <Link to="/login">
                            <CardAction className="text-foreground text-sm underline underline-offset-4 hover:text-primary transition-colors">
                                Login
                            </CardAction>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-4">
                                <Input
                                    className="bg-background text-foreground"
                                    id="username"
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                <Input
                                    className="bg-background text-foreground"
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Input
                                    className="bg-background text-foreground"
                                    id="password"
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <Input
                                    className="bg-background text-foreground"
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                {error && (
                                    <p className="text-destructive text-sm">{error}</p>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="cursor-pointer w-full mt-1"
                                >
                                    {isSubmitting ? 'Creating account...' : 'Sign Up'}
                                </Button>
                            </div>
                        </form>

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-3 font-cousine text-[0.6rem] tracking-[0.25em] text-muted-foreground">
                                    or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={() => handleGoogleLogin()}
                            variant="outline"
                            className="w-full cursor-pointer items-center justify-center gap-2 [display:flex]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                            </svg>
                            Continue with Google
                        </Button>
                    </CardContent>
                    <CardFooter className="justify-center">
                        <p className="text-xs text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/login" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Login
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
                <p className="text-center font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground/70">
                    HuniSpace — a cozy corner of the internet
                </p>
            </div>
        </div>
    )
}
