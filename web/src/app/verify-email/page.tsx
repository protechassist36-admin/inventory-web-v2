"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/actions/verification";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    const performVerification = async () => {
      const result = await verifyEmail(token);
      if (result.success) {
        setStatus("success");
        setMessage(result.message);
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    };

    performVerification();
  }, [token]);

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="text-center pt-10 pb-6 bg-slate-50 border-b border-slate-100">
        <div className="flex justify-center mb-4">
          {status === "loading" && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
          {status === "success" && <CheckCircle2 className="h-12 w-12 text-emerald-500" />}
          {status === "error" && <XCircle className="h-12 w-12 text-rose-500" />}
        </div>
        <CardTitle className="text-2xl font-black text-slate-900">
          {status === "loading" && "Verifying Email"}
          {status === "success" && "Verification Complete"}
          {status === "error" && "Verification Failed"}
        </CardTitle>
        <CardDescription className="text-slate-500 font-medium">
          {status === "loading" && "Please wait while we activate your account..."}
          {status === "success" && "Your identity has been confirmed."}
          {status === "error" && "We couldn't verify your email address."}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 text-center">
        <p className={`font-bold mb-8 ${status === 'error' ? 'text-rose-600' : 'text-slate-700'}`}>
          {message}
        </p>

        {status !== "loading" && (
          <Link href="/login" className="w-full">
            <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest">
              {status === "success" ? "Continue to Login" : "Back to Login"}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md border-slate-200 shadow-xl rounded-3xl p-10 text-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="font-bold text-slate-600">Loading verification stream...</p>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
