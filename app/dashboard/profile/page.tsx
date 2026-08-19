'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { User, Lock, CreditCard, FileText, Loader2, Save, Smartphone } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import {
  profileUpdateSchema,
  changePasswordSchema,
  type ProfileUpdateInput,
  type ChangePasswordInput,
} from '@/lib/validations';
import { KENYA_COUNTIES } from '@/lib/constants';
import { initials, formatDateTime } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      county: profile?.county ?? '',
      address: profile?.address ?? '',
      avatar_url: profile?.avatar_url ?? '',
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const onProfileSubmit = async (values: ProfileUpdateInput) => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          phone: values.phone,
          county: values.county || null,
          address: values.address || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordInput) => {
    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: values.current_password,
      });
      if (signInError) {
        toast.error('Current password is incorrect.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: values.new_password });
      if (error) throw error;
      toast.success('Password changed successfully.');
      passwordForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader title="Profile" subtitle="Manage your personal information and account settings." />

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" /> <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" /> <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-2">
            <CreditCard className="h-4 w-4" /> <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" /> <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Info */}
        <TabsContent value="personal">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {profile ? initials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{profile?.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="mt-1 capitalize">{profile?.role}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {KENYA_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 opacity-60">
                    <div className="space-y-2">
                      <Label>National ID</Label>
                      <Input defaultValue={profile?.national_id} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input defaultValue={profile?.date_of_birth} disabled />
                    </div>
                  </div>
                  <Button type="submit" disabled={savingProfile} className="gap-2">
                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change Password */}
        <TabsContent value="password">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl><Input type="password" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={passwordForm.control}
                      name="new_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl><Input type="password" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={savingPassword} className="gap-2">
                    {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Update Password
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Accounts */}
        <TabsContent value="accounts">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Payment Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mobile Money</p>
                  <p className="text-xs text-muted-foreground">{profile?.phone ?? 'No number set'}</p>
                </div>
                <Badge variant="outline">Primary</Badge>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <CreditCard className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Bank Account</p>
                  <p className="text-xs text-muted-foreground">No bank account added</p>
                </div>
                <Button variant="outline" size="sm">Add</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-base">Account Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: 'National ID', date: profile?.created_at },
                  { label: 'Proof of Income', date: null },
                ].map((doc) => (
                  <div key={doc.label} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{doc.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.date ? `Uploaded ${formatDateTime(doc.date)}` : 'Not uploaded'}
                      </p>
                    </div>
                    {doc.date ? <Badge className="bg-emerald-100 text-emerald-700">On File</Badge> : <Button variant="outline" size="sm">Upload</Button>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
