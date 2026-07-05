import { Button } from "../components/ui/button";
import { Link } from 'react-router-dom';

export function Landing() {
  document.title = "Welcome to SimpleForum";

  return (
    <>
      <div className="absolute inset-0 -z-10 h-full w-full bg-[#fafdf6] bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-size-[40px_40px] flex items-center justify-center">
        <div className="w-dvw h-1/2 flex items-center justify-center flex-col gap-5">
          <h1 className="text-[clamp(0.5rem,6vw,3rem)] leading-none text-[#2d2a32]">
            Welcome to <br></br><span className="text-[clamp(2.5rem,6vw,6rem)] font-semibold">SimpleForum</span>
          </h1>
          <Link to="/login">
            <Button className="cursor-pointer bg-[#2d2a32] text-[#fafdf6] hover:bg-[#fafdf6] hover:text-[#2d2a32] ease-in-out">Get Started</Button>
          </Link>
        </div>
      </div>
    </>
  );
}