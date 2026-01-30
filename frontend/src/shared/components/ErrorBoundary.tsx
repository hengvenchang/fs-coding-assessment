"use client";

import React, { ReactNode, ReactElement } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React runtime errors
 * Provides a fallback UI and recovery options
 */
export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console for debugging
    console.error("Error caught by boundary:", error);
    console.error("Error info:", errorInfo);

    // In a production app, you'd send this to error tracking service (Sentry, etc.)
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactElement {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Oops! Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                {this.state.error.message || "An unexpected error occurred"}
              </AlertDescription>
            </Alert>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Error Details:</h3>
              <div className="bg-gray-100 rounded p-4 mb-4">
                <code className="text-xs text-gray-700 block whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                </code>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div className="bg-blue-50 rounded p-4 text-xs text-blue-700 border border-blue-200">
                  <p className="font-semibold mb-2">Stack Trace (Development Only):</p>
                  <code className="block whitespace-pre-wrap break-words">
                    {this.state.error.stack}
                  </code>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              If the problem persists, please refresh the page or contact support.
            </p>
          </div>
        </div>
      );
    }

    return <>{this.props.children}</>;
  }
}
