"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Menu, X } from "lucide-react";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      setMobileMenuOpen(false);
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="border-b bg-white sticky top-0 z-40" role="banner">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center" aria-label="Main navigation">
        {/* Logo */}
        <Link 
          href="/" 
          className="text-xl md:text-2xl font-bold hover:text-gray-700 transition-colors" 
          aria-label="TopSchool.AI - Go to homepage"
        >
          TopSchool.AI
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-gray-600 max-w-[150px] lg:max-w-none truncate" aria-label="Current user">
                Welcome, <strong className="text-gray-900">{user.username}</strong>
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" aria-label="User menu" aria-haspopup="menu">
                    Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 p-0"
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {isAuthenticated && user ? (
                  <>
                    <div className="pb-4 border-b">
                      <p className="text-sm text-gray-500 mb-1">Logged in as</p>
                      <p className="font-semibold text-gray-900 truncate">{user.username}</p>
                    </div>
                    <Button 
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      asChild 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button 
                      asChild 
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
