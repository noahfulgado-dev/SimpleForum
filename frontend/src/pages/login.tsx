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
                
            </nav>
            <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
                <div className="w-dvw h-1/2 flex items-center justify-center flex-col gap-5">
                    <h1 className="text-[clamp(0.5rem,5vw,3rem)] font-semibold leading-none text-[#2d2a32] font-lexend">
                        SimpleForum
                    </h1>
                    <Card className="w-125 h-[400] rounded-none drop-shadow-none font-lexend">
                        <CardHeader>
                            <CardTitle className="text-4xl text-left text-box-trim">Login</CardTitle>
                            <Link to="/signup"><CardAction className="under">Sign Up</CardAction></Link>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="flex flex-col gap-6">
                                    <div className="">
                                        <Input className="rounded-none" id="email" type="email" placeholder="Email" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Input className="rounded-none" id="password" type="password" placeholder="Password" required />
                                        <a className="text-[0.7em] cursor-pointer hover:text-[#9ec1a3] transition-all duration-500 ease-in-out underline">Forgot your password?</a>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter>
                            <Button className="cursor-pointer hover:bg-[#9ec1a3] transition-all duration-500 ease-in-out">Login</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </>
    )
}