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
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
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

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        setError('')
        try {
            await googleLogin(credentialResponse.credential!)
            navigate('/feed')
        } catch {
            setError('Google sign-in failed. Please try again.')
        }
    }

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

                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in failed')}
                            theme="outline"
                            size="large"
                            text="continue_with"
                            shape="rectangular"
                            width="100%"
                        />
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
