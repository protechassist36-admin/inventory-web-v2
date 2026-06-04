"use client";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, MessageCircle, CheckCircle2 } from "lucide-react";

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export function ManualPaymentModal({ isOpen, onClose, planName }: ManualPaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white text-slate-900">
        <div className="bg-orange-600 p-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight italic">Pay with Orange Money</h3>
          </div>
          <p className="text-orange-100 font-bold text-[10px] uppercase tracking-[0.25em]">Plan: {planName}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orange Money Number</p>
            <p className="text-lg font-black text-slate-900">073019699</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Account Name</p>
            <p className="text-lg font-black text-slate-900">ProTech Assist</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-black text-xs uppercase tracking-widest text-slate-900">Next Steps:</h4>
            <ul className="space-y-2 text-[10px] font-bold text-slate-600 list-decimal list-inside">
              <li>Make the payment to the number above.</li>
              <li>Take a screenshot of the payment receipt.</li>
              <li>Send receipt via WhatsApp to <span className="text-indigo-600">034955581</span>.</li>
              <li>Include: Name, Phone, Plan, & Transaction ID.</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest gap-2" onClick={() => window.open('https://wa.me/23234955581', '_blank')}>
              <MessageCircle className="h-4 w-4" /> WhatsApp Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
