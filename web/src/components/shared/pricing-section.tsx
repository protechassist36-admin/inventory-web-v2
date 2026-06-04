"use client";
import React, { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ManualPaymentModal } from './manual-payment-modal';

const plans = [
  {
    name: 'Basic',
    price: '200',
    description: 'Perfect for small shops starting out.',
    features: ['1 User', 'Up to 500 Products', 'Stock Management', 'Sales Recording', 'Basic Reports'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Standard',
    price: '500',
    description: 'For growing businesses.',
    features: ['Up to 5 Users', 'Up to 5,000 Products', 'Supplier Management', 'Purchase Orders', 'Low Stock Alerts', 'Sales & Inventory Reports'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Business',
    price: '1,000',
    description: 'Everything you need to scale.',
    features: ['Up to 15 Users', 'Unlimited Products', 'Customer Management', 'Profit & Loss Reports', 'Barcode Support', 'Branch Reporting'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '2,500+',
    description: 'For large-scale operations.',
    features: ['Unlimited Users', 'Multi-Branch Management', 'Role-Based Access Control', 'API Integration', 'Custom Features', 'Dedicated Support'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function PricingSection() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="py-24 px-6 bg-slate-50 dark:bg-slate-950" id="pricing">
      <div className="max-w-7xl mx-auto">
        {/* Trial Banner */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            <Star className="h-4 w-4 fill-current" />
            <span>7-Day Free Trial available on all plans</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mt-8 mb-6">Choose your growth plan</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">Transparent pricing for premium enterprise retail intelligence.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={cn(
                "relative flex flex-col transition-all duration-300 hover:shadow-2xl border-2",
                plan.popular ? "border-indigo-600 shadow-xl scale-105" : "border-slate-200 dark:border-slate-800"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                <CardDescription className="text-slate-500">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-4xl font-black mb-6">NLe {plan.price}<span className="text-sm font-medium text-slate-500">/month</span></div>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Check className="h-4 w-4 text-indigo-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => {
                    if (plan.name === 'Basic') return router.push('/register');
                    setSelectedPlan(plan.name);
                  }}
                  className={cn("w-full h-12 font-bold", plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 dark:bg-white dark:text-slate-900")}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <ManualPaymentModal 
           isOpen={!!selectedPlan} 
           onClose={() => setSelectedPlan(null)} 
           planName={selectedPlan || ""} 
        />

        {/* Contact Info */}
        <div className="mt-20 text-center text-slate-600 dark:text-slate-400">
          <p className="font-bold">Need help choosing?</p>
          <p>Phone: <a href="tel:034955581" className="text-indigo-600 font-black hover:underline">034955581</a></p>
          <p>Email: <a href="mailto:protechassist36@gmail.com" className="text-indigo-600 font-black hover:underline">protechassist36@gmail.com</a></p>
        </div>
      </div>
    </div>
  );
}
