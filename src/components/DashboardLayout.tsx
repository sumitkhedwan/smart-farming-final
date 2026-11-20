import { useState } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NavBar } from './NavBar';
import { 
  LayoutDashboard, 
  Wheat, 
  TestTube,
  Sprout, 
  Search,
  Menu,
  X,
  Database,
  Bell,
  Settings,
  User,
  Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = {
    farmer: [
      { name: 'Market Overview', path: '/farmer/market', icon: Wheat },
      { name: 'Current Prices', path: '/farmer/prices', icon: Wheat },
    ],
    researcher: [
      { name: 'Plant Database', path: '/researcher/plants', icon: Database },
      { name: 'Research Tools', path: '/researcher/tools', icon: TestTube },
    ],
    gardener: [
      { name: 'Gardening Tips', path: '/gardening-tips', icon: Sprout },
      { name: 'Task Tracker', path: '/gardener/tasks', icon: Sprout },
    ],
  };

  const handleGardeningTipsClick = () => {
    navigate("/gardening-tips");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">AgriWise</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  className="pl-9"
                />
              </div>

              <nav className="space-y-1">
                {Object.entries(navigation).map(([role, items]) => (
                  <div key={role} className="space-y-1">
                    <h2 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </h2>
                    {items.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={cn(
                          "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                          location.pathname === item.path
                            ? "bg-primary text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex h-16 items-center border-b px-6">
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
            </div>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
} 