'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  FileEdit,
  Save,
  Loader2,
  Home,
  HelpCircle,
  FileText,
  Shield,
  Phone,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSettings, useSaveSetting, type AdminSetting } from '@/hooks/use-admin';

type SettingKey = 'homepage' | 'faq' | 'terms' | 'privacy' | 'contact';

const tabs: { key: SettingKey; label: string; icon: React.ElementType }[] = [
  { key: 'homepage', label: 'Homepage', icon: Home },
  { key: 'faq', label: 'FAQ', icon: HelpCircle },
  { key: 'terms', label: 'Terms', icon: FileText },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'contact', label: 'Contact', icon: Phone },
];

interface HomePageContent { heroTitle: string; heroSubtitle: string; ctaText: string; }
interface FaqContent { items: { q: string; a: string }[]; }
interface TermsContent { content: string; }
interface PrivacyContent { content: string; }
interface ContactContent { email: string; phone: string; address: string; hours: string; }

export default function AdminCMSPage() {
  const { data, isLoading } = useAdminSettings();
  const saveSetting = useSaveSetting();
  const settings: AdminSetting[] = data ?? [];
  const [activeTab, setActiveTab] = useState<SettingKey>('homepage');

  const [homepage, setHomepage] = useState<HomePageContent>({ heroTitle: '', heroSubtitle: '', ctaText: '' });
  const [faq, setFaq] = useState<FaqContent>({ items: [] });
  const [terms, setTerms] = useState<TermsContent>({ content: '' });
  const [privacy, setPrivacy] = useState<PrivacyContent>({ content: '' });
  const [contact, setContact] = useState<ContactContent>({ email: '', phone: '', address: '', hours: '' });

  useEffect(() => {
    if (!settings) return;
    const get = (key: string) => settings.find((s) => s.key === key)?.value as Record<string, unknown> | undefined;
    const hp = get('homepage');
    if (hp) setHomepage({ heroTitle: String(hp.heroTitle ?? ''), heroSubtitle: String(hp.heroSubtitle ?? ''), ctaText: String(hp.ctaText ?? '') });
    const fq = get('faq');
    if (fq && Array.isArray(fq.items)) setFaq({ items: fq.items as { q: string; a: string }[] });
    const tm = get('terms');
    if (tm) setTerms({ content: String(tm.content ?? '') });
    const pv = get('privacy');
    if (pv) setPrivacy({ content: String(pv.content ?? '') });
    const ct = get('contact');
    if (ct) setContact({ email: String(ct.email ?? ''), phone: String(ct.phone ?? ''), address: String(ct.address ?? ''), hours: String(ct.hours ?? '') });
  }, [settings]);

  const handleSave = (key: SettingKey, value: object) => {
    saveSetting.mutate(
      { key, value: value as Record<string, unknown> },
      {
        onSuccess: () => toast.success(`${tabs.find((t) => t.key === key)?.label} content saved.`),
        onError: (err) => toast.error(err.message || 'Failed to save.'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Content Management" subtitle="Edit public-facing content and legal pages." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Content Management" subtitle="Edit public-facing content and legal pages." />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingKey)}>
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
              <tab.icon className="h-4 w-4" /> <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Homepage */}
        <TabsContent value="homepage">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Homepage Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hero Title</Label>
                <Input value={homepage.heroTitle} onChange={(e) => setHomepage((p) => ({ ...p, heroTitle: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Hero Subtitle</Label>
                <Textarea rows={3} value={homepage.heroSubtitle} onChange={(e) => setHomepage((p) => ({ ...p, heroSubtitle: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input value={homepage.ctaText} onChange={(e) => setHomepage((p) => ({ ...p, ctaText: e.target.value }))} />
              </div>
              <Button onClick={() => handleSave('homepage', homepage)} disabled={saveSetting.isPending} className="gap-2">
                {saveSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">FAQ Items</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setFaq((p) => ({ items: [...p.items, { q: '', a: '' }] }))}>
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {faq.items.map((item, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Input placeholder="Question" value={item.q} onChange={(e) => {
                      const items = [...faq.items]; items[i] = { ...items[i], q: e.target.value }; setFaq({ items });
                    }} />
                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => {
                      setFaq({ items: faq.items.filter((_, idx) => idx !== i) });
                    }}>
                      <FileEdit className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea rows={2} placeholder="Answer" value={item.a} onChange={(e) => {
                    const items = [...faq.items]; items[i] = { ...items[i], a: e.target.value }; setFaq({ items });
                  }} />
                </div>
              ))}
              {faq.items.length === 0 && <p className="text-sm text-muted-foreground">No FAQ items. Click &ldquo;Add Item&rdquo; to create one.</p>}
              <Button onClick={() => handleSave('faq', faq)} disabled={saveSetting.isPending} className="gap-2">
                {saveSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terms */}
        <TabsContent value="terms">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Terms of Service</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea rows={10} value={terms.content} onChange={(e) => setTerms({ content: e.target.value })} />
              <Button onClick={() => handleSave('terms', terms)} disabled={saveSetting.isPending} className="gap-2">
                {saveSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Privacy Policy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea rows={10} value={privacy.content} onChange={(e) => setPrivacy({ content: e.target.value })} />
              <Button onClick={() => handleSave('privacy', privacy)} disabled={saveSetting.isPending} className="gap-2">
                {saveSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact">
          <Card className="shadow-soft">
            <CardHeader><CardTitle className="text-base">Contact Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={contact.address} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Business Hours</Label>
                <Input value={contact.hours} onChange={(e) => setContact((p) => ({ ...p, hours: e.target.value }))} />
              </div>
              <Button onClick={() => handleSave('contact', contact)} disabled={saveSetting.isPending} className="gap-2">
                {saveSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
