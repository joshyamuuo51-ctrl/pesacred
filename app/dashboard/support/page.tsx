'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  LifeBuoy,
  MessageCircle,
  Mail,
  Phone,
  Send,
  Loader2,
  Plus,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useMyTickets, useCreateTicket } from '@/hooks/use-data';
import type { SupportTicket } from '@/types/database';
import { supportTicketSchema, type SupportTicketInput } from '@/lib/validations';
import { formatRelativeTime, ticketStatusLabel } from '@/lib/utils';
import type { TicketStatus } from '@/types/database';

const faqs = [
  { q: 'How do I check my loan status?', a: 'Go to My Loans in your dashboard to see the real-time status of all your applications.' },
  { q: 'How long does support take to respond?', a: 'We typically respond within 24 hours during business days.' },
  { q: 'Can I cancel my application?', a: 'Yes, you can cancel your application from the fee disclosure page or by contacting support before it is approved.' },
  { q: 'How do I update my phone number?', a: 'Go to Profile > Personal Information to update your contact details.' },
];

const ticketStatusColor: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-700',
  responded: 'bg-blue-100 text-blue-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-muted text-muted-foreground',
};

export default function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading } = useMyTickets();
  const tickets: SupportTicket[] = data ?? [];
  const createTicket = useCreateTicket();
  const [open, setOpen] = useState(false);

  const startChat = () => {
    if (searchParams.get('chat') === 'open') return;
    router.push('/dashboard/support?chat=open');
  };

  const form = useForm<SupportTicketInput>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: { subject: '', message: '' },
  });

  const onSubmit = (values: SupportTicketInput) => {
    createTicket.mutate(values, {
      onSuccess: () => {
        toast.success('Support ticket created. We will respond within 24 hours.');
        form.reset();
        setOpen(false);
      },
      onError: (err) => toast.error(err.message || 'Failed to create ticket.'),
    });
  };

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Support"
        subtitle="Get help with your account, applications, or payments."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl><Input {...field} placeholder="Brief description of your issue" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl><Textarea rows={4} {...field} placeholder="Describe your issue in detail" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createTicket.isPending} className="w-full gap-2">
                    {createTicket.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Submit Ticket
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Contact methods + live chat */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold">Live Chat</h3>
            <p className="mt-1 text-sm text-muted-foreground">Chat with our support team in real time.</p>
            <Button variant="outline" className="mt-3 w-full gap-2" onClick={startChat}>
              <MessageSquare className="h-4 w-4" /> Start Chat
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">Available Mon-Fri 8am-6pm</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold">Email Us</h3>
            <p className="mt-1 text-sm text-muted-foreground">support@pesacred.co.ke</p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <a href="mailto:support@pesacred.co.ke">Send Email</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="h-5 w-5" />
            </span>
            <h3 className="mt-3 font-semibold">Call Us</h3>
            <p className="mt-1 text-sm text-muted-foreground">+254 700 000 000</p>
            <Button asChild variant="outline" className="mt-3 w-full">
              <a href="tel:+254700000000">Call Now</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tickets */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Your Support Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : tickets && tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{ticket.subject}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{ticket.message}</p>
                    {ticket.response && (
                      <div className="mt-3 rounded-lg bg-primary/5 p-3">
                        <p className="text-xs font-medium text-primary">Support Response</p>
                        <p className="mt-1 text-sm text-foreground">{ticket.response}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={ticketStatusColor[ticket.status as TicketStatus]}>
                      {ticketStatusLabel(ticket.status as TicketStatus)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(ticket.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <LifeBuoy className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No support tickets yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-sm hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
