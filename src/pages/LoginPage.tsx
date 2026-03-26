import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Coffee, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginFormValues } from "@/schema/loginSchema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import CoffitoLogo from "@/assets/CoffitoLogo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError(null);
      await login(data);
      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      // Extract error message from the backend response
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response
      ) {
        const responseData = error.response.data as Record<string, unknown>;
        const message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : "Invalid email or password.";
        setServerError(message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-primary via-primary/90 to-primary/70 items-center justify-center">
        {/* Decorative background circles */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute top-1/4 right-10 h-40 w-40 rounded-full bg-white/10 blur-lg" />

        {/* Content */}
        <div className="relative z-10 max-w-md px-8 text-center text-white">
          <div className="mb-8 flex justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white/20 p-4 shadow-2xl backdrop-blur-sm">
              <img
                src={CoffitoLogo}
                alt="Coffito Café"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Coffito Café
          </h1>
          <p className="mb-6 text-lg text-white/80">
            Point of Sale System
          </p>

          <div className="mx-auto h-px w-16 bg-white/30" />

          <p className="mt-6 text-sm text-white/60 leading-relaxed">
            Manage orders, track sales, and keep your café running smoothly — all
            in one place.
          </p>
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo (visible on small screens only) */}
          <div className="flex flex-col items-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 p-2">
              <img
                src={CoffitoLogo}
                alt="Coffito Café"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Coffito Café</h1>
            <p className="text-sm text-muted-foreground">Point of Sale System</p>
          </div>

          {/* Heading */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Server error banner */}
          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@coffito.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          className="h-11 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember me */}
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal text-muted-foreground cursor-pointer"
                >
                  Remember me
                </Label>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Coffee className="h-4 w-4" />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} Coffito Café. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
