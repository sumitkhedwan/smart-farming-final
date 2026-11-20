import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart2, ClipboardList, Droplet, Home, LayoutDashboard, Leaf, LogIn, LogOut, Menu, MessageCircle, Settings as SettingsIcon, Sprout, Truck, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n/useTranslation';
import type { Locale } from '@/i18n/types';
import { cn } from '@/lib/utils';

type NavItem = { name: string; path: string; icon: React.ElementType };

const publicItems: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Diagnosis', path: '/diagnosis', icon: Leaf },
  { name: 'Soil Health', path: '/soil-analysis', icon: Sprout },
  { name: 'Recommendations', path: '/recommendations', icon: Droplet },
  { name: 'Market Trends', path: '/market-trends', icon: BarChart2 },
  { name: 'Supply Chain', path: '/supply-chain', icon: Truck },
  { name: 'Farm Assistant', path: '/chatbot', icon: MessageCircle },
];

export const NavBar = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useTranslation();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const accountItems: NavItem[] = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', path: '/profile', icon: UserRound },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
    { name: 'Tasks', path: '/gardener/tasks', icon: ClipboardList },
  ] : [];
  const items = [
    ...publicItems,
    ...(user ? [{ name: 'Crop Management', path: '/crop-management', icon: Sprout }] : []),
    ...accountItems,
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsOpen(false), [location.pathname]);

  const logout = async () => {
    try {
      await signOut();
      setIsOpen(false);
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign out failed. Please try again.');
    }
  };

  const linkClass = (path: string, mobile = false) => cn(
    mobile
      ? 'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors'
      : 'inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
    location.pathname === path ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-muted/70 hover:text-foreground',
  );

  return (
    <nav
      aria-label="Main navigation"
      className={cn('fixed top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-shadow', scrolled && 'shadow-elevation-2', className)}
    >
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="AgriWise home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Leaf className="h-5 w-5" /></span>
          <span className="font-semibold text-lg">AgriWise</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto md:flex">
          {items.map((item) => (
            <Link key={item.path} to={item.path} aria-current={location.pathname === item.path ? 'page' : undefined} className={linkClass(item.path)}>
              <item.icon aria-hidden="true" className="mr-1.5 h-4 w-4" />{item.name}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor="language-picker">{t('language.label')}</label>
          <select
            id="language-picker"
            aria-label={t('language.label')}
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            className="h-9 rounded-md border bg-background px-2 text-xs"
          >
            <option value="en">EN</option><option value="hi">हिंदी</option><option value="mr">मराठी</option>
          </select>
          {user ? (
            <Button className="hidden md:inline-flex" variant="outline" size="sm" onClick={logout}><LogOut className="mr-1.5 h-4 w-4" />Sign out</Button>
          ) : (
            <Button className="hidden md:inline-flex" size="sm" asChild><Link to="/signin"><LogIn className="mr-1.5 h-4 w-4" />Sign in</Link></Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen((current) => !current)} aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen} aria-controls="mobile-navigation">
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMobile && (
        <div id="mobile-navigation" aria-hidden={!isOpen} className={cn('absolute w-full border-b bg-card px-4 pb-3 shadow-elevation-3 transition-all duration-200 md:hidden', isOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0')}>
          <div className="space-y-1 pt-2">
            {items.map((item) => (
              <Link key={item.path} to={item.path} aria-current={location.pathname === item.path ? 'page' : undefined} className={linkClass(item.path, true)} tabIndex={isOpen ? 0 : -1}>
                <item.icon aria-hidden="true" className="mr-3 h-5 w-5" />{item.name}
              </Link>
            ))}
            {user ? (
              <Button variant="ghost" className="w-full justify-start px-3" onClick={logout} tabIndex={isOpen ? 0 : -1}><LogOut className="mr-3 h-5 w-5" />Sign out</Button>
            ) : (
              <Link to="/signin" className={linkClass('/signin', true)} tabIndex={isOpen ? 0 : -1}><LogIn className="mr-3 h-5 w-5" />Sign in</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
