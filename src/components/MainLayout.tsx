import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Zap,
  BookOpen,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Radio,
  History,
  BarChart3,
  Search,
} from 'lucide-react';
import { useState, useEffect } from 'react';

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
  { path: '/learn', icon: BookOpen, label: 'Learn' },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_26%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.16),transparent_20%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--card))_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_22%)]" />
      <div className="relative mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/20 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-xl shadow-sky-500/20">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Morse Telegraph</p>
              <h1 className="text-2xl font-semibold text-slate-900">Realtime messaging for Morse operators</h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[320px]">
              <input
                aria-label="Search app"
                className="h-11 w-full rounded-full border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                placeholder="Search chats, tools, or settings..."
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
            <Button variant="secondary" className="rounded-full bg-slate-950 text-white hover:bg-slate-900">Quick action</Button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className={`flex flex-col gap-6 rounded-[32px] border border-slate-200/70 bg-white/90 p-5 shadow-xl shadow-slate-200/20 ${isMobile ? 'fixed inset-x-4 top-24 z-40 max-h-[calc(100vh-6rem)] overflow-auto' : ''}`}>
            <div className="rounded-[28px] bg-slate-950/95 p-5 text-white shadow-xl shadow-slate-950/10">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Telegraph hub</p>
                  <h2 className="text-lg font-semibold">Operator dashboard</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">Navigate your workspace, jump into chat, and keep your tools in one polished interface.</p>
            </div>

            <ScrollArea className="flex-1 overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 p-4 shadow-inner shadow-slate-200/10">
              <div className="space-y-2">
                {navItems.map(({ path, label, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className={`w-full flex items-center gap-3 rounded-3xl px-4 py-3 text-left text-sm font-medium transition ${
                        isActive
                          ? 'bg-sky-100 text-sky-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Operator mode</p>
                  <p className="text-xs text-slate-500">Fast access to tools</p>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="mt-4 w-full rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </aside>

          <div className="flex flex-col gap-6">
            <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-slate-200/20">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Workspace</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Fresh interface, retained features</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    <p className="uppercase tracking-[0.35em] text-slate-400">Chats</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Live</p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    <p className="uppercase tracking-[0.35em] text-slate-400">Tools</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">One place</p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    <p className="uppercase tracking-[0.35em] text-slate-400">Realtime</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Built-in</p>
                  </div>
                </div>
              </div>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
