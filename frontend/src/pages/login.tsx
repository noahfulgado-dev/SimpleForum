import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "../components/ui/button";
import { Link } from 'react-router-dom';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function Login() {
    return (
        <>
            <nav className="p-7">
                <h1 className="text-[clamp(0.5rem,5vw,3rem)] font-semibold leading-none text-[#2d2a32]">
                    SimpleForum
                </h1>
            </nav>
            <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
                <div className="w-dvw h-1/2 flex items-center justify-center flex-col gap-5">
                    <Card className="w-3xl">
                        <CardHeader>
                            <CardTitle>Login to your account</CardTitle>
                            <CardDescription>Enter your email below to login to your account</CardDescription>
                            <CardAction>Sign Up</CardAction>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="">
                                    <div className="">
                                        <Input id="email" type="email" placeholder="Email" required />
                                    </div>
                                    <div className="">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input id="password" type="password" placeholder="Password" required />
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <p>Card Footer</p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    )
}