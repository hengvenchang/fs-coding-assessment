"use client";

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
import { toast } from "sonner";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="border-b bg-white" role="banner">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center" aria-label="Main navigation">
        <Link href="/" className="text-2xl font-bold" aria-label="TopSchool.AI - Go to homepage">
          TopSchool.AI
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-gray-600" aria-label="Current user">
                Welcome, <strong>{user.username}</strong>
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
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
