"use client";

import { signIn, getSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { LogIn, AlertCircle } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push(callbackUrl);
      }
    });
  }, [callbackUrl, router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    switch (error) {
      case "OAuthSignin":
        return "There was an error signing in with Google. Please try again.";
      case "OAuthCallback":
        return "There was an error completing the sign-in process. Please try again.";
      case "OAuthCreateAccount":
        return "There was an error creating your account. Please try again.";
      case "Callback":
        return "There was an error during the authentication process. Please try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Playground</h1>
          <p className="text-gray-600">
            Sign in to access multi-modal AI-powered tasks
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 text-sm">{getErrorMessage(error)}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <LogIn className="w-5 h-5" />
          )}
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
