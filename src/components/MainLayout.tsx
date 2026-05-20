import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  MessageSquare,
  Zap,
  BookOpen,
  Settings,
  LogOut,
  User,
  Radio,
  History,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/translator', label: 'Translator', icon: Zap },
  { path: '/tools', label: 'Tools', icon: BarChart3 },
  { path: '/learn', label: 'Learn', icon: BookOpen },
  { path: '/history', label: 'History', icon: History },
  { path: '/reference', label: 'Reference', icon: Radio },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const mobileNav = [
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/translator', icon: Zap, label: 'Translate' },
  { path: '/tools', icon: BarChart3, label: 'Tools' },
];

const mobileMoreItems = [
  { path: '/learn', icon: BookOpen, label: 'Learn' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/reference', icon: Radio, label: 'Reference' },
  { path: '/profile', icon: User, label: 'Profile' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const moreActive = mobileMoreItems.some((i) => i.path === location.pathname);

  return (
    <div className="min-h-screen flex">
      {/* Gradient rail — desktop only */}
      <aside className="hidden md:flex w-20 lg:w-24 shrink-0 flex-col items-center gap-2 bg-gradient-rail py-6 text-white shadow-soft">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 backdrop-blur-md mb-4">
          <Radio className="h-6 w-6" />
        </div>
        <nav className="flex flex-col gap-1 flex-1 w-full px-3">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                title={label}
                className={`group flex flex-col items-center gap-1 rounded-2xl py-3 transition ${
                  active ? 'bg-white/25 backdrop-blur-md' : 'hover:bg-white/15'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium opacity-90">{label}</span>
              </button>
            );
          })}
        </nav>
        <button
          onClick={handleSignOut}
          title="Sign out"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 hover:bg-white/25 transition"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 bg-gradient-rail text-white shadow-soft">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/25">
            <Radio className="h-4 w-4" />
          </div>
          <span className="font-semibold tracking-wide">Telegraph</span>
        </div>
        <button onClick={handleSignOut} className="grid h-9 w-9 place-items-center rounded-xl bg-white/20">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="grid grid-cols-4">
          {mobileNav.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-gradient-sent text-white' : ''}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span>{label}</span>
              </button>
            );
          })}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  moreActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-xl ${moreActive ? 'bg-gradient-sent text-white' : ''}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </div>
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>More</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {mobileMoreItems.map(({ path, icon: Icon, label }) => {
                  const active = location.pathname === path;
                  return (
                    <button
                      key={path}
                      onClick={() => {
                        navigate(path);
                        setMoreOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition ${
                        active ? 'bg-gradient-sent text-white' : 'bg-secondary hover:bg-secondary/70'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
