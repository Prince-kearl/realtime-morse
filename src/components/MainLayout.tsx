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
    <div className="h-screen bg-telegraph-bg text-telegraph-text flex flex-col md:flex-row">
      {/* Mobile header */}
      <div className="md:hidden border-b border-telegraph-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-telegraph-accent" />
          <h1 className="text-sm font-bold tracking-wide">Morse Telegraph</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-telegraph-muted hover:text-telegraph-accent"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      {(!isMobile || mobileMenuOpen) && (
        <>
          {isMobile && mobileMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside className={`flex flex-col bg-telegraph-bg border-r border-telegraph-border ${
            isMobile ? 'fixed inset-y-0 left-0 z-50 w-full max-w-xs shadow-2xl md:relative md:w-72 lg:w-64' : 'w-full md:w-72 lg:w-64'
          }`}>
            {/* Logo - desktop only */}
            <div className="hidden md:flex items-center gap-3 border-b border-telegraph-border px-4 py-6">
              <Radio className="h-7 w-7 text-telegraph-accent" />
              <div>
                <h1 className="text-base font-bold tracking-wide">Morse Telegraph</h1>
                <p className="text-xs text-telegraph-muted">Real-time messaging</p>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-3 py-4">
              <div className="space-y-1">
                {navItems.map(({ path, label, icon: Icon }) => {
                  const isActive = location.pathname === path;
                  return (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-telegraph-accent/10 text-telegraph-accent'
                          : 'text-telegraph-muted hover:text-telegraph-accent hover:bg-telegraph-accent/5'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Sign out button */}
            <div className="border-t border-telegraph-border p-4">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full justify-start text-telegraph-muted hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-24 flex-1">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden">
        <div className="bg-telegraph-card/90 backdrop-blur rounded-full shadow-lg px-3 py-2 flex items-center gap-3">
          {mobileNav.map(({ path, icon: Icon, label }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center justify-center text-xs text-telegraph-muted px-3 py-1 rounded ${
                location.pathname === path ? 'text-telegraph-accent' : ''
              }`}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1">{label}</span>
            </button>
          ))}
        </div>
      </nav>
     </div>
   );
 }
