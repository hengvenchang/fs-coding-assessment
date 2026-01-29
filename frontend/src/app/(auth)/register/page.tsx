"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [isPending, setIsPending] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsPending(true);
      await register(data.username, data.password);
      toast.success("Registration successful!");
      router.push("/todos");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-600 mt-2">
            Sign up to start managing your todos
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {form.formState.errors.root && (
              <Alert variant="destructive" className="flex gap-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Registration Failed</p>
                  <p className="text-sm">
                    {form.formState.errors.root.message}
                  </p>
                </div>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username"
                      disabled={isPending}
                      {...field}
                      autoComplete="username"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500 mt-1">
                    3-50 characters, letters, numbers, and underscores only
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isPending}
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500 mt-1">
                    At least 8 characters
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      disabled={isPending}
                      {...field}
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? "Creating account..." : "Register"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Login here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
