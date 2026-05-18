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
      {/* Mobile menu button */}
      <div className="md:hidden border-b border-telegraph-border p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-telegraph-accent" />
          <h1 className="text-sm font-bold tracking-wide">Morse</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-telegraph-muted hover:text-telegraph-accent"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      {(!isMobile || mobileMenuOpen) && (
        <aside className="w-full md:w-64 border-r border-telegraph-border flex flex-col bg-telegraph-bg">
          {/* Logo - desktop only */}
          <div className="hidden md:flex items-center gap-2 border-b border-telegraph-border px-4 py-6">
            <Radio className="h-6 w-6 text-telegraph-accent" />
            <div>
              <h1 className="text-sm font-bold tracking-wide">Morse Telegraph</h1>
              <p className="text-xs text-telegraph-muted">Real-time messaging</p>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4">
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
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span>{label}</span>
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
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
