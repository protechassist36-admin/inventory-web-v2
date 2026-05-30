"use client";

import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { 
  Package, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Smartphone, 
  CheckCircle2, 
  Store, 
  Utensils, 
  PlusSquare, 
  LayoutDashboard,
  CloudSync,
  Lock,
  Globe,
  BarChart3,
  Rocket,
  Shield,
  Layers,
  Sparkles,
  ShoppingCart,
  TrendingUp,
  ZapIcon,
  Crown,
  MapPin,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";

export default function LandingPage() {
  const containerRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 80, damping: 20 }
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans transition-colors duration-500">
      {/* Dynamic Immersive Background */}
      <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
         <motion.div style={{ y: backgroundY }} className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-gradient-to-br from-blue-400/30 to-indigo-500/10 dark:from-indigo-600/10 dark:to-purple-600/5 blur-[140px] rounded-full animate-pulse" />
         <div className="absolute top-[10%] -right-[5%] w-[40%] h-[40%] bg-gradient-to-bl from-emerald-400/20 to-teal-500/5 dark:from-emerald-600/5 dark:to-teal-600/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-[0%] left-[10%] w-[50%] h-[50%] bg-gradient-to-tr from-rose-400/15 to-orange-500/10 dark:from-rose-600/5 dark:to-orange-600/5 blur-[150px] rounded-full" />
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-6 lg:px-20 h-20 flex items-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all">
        <Link className="flex items-center gap-3 group" href="/">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-primary/10 transition-all group-hover:scale-110 border border-slate-200 dark:border-slate-800">
            <Image 
              src="/images/logo.jpeg" 
              alt="Protech Logo" 
              fill 
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
             <span className="font-black text-xl tracking-tighter text-slate-900 dark:text-white leading-none">PROTECH</span>
             <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-primary mt-1">Smart Inventory</span>
          </div>
        </Link>
        
        <div className="hidden lg:flex items-center gap-8 ml-16">
          {["Features", "Solutions", "Pricing", "About"].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all relative group/link">
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary rounded-full transition-all group-hover/link:w-full" />
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <Link href="/login" className="hidden sm:block text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary px-2 transition-colors">
            Sign In
          </Link>
          <Link 
            href="/register" 
            className={cn(buttonVariants({ size: "default" }), "bg-primary hover:bg-primary/90 text-white rounded-xl px-6 h-11 text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95")}
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Immersive Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="container px-6 mx-auto relative z-10">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="flex flex-col items-center text-center max-w-5xl mx-auto"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-bold mb-8 tracking-[0.2em] uppercase">
                <Sparkles className="h-3 w-3 fill-primary" />
                The Future of African Enterprise
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-8">
                The Operating System for <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-violet-600">Modern Commerce.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg lg:text-xl text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed mb-12 font-medium">
                Streamline your retail, hospitality, or healthcare business with a high-performance, 
                <span className="text-slate-900 dark:text-white font-bold italic mx-1 underline decoration-primary/30 underline-offset-4">offline-first</span> 
                intelligence platform built for the unique challenges of the African market.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
                <Link 
                  href="/register" 
                  className={cn(buttonVariants({ size: "lg" }), "h-14 px-10 text-sm font-bold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 group")}
                >
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#" 
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-14 px-10 text-sm font-bold uppercase tracking-widest border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-2xl transition-all")}
                >
                  Book a Demo
                </Link>
              </motion.div>

              {/* Trust Bar */}
              <motion.div 
                variants={itemVariants}
                className="mt-20 pt-10 border-t border-slate-100 dark:border-slate-800/50 w-full max-w-4xl"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-8">Trusted by 5,000+ businesses across</p>
                <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                   {["SIERRA LEONE", "NIGERIA", "GHANA", "LIBERIA"].map(country => (
                     <div key={country} className="flex items-center gap-2 font-black text-sm tracking-tighter text-slate-600 dark:text-slate-300">
                        <MapPin className="h-4 w-4 text-primary" />
                        {country}
                     </div>
                   ))}
                </div>
              </motion.div>

              {/* Floating Dashboard Preview Card */}
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="mt-20 w-full max-w-6xl relative px-4 mx-auto"
              >
                 <div className="absolute inset-0 bg-primary/10 blur-[120px] -z-10 rounded-full scale-90" />
                 
                 <div className="relative flex justify-center items-center">
                    {/* Primary Screenshot */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-8 border-slate-900 dark:border-slate-800 shadow-2xl overflow-hidden aspect-[16/10] w-full relative z-20 group">
                       <Image 
                         src="/images/dashboard-preview-2.png" 
                         alt="Protech Intelligence Dashboard" 
                         fill 
                         className="object-cover transition-transform duration-700 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
                       <div className="absolute bottom-8 left-8 flex items-center gap-3">
                          <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-widest shadow-2xl">
                             Main Intelligence Console
                          </div>
                       </div>
                    </div>

                    {/* Secondary Screenshot (Floating/Layered) */}
                    <div className="absolute -bottom-12 -right-12 w-1/2 hidden lg:block z-30 group/secondary">
                       <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border-4 border-slate-900 dark:border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.4)] overflow-hidden aspect-[16/10] relative">
                          <Image 
                            src="/images/dashboard-preview-1.png" 
                            alt="Protech Analytics" 
                            fill 
                            className="object-cover transition-transform duration-700 group/secondary-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                       </div>
                    </div>
                    
                    {/* Background Decorative Element */}
                    <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
                 </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Industry Grid - Professional Solutions */}
        <section id="solutions" className="py-24 bg-white dark:bg-slate-950 relative transition-colors">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Vertical-Specific Intelligence</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl text-lg">One core platform, optimized for the diverse needs of your industry.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { title: "Retail & Shops", desc: "Advanced POS, automated reordering, and customer credit management.", icon: Store, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10" },
                 { title: "Restaurants", desc: "Live kitchen displays, ingredient tracking, and table performance analytics.", icon: Utensils, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/10" },
                 { title: "Pharmacies", desc: "Batch tracking, expiry alerts, and detailed medical dispensing history.", icon: PlusSquare, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10" },
                 { title: "Supermarkets", desc: "High-volume scanning, multi-lane support, and loyalty program integration.", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10" },
               ].map((item, i) => (
                 <motion.div 
                   whileHover={{ y: -5 }}
                   key={i} 
                   className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-xl group"
                 >
                    <div className={cn("p-4 rounded-2xl w-fit mb-6 transition-transform group-hover:scale-110", item.bg, item.color)}>
                       <item.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                 </motion.div>
               ))}
            </div>
          </div>
        </section>

        {/* Feature Grid - Core Capabilities */}
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/20 overflow-hidden relative transition-colors">
          <div className="container px-6 mx-auto">
            <div className="grid gap-8 lg:grid-cols-3">
               {[
                 { 
                   title: "Offline-First Resilience", 
                   icon: Zap, 
                   desc: "Business doesn't stop when the internet does. Our local-first architecture ensures 100% uptime regardless of connectivity.",
                   color: "text-amber-500"
                 },
                 { 
                   title: "Military-Grade Security", 
                   icon: ShieldCheck, 
                   desc: "End-to-end encryption and multi-role access controls keep your financial and customer data completely private and secure.",
                   color: "text-emerald-500"
                 },
                 { 
                   title: "Predictive Analytics", 
                   icon: TrendingUp, 
                   desc: "Harness AI to forecast demand, identify high-velocity stock, and eliminate wastage before it impacts your bottom line.",
                   color: "text-indigo-500"
                 },
               ].map((f, i) => (
                 <div key={i} className="group p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-primary/50 transition-all duration-300 hover:shadow-2xl">
                    <div className={cn("p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl w-fit mb-8 group-hover:rotate-12 transition-transform", f.color)}>
                       <f.icon className="h-7 w-7" />
                    </div>
                    <h4 className="text-2xl font-black mb-4 text-slate-900 dark:text-white tracking-tight">{f.title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Cinematic Video Advertisement */}
        <section className="py-24 bg-white dark:bg-slate-950 transition-colors relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
           <div className="container px-6 mx-auto relative z-10">
              <div className="flex flex-col items-center text-center mb-16">
                 <div className="px-4 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-bold uppercase tracking-widest mb-4">See it in Action</div>
                 <h2 className="text-3xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
                    Experience the <br className="hidden md:block" /> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Protech Revolution.</span>
                 </h2>
                 <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl text-lg">Watch how we're transforming business operations across Africa with intelligent, offline-first technology.</p>
              </div>

              <div className="max-w-5xl mx-auto">
                 <div className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-slate-900 dark:border-slate-800 bg-slate-900 shadow-primary/20">
                    <video 
                      ref={videoRef}
                      className="w-full aspect-video object-cover" 
                      controls 
                      muted
                      loop
                      onMouseEnter={() => videoRef.current?.play()}
                      onMouseLeave={() => videoRef.current?.pause()}
                      poster="/images/dashboard-preview-2.png"
                    >
                       <source src="/videos/ads.mp4" type="video/mp4" />
                       Your browser does not support the video tag.
                    </video>
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                 </div>
                 
                 <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: "High Definition", icon: Sparkles },
                      { label: "Live Demo", icon: Zap },
                      { label: "Feature Tour", icon: Package },
                      { label: "Local Context", icon: MapPin }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                         <item.icon className="h-4 w-4 text-primary" />
                         <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        {/* Professional Trust Bar */}
        <section className="py-20 bg-slate-900 dark:bg-black overflow-hidden relative transition-colors">
           <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
           <div className="container px-6 mx-auto relative z-10">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                 <div className="text-center lg:text-left">
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight italic">Built for the African Context.</h2>
                    <p className="text-slate-400 font-medium text-lg">Infrastructure designed locally for global-standard performance.</p>
                 </div>
                 <div className="flex flex-wrap justify-center gap-10 md:gap-16 opacity-60">
                    <div className="flex items-center gap-2 text-white font-bold text-xs tracking-[0.2em] uppercase"><MapPin className="h-4 w-4 text-primary"/> Freetown Hub</div>
                    <div className="flex items-center gap-2 text-white font-bold text-xs tracking-[0.2em] uppercase"><MapPin className="h-4 w-4 text-primary"/> Lagos Ops</div>
                    <div className="flex items-center gap-2 text-white font-bold text-xs tracking-[0.2em] uppercase"><MapPin className="h-4 w-4 text-primary"/> Accra Center</div>
                 </div>
              </div>
           </div>
        </section>

        {/* Testimonials - Social Proof */}
        <section className="py-24 bg-white dark:bg-slate-950 transition-colors">
           <div className="container px-6 mx-auto">
              <div className="flex flex-col items-center text-center mb-16">
                 <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">Success Stories</div>
                 <h2 className="text-3xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Trusted by Visionary Leaders</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 {[
                   { quote: "The offline-first feature saved our business during the last network outage. It's truly built for us.", author: "Mariatu K.", role: "Pharmacy Owner, Freetown" },
                   { quote: "Protech turned our chaotic inventory into a streamlined intelligence engine. Profits are up 30%.", author: "Ahmed S.", role: "Retail Chain Manager, Lagos" },
                   { quote: "The most intuitive POS I've ever used. My staff learned it in minutes. Exceptional support.", author: "Joyce B.", role: "Restaurant Group CEO, Accra" }
                 ].map((t, i) => (
                   <div key={i} className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative">
                      <div className="text-primary opacity-20 absolute top-6 right-8 text-6xl font-serif">"</div>
                      <p className="text-lg text-slate-600 dark:text-slate-300 font-medium mb-8 leading-relaxed italic relative z-10">
                        {t.quote}
                      </p>
                      <div>
                         <div className="font-bold text-slate-900 dark:text-white">{t.author}</div>
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{t.role}</div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Premium Pricing */}
        <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900/30 transition-colors">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col items-center text-center mb-20">
              <h2 className="text-4xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl text-lg">Choose the plan that fits your business scale today.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
              {[
                { 
                  name: "Basic Plan", 
                  price: "Le 60", 
                  yearly: "Le 600",
                  suitable: "Small shops, Retail stores, Mini businesses",
                  items: ["Product management", "Stock tracking", "Sales recording", "Basic reports", "Receipt generation", "Single business access"], 
                  cta: "Start Basic", 
                  premium: false 
                },
                { 
                  name: "Standard Plan", 
                  price: "Le 150", 
                  yearly: "Le 1,500",
                  suitable: "Growing businesses, Supermarkets, Pharmacies",
                  items: ["Everything in Basic", "Customer management", "Credit sales tracking", "Supplier management", "Purchase history", "Profit & loss reports", "Multi-user access"], 
                  cta: "Go Standard", 
                  premium: true 
                },
                { 
                  name: "Premium Plan", 
                  price: "Le 300", 
                  yearly: "Le 3,000",
                  suitable: "Large businesses, Multi-branch, Enterprise",
                  items: ["Everything in Standard", "Advanced analytics", "Multi-branch management", "Real-time dashboard", "Business performance insights", "Priority support", "Cloud backup & security", "Super admin monitoring"], 
                  cta: "Go Premium", 
                  premium: false 
                },
              ].map((p, i) => (
                <div key={i} className={cn(
                  "p-10 rounded-3xl border flex flex-col bg-white dark:bg-slate-900 transition-all hover:-translate-y-2",
                  p.premium ? "border-primary shadow-xl shadow-primary/10 relative z-10" : "border-slate-200 dark:border-slate-800"
                )}>
                  {p.premium && (
                     <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg">Most Popular</div>
                  )}
                  <h3 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">{p.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{p.suitable}</p>
                  
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white">{p.price}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">/ month</span>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter mb-8">Or {p.yearly} / yearly</div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {p.items.map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-tight">
                        <CheckCircle2 className={cn("h-4 w-4 shrink-0", p.premium ? "text-primary" : "text-slate-300 dark:text-slate-600")} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/register?plan=${p.name.split(' ')[0].toUpperCase()}`} className={cn(
                    "h-12 rounded-xl flex items-center justify-center text-sm font-bold uppercase tracking-widest transition-all",
                    p.premium ? "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 border border-slate-200 dark:border-slate-800"
                  )}>
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>

            {/* Optional Add-ons Section */}
            <div className="mt-24 max-w-4xl mx-auto">
               <div className="p-8 md:p-12 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                     <div className="md:w-1/3">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl w-fit mb-6">
                           <PlusSquare className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Optional Add-ons</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Customize your platform with specialized tools and services.</p>
                     </div>
                     <div className="md:w-2/3 grid grid-cols-2 gap-x-8 gap-y-4">
                        {[
                          "Custom branding", "Staff training", "Data migration", 
                          "SMS notifications", "WhatsApp integration", "Barcode setup", 
                          "Custom reports"
                        ].map((addon) => (
                          <div key={addon} className="flex items-center gap-2 group">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                             <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{addon}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-20 pb-10 transition-colors">
          <div className="container px-6 mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              <div className="lg:col-span-4">
                <Link className="flex items-center gap-3 mb-6 group" href="/">
                   <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <Image src="/images/logo.jpeg" alt="Logo" fill className="object-cover" />
                   </div>
                   <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter">PROTECH</span>
                </Link>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 max-w-sm">
                  Providing the digital infrastructure for Africa's retail and hospitality revolution. Built locally, scaling globally.
                </p>
                <div className="flex gap-4">
                   {[Heart, Smartphone, Globe].map((Icon, i) => (
                     <div key={i} className="h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors cursor-pointer">
                        <Icon className="h-5 w-5" />
                     </div>
                   ))}
                </div>
              </div>
              
              <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-8">
                 {[
                   { title: "Product", links: ["Features", "Solutions", "Pricing", "API"] },
                   { title: "Company", links: ["About Us", "Impact", "Privacy", "Terms"] },
                   { title: "Support", links: ["Help Center", "Status", "Contact", "Demo"] }
                 ].map((col, i) => (
                   <div key={i}>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-[10px]">{col.title}</h4>
                      <ul className="space-y-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                         {col.links.map(link => <li key={link}><Link href="#" className="hover:text-primary transition-colors">{link}</Link></li>)}
                      </ul>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 Protech SmartInventory. All rights reserved.</p>
               <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Privacy</span>
                  <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Terms</span>
                  <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors">Cookies</span>
               </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
