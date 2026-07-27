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
import { Link, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Huni } from "@/components/ui/huni"

export function Login() {
    document.title = "Login | SimpleForum"

    const navigate = useNavigate()
    const { login, googleLogin } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            await login(email, password)
            navigate('/feed')
        } catch (err: any) {
            const data = err.response?.data
            if (data?.non_field_errors) {
                setError(data.non_field_errors.join(' '))
            } else if (typeof data === 'string') {
                setError(data)
            } else {
                setError('Login failed. Please try again.')
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
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
            <div className="w-full max-w-md px-4 flex items-center justify-center flex-col gap-6">
                <div className="flex-row flex items-center gap-1">
                    <Huni></Huni>
                <h1 className="text-[clamp(1.5rem,5vw,3rem)] tracking-wider font-bold leading-none text-foreground primary-font">
                    huni
                </h1>
                </div>
                
                <Card className="w-full shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-3xl text-left text-foreground primary-font">
                            Login
                        </CardTitle>
                        <Link to="/signup">
                            <CardAction className="text-foreground text-sm underline underline-offset-4 hover:text-primary transition-colors">
                                Sign Up
                            </CardAction>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-4">
                                <Input
                                    className="bg-background text-foreground"
                                    id="email"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <div className="flex flex-col gap-1.5">
                                    <Input
                                        className="bg-background text-foreground"
                                        id="password"
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <Link to="/forgot-password" className="text-xs cursor-pointer hover:text-primary transition-colors underline underline-offset-4 text-muted-foreground w-fit">
                                        Forgot your password?
                                    </Link>
                                </div>
                                {error && (
                                    <p className="text-destructive text-sm">{error}</p>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="cursor-pointer w-full mt-1"
                                >
                                    {isSubmitting ? 'Logging in...' : 'Login'}
                                </Button>
                            </div>
                        </form>

                        <div className="relative my-5">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-3 text-muted-foreground">
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
                            Don't have an account?{' '}
                            <Link to="/signup" className="underline underline-offset-4 hover:text-primary transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
