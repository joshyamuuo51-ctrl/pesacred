'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Wallet,
  Briefcase,
  Banknote,
  Star,
  CheckCircle2,
  Users,
  TrendingUp,
  Award,
  Lock,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ChevronDown,
  Smartphone,
  FileCheck,
  ThumbsUp,
} from 'lucide-react';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { ChatWidget } from '@/components/chat-widget';
import { FadeIn, StaggerGroup, StaggerItem } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';

const stats = [
  { icon: Users, label: 'Active Borrowers', value: '48,000+' },
  { icon: TrendingUp, label: 'Loans Disbursed', value: 'KES 2.4B' },
  { icon: Clock, label: 'Avg. Decision Time', value: '24 hrs' },
  { icon: Award, label: 'Approval Rate', value: '92%' },
];

const howSteps = [
  {
    icon: Smartphone,
    title: 'Create Your Account',
    description: 'Register with your National ID and contact details in under 2 minutes.',
  },
  {
    icon: FileCheck,
    title: 'Apply Online',
    description: 'Choose a loan product, enter your details, and upload your documents.',
  },
  {
    icon: ShieldCheck,
    title: 'Get Assessed',
    description: 'Our team reviews your application and verifies your documents.',
  },
  {
    icon: ThumbsUp,
    title: 'Receive Funds',
    description: 'Once approved, funds are disbursed to your mobile money or bank account.',
  },
];

const products = [
  {
    icon: Wallet,
    name: 'Personal Loan',
    rate: '14.5%',
    range: 'KES 5,000 – 250,000',
    term: '3 – 24 months',
    description: 'Flexible personal loans for everyday needs — medical, education, home improvement.',
    features: ['Quick approval', 'No collateral', 'Flexible repayment'],
  },
  {
    icon: Briefcase,
    name: 'Business Loan',
    rate: '18%',
    range: 'KES 20,000 – 500,000',
    term: '6 – 36 months',
    description: 'Working capital and business expansion loans for registered enterprises.',
    features: ['Higher limits', 'Longer terms', 'Business-focused'],
  },
  {
    icon: Zap,
    name: 'Emergency Loan',
    rate: '22%',
    range: 'KES 2,000 – 50,000',
    term: '1 – 6 months',
    description: 'Quick short-term loans for urgent needs with fast turnaround.',
    features: ['Fast processing', 'Same-day decision', 'Short term'],
  },
  {
    icon: Banknote,
    name: 'Salary Advance',
    rate: '12%',
    range: 'KES 1,000 – 30,000',
    term: '1 – 2 months',
    description: 'Get an advance on your next paycheck with low interest.',
    features: ['Lowest rate', 'Instant access', 'Salary-backed'],
  },
];

const whyUs = [
  {
    icon: Zap,
    title: 'Fast & Convenient',
    description: 'Apply from anywhere, anytime. Get a decision in as little as 24 hours.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    description: 'Bank-grade encryption protects your data. We never share your information.',
  },
  {
    icon: CheckCircle2,
    title: 'Transparent Terms',
    description: 'No hidden fees. You see all costs upfront before you commit to anything.',
  },
  {
    icon: Users,
    title: 'Dedicated Support',
    description: 'Our team is here to help you through every step of the process.',
  },
];

const reviews = [
  {
    name: 'Amara Otieno',
    role: 'Small Business Owner',
    rating: 5,
    text: 'PesaCred helped me expand my business when traditional banks turned me down. The process was smooth and the funds were in my account within a day.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    name: 'David Kimani',
    role: 'Teacher',
    rating: 5,
    text: 'I needed an emergency loan for medical bills. PesaCred was fast, transparent, and there were no surprises. Highly recommended.',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
  {
    name: 'Grace Wanjiru',
    role: 'Freelance Designer',
    rating: 5,
    text: 'The salary advance product saved me at the end of a tough month. Everything was done on my phone — no paperwork, no queues.',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
  },
];

const faqs = [
  {
    q: 'How long does loan approval take?',
    a: 'Most applications are reviewed within 24-48 hours after all documents are submitted and verified. Emergency loans may receive a decision the same day.',
  },
  {
    q: 'Is there a fee to apply?',
    a: 'Some loan products require a processing fee, which is clearly disclosed before you proceed. The fee covers credit assessment and verification costs. Paying any fee does not guarantee approval — approval depends on completion of the eligibility and credit assessment.',
  },
  {
    q: 'What documents do I need?',
    a: 'You will need your National ID, which you can upload securely through the app. Additional documents may be requested during the review process.',
  },
  {
    q: 'How do I receive my funds?',
    a: 'Approved loans are disbursed directly to your mobile money account (M-Pesa or Airtel Money) or your bank account, depending on your preference.',
  },
  {
    q: 'What if my loan is declined?',
    a: 'If your application is declined, you will receive a notification with the reason. You can reapply after addressing the issues, typically after 30 days.',
  },
  {
    q: 'Can I repay early?',
    a: 'Yes, you can repay your loan early without any prepayment penalties. Early repayment may also improve your credit standing with PesaCred.',
  },
];

export default function LandingPage() {
  const shouldReduce = useReducedMotion();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent! We will get back to you within 24 hours.');
    setContactForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,black,transparent)]" />
          <div className="absolute inset-0 bg-radial-fade" />
          <div className="container relative mx-auto px-4 pb-20 pt-16 lg:px-6 lg:pb-28 lg:pt-24">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Badge className="mb-5 border-primary/20 bg-primary/10 text-primary">
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Trusted by 48,000+ borrowers
                  </Badge>
                  <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                    Fast, Secure & <span className="text-primary">Transparent</span> Online Loans
                  </h1>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                    Apply for a loan in minutes and get a decision fast. PesaCred connects you
                    to flexible financing with clear terms and no hidden fees.
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg" className="h-12 gap-2 text-base shadow-glow">
                      <Link href="/register">
                        Apply Now <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-12 text-base">
                      <Link href="/#how-it-works">See How It Works</Link>
                    </Button>
                  </div>
                  <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-4 w-4 text-primary" /> Bank-grade security
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" /> No hidden fees
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-primary" /> 24-hour decisions
                    </span>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: shouldReduce ? 1 : 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="relative"
              >
                <div className="relative mx-auto max-w-md">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/10 blur-2xl" />
                  <Card className="relative overflow-hidden border-border/60 shadow-card">
                    <div className="bg-gradient-to-br from-secondary to-secondary/80 p-6 text-secondary-foreground">
                      <div className="flex items-center justify-between">
                        <span className="text-sm opacity-80">Loan Dashboard</span>
                        <Badge className="border-white/20 bg-white/10 text-white">Active</Badge>
                      </div>
                      <p className="mt-4 text-3xl font-bold">KES 85,000</p>
                      <p className="text-sm opacity-70">Personal Loan · 12 months</p>
                      <div className="mt-4 h-2 rounded-full bg-white/20">
                        <div className="h-2 w-2/3 rounded-full bg-primary" />
                      </div>
                      <p className="mt-2 text-xs opacity-70">4 of 12 payments completed</p>
                    </div>
                    <CardContent className="grid grid-cols-2 gap-4 p-6">
                      <div className="rounded-xl bg-accent/50 p-4">
                        <p className="text-xs text-muted-foreground">Next Payment</p>
                        <p className="mt-1 text-lg font-semibold">KES 8,021</p>
                        <p className="text-xs text-muted-foreground">in 12 days</p>
                      </div>
                      <div className="rounded-xl bg-accent/50 p-4">
                        <p className="text-xs text-muted-foreground">Available Limit</p>
                        <p className="mt-1 text-lg font-semibold text-primary">KES 165,000</p>
                        <p className="text-xs text-muted-foreground">eligible</p>
                      </div>
                    </CardContent>
                  </Card>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="absolute -right-3 top-1/3 flex items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2 shadow-card"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-medium">Approved in 18h</span>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Stats */}
            <StaggerGroup className="mt-16 grid grid-cols-2 gap-4 lg:mt-24 lg:grid-cols-4">
              {stats.map((s) => (
                <StaggerItem key={s.label}>
                  <Card className="text-center shadow-soft">
                    <CardContent className="flex flex-col items-center p-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <s.icon className="h-5 w-5" />
                      </span>
                      <p className="mt-3 text-2xl font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-16 border-t border-border/60 py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-6">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="border-primary/30 text-primary">How It Works</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Get a loan in 4 simple steps
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our digital-first process means you can apply, get approved, and receive funds
                without ever leaving your home.
              </p>
            </FadeIn>

            <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {howSteps.map((step, i) => (
                <StaggerItem key={step.title}>
                  <Card className="relative h-full shadow-soft transition-shadow hover:shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <step.icon className="h-6 w-6" />
                        </span>
                        <span className="font-display text-3xl font-bold text-border">
                          {i + 1}
                        </span>
                      </div>
                      <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* Loan Products */}
        <section id="loan-products" className="scroll-mt-16 bg-muted/30 py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-6">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="border-primary/30 text-primary">Loan Products</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A loan for every need
              </h2>
              <p className="mt-4 text-muted-foreground">
                Choose from our range of loan products designed to fit your circumstances.
                All terms are shown upfront — no surprises.
              </p>
            </FadeIn>

            <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <StaggerItem key={p.name}>
                  <Card className="group h-full shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
                    <CardHeader className="pb-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-glow">
                        <p.icon className="h-6 w-6" />
                      </span>
                      <h3 className="mt-3 text-lg font-semibold">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-baseline justify-between border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">Interest</span>
                        <span className="font-semibold text-primary">{p.rate} p.a.</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">Amount</span>
                        <span className="text-sm font-medium">{p.range}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">Term</span>
                        <span className="text-sm font-medium">{p.term}</span>
                      </div>
                      <ul className="space-y-1.5 pt-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {f}
                          </li>
                        ))}
                      </ul>
                      <Button asChild className="mt-2 w-full" size="sm">
                        <Link href="/register">
                          Apply <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* Why Choose PesaCred */}
        <section id="why-us" className="scroll-mt-16 py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <FadeIn>
                <Badge variant="outline" className="border-primary/30 text-primary">Why PesaCred</Badge>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Built on trust, speed, and transparency
                </h2>
                <p className="mt-4 text-muted-foreground">
                  We believe borrowing money should be simple, fair, and honest. That is why
                  we put you in control with clear terms and a process you can follow every
                  step of the way.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {whyUs.map((w) => (
                    <div key={w.title} className="rounded-xl border border-border/60 bg-card p-4 shadow-soft">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <w.icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-3 font-semibold text-foreground">{w.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
                    </div>
                  ))}
                </div>
              </FadeIn>

              <FadeIn delay={0.15} className="relative">
                <div className="relative mx-auto max-w-md">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/15 to-secondary/10 blur-2xl" />
                  <Card className="relative shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                          <ShieldCheck className="h-6 w-6" />
                        </span>
                        <div>
                          <p className="font-semibold">Your security, our priority</p>
                          <p className="text-sm text-muted-foreground">256-bit encryption · RLS protected</p>
                        </div>
                      </div>
                      <div className="mt-6 space-y-3">
                        {[
                          'Your data is encrypted end-to-end',
                          'Row-level security on every record',
                          'We never sell your information',
                          'Full audit trail of all actions',
                        ].map((item) => (
                          <div key={item} className="flex items-center gap-3 rounded-lg bg-accent/40 px-4 py-3">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                            <span className="text-sm text-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="scroll-mt-16 bg-muted/30 py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-6">
            <FadeIn className="mx-auto max-w-2xl text-center">
              <Badge variant="outline" className="border-primary/30 text-primary">Customer Reviews</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                What our customers say
              </h2>
              <div className="mt-3 flex items-center justify-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">4.9 / 5 from 12,000+ reviews</span>
              </div>
            </FadeIn>

            <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-3">
              {reviews.map((r) => (
                <StaggerItem key={r.name}>
                  <Card className="h-full shadow-soft">
                    <CardContent className="p-6">
                      <div className="flex gap-0.5">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="mt-4 text-sm leading-relaxed text-foreground">&ldquo;{r.text}&rdquo;</p>
                      <div className="mt-5 flex items-center gap-3">
                        <img
                          src={r.avatar}
                          alt={r.name}
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-semibold">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 py-20 lg:py-28">
          <div className="container mx-auto max-w-3xl px-4 lg:px-6">
            <FadeIn className="text-center">
              <Badge variant="outline" className="border-primary/30 text-primary">FAQ</Badge>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to know about applying for a loan with PesaCred.
              </p>
            </FadeIn>
            <FadeIn delay={0.1} className="mt-10">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </FadeIn>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="scroll-mt-16 bg-muted/30 py-20 lg:py-28">
          <div className="container mx-auto px-4 lg:px-6">
            <div className="grid gap-10 lg:grid-cols-2">
              <FadeIn>
                <Badge variant="outline" className="border-primary/30 text-primary">Contact</Badge>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  We are here to help
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Have a question about a loan product or your application? Reach out and our
                  team will respond within 24 hours.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">support@pesacred.co.ke</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Phone className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">+254 700 000 000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">Office</p>
                      <p className="text-sm text-muted-foreground">Westlands, Nairobi, Kenya</p>
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.15}>
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <form onSubmit={handleContact} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="jane@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                          placeholder="How can we help you?"
                        />
                      </div>
                      <Button type="submit" className="w-full gap-2">
                        <MessageCircle className="h-4 w-4" /> Send Message
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
      <ChatWidget />
    </div>
  );
}
