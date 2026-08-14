import { Link } from 'react-router-dom'
import { Huni } from '../ui/huni'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card [content-visibility:auto] [contain-intrinsic-size:auto_12rem]">
      <p className="border-b border-border py-4 text-center font-cousine text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">
        A cozy corner of the internet
      </p>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Huni className="h-8 w-auto" />
          <span className="primary-font text-lg font-semibold text-foreground">HuniSpace</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HuniSpace</p>
        <nav className="flex items-center gap-5 text-xs text-muted-foreground">
          <Link to="/login" className="transition-colors hover:text-foreground">
            Log in
          </Link>
          <Link to="/signup" className="transition-colors hover:text-foreground">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
