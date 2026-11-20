import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50/40">
        <div className="flex h-16 items-center border-b px-4">
          <h2 className="text-lg font-semibold">Dashboard</h2>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="space-y-1 p-2">
            <Button variant="ghost" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
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
    </div>
  );
} 