"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft, Send } from "lucide-react";
import { resendVerificationEmail } from "@/lib/actions/verification";

export default function LoginPage() {
// ... existing state ...
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();

  async function handleResendEmail() {
    if (!email) {
      toast.error("Please enter your email address first.");
      return;
    }
    
    setResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("verify your email")) {
          toast.error(result.error, {
            action: {
              label: "Resend Email",
              onClick: () => handleResendEmail(),
            },
            duration: 10000,
          });
        } else {
          toast.error(result?.error || "Invalid credentials, please check your email and password.");
        }
      } else {
        const session = await getSession();
        console.log("DEBUG: Login successful, session object:", session);
        
        // Refresh the router state to ensure session is updated
        router.refresh();
        
        // Redirect based on role
        if (session?.user?.role === "SUPERADMIN") {
          console.log("DEBUG: Redirecting to /super-admin based on role");
          toast.success("Welcome, Super Admin");
          router.push("/super-admin");
        } else {
          console.log("DEBUG: Redirecting to /dashboard");
          toast.success("Login successful");
          router.push("/dashboard");
        }
      }
    } catch (error) {
      toast.error("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        
        {/* Left Side: Branding / Hero */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-slate-900 text-white relative">
          <Link 
            href="/" 
            className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
               <ArrowLeft className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Back to Site</span>
          </Link>

          <h1 className="text-4xl font-black tracking-tight mb-4">Protech Assist</h1>
          <p className="text-slate-400 font-medium">Log in to manage your enterprise operations, inventory intelligence, and tenant nodes.</p>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-12 relative">
          {/* Mobile Back Link */}
          <Link 
            href="/" 
            className="lg:hidden absolute top-6 right-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
            <ArrowLeft className="h-3 w-3 rotate-180" />
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Enter your credentials to access the hub.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-800"
                  placeholder="admin@protechnexus.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-slate-500">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-800"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-sm"
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
             <Link href="/super-admin" className="hover:text-primary hover:underline">
               Super Admin Login
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
