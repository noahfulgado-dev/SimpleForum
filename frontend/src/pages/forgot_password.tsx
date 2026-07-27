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

export function ForgotPassword() {
    document.title = "Forgot Password | SimpleForum"

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
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
            <div className="w-full max-w-md px-4 flex items-center justify-center flex-col gap-6">
                <h1 className="text-[clamp(1.5rem,5vw,3rem)] tracking-wider font-bold leading-none text-foreground primary-font">
                    SimpleForum
                </h1>
                <Card className="w-full shadow-sm">
                    <CardHeader>
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
            </div>
        </div>
    )
}

export default ForgotPassword
