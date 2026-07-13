import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
          }),
        }
      );

      /*
       * For security, the backend should normally return
       * the same success response whether or not the email exists.
       */
      if (!response.ok) {
        throw new Error(
          "Unable to process your request. Please try again."
        );
      }

      setSent(true);
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleTryAgain() {
    setSent(false);
    setError("");
  }

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset your password"
      footer={
        <Link
          to="/login"
          className="font-medium text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 inline h-3 w-3" />
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <Mail className="h-6 w-6 text-green-500" />
          </div>

          <p className="text-sm leading-relaxed text-foreground">
            If an account exists with{" "}
            <span className="font-medium">{email}</span>, you
            will receive a password reset link shortly.
          </p>

          <p className="text-xs text-muted-foreground">
            Check your spam or junk folder if you don't see the
            email.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={handleTryAgain}
            className="w-full"
          >
            Try another email
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email">
              Email address
            </Label>

            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-12 pl-10"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

              <p className="text-sm text-red-500">
                {error}
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="h-12 w-full font-medium"
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}