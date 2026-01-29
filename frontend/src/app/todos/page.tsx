"use client";

import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function TodosPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">My Todos</h1>
            <p className="text-gray-600 mt-2">Coming soon...</p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
