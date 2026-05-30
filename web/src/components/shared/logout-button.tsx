"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-colors"
      onClick={() => signOut()}
      title="Log out"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
