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
  Phone,
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const railTop = [
  { path: '/chat', label: 'Chats', icon: MessageSquare },
  { path: '/translator', label: 'Translate', icon: Zap },
  { path: '/tools', label: 'Tools', icon: BarChart3 },
  { path: '/history', label: 'History', icon: History },
  { path: '/reference', label: 'Reference', icon: Radio },
  { path: '/learn', label: 'Learn', icon: BookOpen },
];

const railBottom = [
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const mobileNav = [
  { path: '/chat', icon: MessageSquare, label: 'Chats' },
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

  const RailButton = ({ path, label, icon: Icon }: { path: string; label: string; icon: typeof MessageSquare }) => {
    const active = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        title={label}
        className={`group relative grid h-11 w-11 place-items-center rounded-full transition ${
          active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* WhatsApp-style icon rail — desktop only */}
      <aside className="hidden md:flex w-16 shrink-0 flex-col items-center justify-between py-4 bg-wa-rail border-r border-black/20">
        <div className="flex flex-col items-center gap-2">
          {railTop.map((item) => <RailButton key={item.path} {...item} />)}
        </div>
        <div className="flex flex-col items-center gap-2">
          {railBottom.map((item) => <RailButton key={item.path} {...item} />)}
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        {children}
      </main>

      {/* Mobile bottom nav (WhatsApp tabs) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border safe-bottom">
        <div className="grid grid-cols-4">
          {mobileNav.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            );
          })}

          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition ${
                  moreActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
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
                      className={`flex flex-col items-center gap-2 rounded-xl p-4 transition ${
                        active ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  );
                })}
                <button
                  onClick={async () => { setMoreOpen(false); await handleSignOut(); }}
                  className="flex flex-col items-center gap-2 rounded-xl p-4 bg-secondary hover:bg-secondary/70 transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-xs font-medium">Sign out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
