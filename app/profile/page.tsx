'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { ReferralSection } from '@/components/referral-section';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Edit3,
  Save,
  X,
  Shield,
  FileText,
  Activity,
  Camera,
  Upload
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface UserStats {
  templates_created: number;
  documents_generated: number;
  last_activity: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    phone: '',
    website: ''
  });

  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Use getSession() for rate limit avoidance (reads from local cache)
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;

      if (!authUser) {
        router.push('/auth/signin');
        return;
      }

      // Set user profile data
      const userProfile: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || '',
        avatar_url: authUser.user_metadata?.avatar_url || '',
        bio: authUser.user_metadata?.bio || '',
        location: authUser.user_metadata?.location || '',
        phone: authUser.user_metadata?.phone || '',
        website: authUser.user_metadata?.website || '',
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at || undefined
      };

      setUser(userProfile);
      setFormData({
        name: userProfile.name || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        phone: userProfile.phone || '',
        website: userProfile.website || ''
      });

      // Load real user statistics from database with error handling
      let templatesCount = 0;
      let documentsCount = 0;
      let lastActivity = authUser.created_at;

      try {
        // Try to get templates count
        const templatesResult = await supabase
          .from('templates')
          .select('id')
          .eq('user_id', authUser.id);

        templatesCount = templatesResult.data?.length || 0;
      } catch (error) {
        console.warn('Templates table not found or accessible:', error);
      }

      try {
        // Try to get documents count and last activity
        const documentsResult = await supabase
          .from('documents')
          .select('id, created_at')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(1);

        documentsCount = documentsResult.data?.length || 0;
        lastActivity = documentsResult.data?.[0]?.created_at || authUser.created_at;
      } catch (error) {
        console.warn('Documents table not found or accessible:', error);
      }

      setStats({
        templates_created: templatesCount,
        documents_generated: documentsCount,
        last_activity: lastActivity
      });

    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, GIF, or WebP image',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Remove avatars/ prefix since we're already in the avatars bucket

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        // Handle specific bucket not found error
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact support or check the setup guide.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata with new avatar URL
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl
        }
      });

      if (updateError) throw updateError;

      // Update local state
      setUser(prev => prev ? { ...prev, avatar_url: publicUrl } : null);

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully'
      });

    } catch (error: any) {
      console.error('Error uploading avatar:', error);

      let errorMessage = 'Failed to upload profile picture';

      if (error.message?.includes('Storage bucket not configured')) {
        errorMessage = 'Profile picture upload is not configured yet. Please check the setup guide.';
      } else if (error.message?.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please create the "avatars" bucket in Supabase Storage.';
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          bio: formData.bio,
          location: formData.location,
          phone: formData.phone,
          website: formData.website
        }
      });

      if (error) throw error;

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website
      } : null);

      setEditing(false);
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;

    setFormData({
      name: user.name || '',
      bio: user.bio || '',
      location: user.location || '',
      phone: user.phone || '',
      website: user.website || ''
    });
    setEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div>
        <SiteHeader />
        <div className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <div className="h-64 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <SiteHeader />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <p>Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Main Profile Card */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                        <AvatarFallback className="text-lg">
                          {user.name ? getInitials(user.name) : <User className="h-8 w-8" />}
                        </AvatarFallback>
                      </Avatar>
                      {editing && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{user.name || 'Anonymous User'}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Mail className="mr-2 h-4 w-4" />
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        {editing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {user.name || 'Not provided'}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        {editing ? (
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground flex items-center">
                            {user.phone ? (
                              <>
                                <Phone className="mr-2 h-4 w-4" />
                                {user.phone}
                              </>
                            ) : (
                              'Not provided'
                            )}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        {editing ? (
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Enter your location"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground flex items-center">
                            {user.location ? (
                              <>
                                <MapPin className="mr-2 h-4 w-4" />
                                {user.location}
                              </>
                            ) : (
                              'Not provided'
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="website">Website</Label>
                      {editing ? (
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="Enter your website URL"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground flex items-center">
                          {user.website ? (
                            <>
                              <Globe className="mr-2 h-4 w-4" />
                              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {user.website}
                              </a>
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    {editing ? (
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {user.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Templates Created</span>
                    <Badge variant="secondary">{stats?.templates_created || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Documents Generated</span>
                    <Badge variant="secondary">{stats?.documents_generated || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Referral Program */}
              <ReferralSection />

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Account Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Member Since</Label>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  {user.last_sign_in_at && (
                    <div>
                      <Label className="text-sm font-medium">Last Sign In</Label>
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <Calendar className="mr-2 h-4 w-4" />
                        {formatDate(user.last_sign_in_at)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/templates')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Browse Templates
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/resume')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Resume
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/settings')}>
                    <Shield className="mr-2 h-4 w-4" />
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
