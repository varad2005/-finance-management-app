import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Calendar,
  FileText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Home,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { title: "Dashboard", href: "/", icon: <Home className="h-5 w-5" /> },
    { title: "Applications", href: "/applications", icon: <Briefcase className="h-5 w-5" /> },
    { title: "Calendar", href: "/calendar", icon: <Calendar className="h-5 w-5" /> },
    { title: "Documents", href: "/documents", icon: <FileText className="h-5 w-5" /> },
    { title: "Analytics", href: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const renderNavContent = () => (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-primary ml-2 font-display">JobTrackr</h2>
          </div>
          {!isMobile && <ThemeToggle />}
        </div>
      </div>
      <Separator className="dark:border-gray-700" />
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                location === item.href
                  ? "bg-primary text-white"
                  : "text-[#2C3E50] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span className="ml-3">{item.title}</span>
            </a>
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4">
        <Separator className="mb-4 dark:border-gray-700" />
        <div className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-white">
              {user?.fullName ? getInitials(user.fullName) : user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-[#2C3E50] dark:text-gray-200">
              {user?.fullName || user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email || "No email provided"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-4 text-[#2C3E50] dark:text-gray-200 dark:border-gray-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 shadow-sm px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-primary ml-2 font-display">JobTrackr</h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 dark:bg-gray-900">
                {renderNavContent()}
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="h-14"></div> {/* Spacer for fixed header */}
      </>
    );
  }

  return <div className="w-64 bg-white dark:bg-gray-900 shadow-sm h-screen overflow-y-auto">{renderNavContent()}</div>;
}
