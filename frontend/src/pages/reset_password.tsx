import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate, useSearchParams } from 'react-router-dom'
import React, { useState } from 'react'
import { authAPI } from '@/services/api'

export function ResetPassword() {
    document.title = "Reset Password | SimpleForum"

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const uid = searchParams.get('uid')
    const key = searchParams.get('key')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!uid || !key) {
            setError('Invalid reset link. Please request a new one.')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setIsSubmitting(true)
        try {
            await authAPI.passwordResetConfirm({
                uid,
                token: key,
                new_password1: password,
                new_password2: confirmPassword,
            })
            navigate('/login')
        } catch (err: any) {
            const data = err.response?.data
            if (typeof data === 'object' && data !== null) {
                const messages = Object.values(data).flat().join(' ')
                setError(messages || 'Failed to reset password. The link may have expired.')
            } else {
                setError('Failed to reset password. The link may have expired.')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!uid || !key) {
        return (
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
                <div className="w-full max-w-md px-4">
                    <Card className="w-full shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-3xl text-left text-foreground primary-font">
                                Invalid Link
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Button
                                onClick={() => navigate('/forgot-password')}
                                className="cursor-pointer w-full"
                            >
                                Request New Reset Link
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
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
                            Reset Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-4">
                                <Input
                                    className="bg-background text-foreground"
                                    id="password"
                                    type="password"
                                    placeholder="New Password"
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
                                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ResetPassword
