import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Link, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
import { authAPI } from '@/services/api'
import { Huni } from "@/components/ui/huni"
import { AuthBackdrop } from "@/components/decor"

export function ForgotPassword() {
    document.title = "Forgot Password | HuniSpace"

    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)
        try {
            await authAPI.passwordReset(email)
            setSuccess(true)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const data = err.response?.data
            if (typeof data?.email === 'string') {
                setError(data.email)
            } else if (Array.isArray(data?.email)) {
                setError(data.email.join(' '))
            } else {
                setError('Failed to send reset email. Please try again.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="absolute inset-0 -z-10 h-full w-full bg-background flex items-center justify-center overflow-hidden">
            <AuthBackdrop />
            <div className="relative z-10 w-full max-w-md px-4 flex items-center justify-center flex-col gap-6">
                <div className="flex-row flex items-center gap-2">
                    <Huni className="h-12 w-auto" />
                    <h1 className="text-[clamp(1.5rem,5vw,3rem)] tracking-wider font-bold leading-none text-foreground primary-font">
                        huni
                    </h1>
                </div>
                <Card className="w-full shadow-xl shadow-black/5">
                    <CardHeader>
                        <span className="font-cousine text-[0.65rem] uppercase tracking-[0.3em] text-primary">
                            Reset access — Nº 03
                        </span>
                        <CardTitle className="text-3xl text-left text-foreground primary-font">
                            Forgot Password
                        </CardTitle>
                        <Link to="/login">
                            <span className="text-foreground text-sm underline underline-offset-4 hover:text-primary transition-colors cursor-pointer">
                                Back to Login
                            </span>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {success ? (
                            <div className="flex flex-col gap-4">
                                <p className="text-sm text-muted-foreground">
                                    Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                                </p>
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="cursor-pointer w-full"
                                >
                                    Return to Login
                                </Button>
                            </div>
                        ) : (
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
                                    {error && (
                                        <p className="text-destructive text-sm">{error}</p>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="cursor-pointer w-full mt-1"
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
                <p className="text-center font-cousine text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground/70">
                    HuniSpace — a cozy corner of the internet
                </p>
            </div>
        </div>
    )
}

export default ForgotPassword
