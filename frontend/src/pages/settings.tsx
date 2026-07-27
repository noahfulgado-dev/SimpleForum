import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarLeft } from "@/components/ui/sidebar_left"
import { Navbar } from "@/components/ui/navbar"
import { useTheme } from "@/context/ThemeContext"

export function Settings() {
  document.title = "Settings | SimpleForum"
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="h-screen flex flex-col bg-background bg-[linear-gradient(to_right,var(--muted)_1px,transparent_1px),linear-gradient(to_bottom,var(--muted)_1px,transparent_1px)] bg-size-[40px_40px]">
      <div className="p-5 pb-0 shrink-0 relative z-50">
        <Navbar />
      </div>
      <SidebarLeft />
      <div className="flex-1 overflow-y-auto px-3 md:px-5 pb-5">
        <div className="flex gap-5 justify-center min-h-full">
          <div className="hidden xl:block w-[300px] shrink-0" />
          <div className="flex-1 max-w-[900px] min-w-0 mt-8">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="text-3xl text-foreground primary-font">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Theme</p>
                    <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="hidden xl:block w-[300px] shrink-0" />
        </div>
      </div>
    </div>
  )
}

export default Settings
