"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { registerBusiness } from "@/lib/actions/auth";
import { ImageUploader } from "@/components/ui/image-uploader";
import { uploadBusinessLogo } from "@/lib/actions/upload";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    businessType: "SHOP",
    plan: "FREE",
    logoUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await registerBusiness(formData);
      toast.success("Registration successful! Please check your email to verify your account. Your business is also pending Super Admin activation.", { duration: 15000 });
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-lg border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl">
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">Start Your Free Trial</CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Protech Assist SL Limited - Select your plan to get started.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="plan" className="text-xs font-black uppercase text-slate-500">Choose Plan</Label>
                <Select value={formData.plan} onValueChange={(val: string | null) => setFormData({...formData, plan: val ?? "FREE"})}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free Trial (14 days)</SelectItem>
                    <SelectItem value="BASIC">Basic Plan (Le 60/mo)</SelectItem>
                    <SelectItem value="STANDARD">Standard Plan (Le 150/mo)</SelectItem>
                    <SelectItem value="PREMIUM">Premium Plan (Le 300/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="logo" className="text-xs font-black uppercase text-slate-500">Business Logo (Optional)</Label>
                <ImageUploader 
                  value={formData.logoUrl} 
                  onChange={(url) => setFormData({...formData, logoUrl: url})} 
                  uploadAction={uploadBusinessLogo}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="businessName" className="text-xs font-black uppercase text-slate-500">Business Name</Label>
                <Input id="businessName" value={formData.businessName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, businessName: e.target.value})} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="businessType" className="text-xs font-black uppercase text-slate-500">Business Type</Label>
                <Select value={formData.businessType} onValueChange={(val: string | null) => setFormData({...formData, businessType: val ?? "SHOP"})}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHOP">General Shop</SelectItem>
                    <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                    <SelectItem value="BAR">Bar</SelectItem>
                    <SelectItem value="PHARMACY">Pharmacy</SelectItem>
                    <SelectItem value="SUPERMARKET">Supermarket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="email" className="text-xs font-black uppercase text-slate-500">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="password" className="text-xs font-black uppercase text-slate-500">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})} required className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-800">
              <p>1. Pay subscription fee (if applicable) to Orange Money: <span className="font-black">073019699</span></p>
              <p className="mt-2">2. WhatsApp payment receipt to: <span className="font-black">034955581</span></p>
              <p className="mt-2 font-black italic">Account will be activated by Super Admin after confirmation.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 font-black text-white" disabled={loading}>
              {loading ? "Registering..." : "Submit Registration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
