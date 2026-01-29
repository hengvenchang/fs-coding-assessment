"use client";

import { useAuth } from "@/contexts/auth";
import { Header } from "@/components/Header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Welcome to Todos
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A production-ready todo application built with Next.js and React.
            Manage your tasks efficiently with priority levels, descriptions,
            and more.
          </p>

          {isAuthenticated && (
            <div className="flex gap-4 justify-center">
              <a
                href="/todos"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Go to Todos
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
