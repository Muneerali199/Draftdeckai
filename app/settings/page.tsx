'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useTheme } from 'next-themes';
import { useUsageStats } from '@/hooks/use-usage-stats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Sparkles, Zap, Sun, Moon, Laptop, BarChart3, FileText, Layout, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { 
    documentsCreated, 
    templatesUsed, 
    templatesCreated, 
    successRate, 
    loading: statsLoading, 
    error: statsError 
  } = useUsageStats();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug theme changes
  useEffect(() => {
    if (mounted) {
      console.log('Theme changed:', { theme, resolvedTheme });
      console.log('HTML classes:', document.documentElement.className);
    }
  }, [theme, resolvedTheme, mounted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-500 border-t-transparent"></div>
          <span className="font-medium">Loading your settings...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center">
            <div className="p-8 rounded-3xl border">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  Access Your Settings
                </h1>
                <p className="text-muted-foreground">
                  Sign in to manage your profile, preferences, and account settings
                </p>
              </div>
              <Button 
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-gradient-to-r from-yellow-400 to-blue-600 text-white font-semibold"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-2" />
                Sign In to DraftDeckAI
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4">
            <Settings className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Account Settings</span>
            <Sparkles className="h-4 w-4 text-blue-500" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Your <span className="bg-gradient-to-r from-yellow-400 to-blue-600 bg-clip-text text-transparent">DraftDeckAI</span> Account
          </h1>
          <p className="text-muted-foreground">
            Manage your profile, subscription, and preferences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Welcome, {user.email}!</p>
              <p className="text-sm text-muted-foreground">
                Member since: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme</label>
                  {!mounted ? (
                    <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <div className="space-y-3">
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            <div className="flex items-center gap-2">
                              <Sun className="h-4 w-4" />
                              Light
                            </div>
                          </SelectItem>
                          <SelectItem value="dark">
                            <div className="flex items-center gap-2">
                              <Moon className="h-4 w-4" />
                              Dark
                            </div>
                          </SelectItem>
                          <SelectItem value="system">
                            <div className="flex items-center gap-2">
                              <Laptop className="h-4 w-4" />
                              System
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {/* Debug info */}
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <div>Current theme: <span className="font-mono">{theme}</span></div>
                        <div>Resolved theme: <span className="font-mono">{resolvedTheme}</span></div>
                        <div>HTML has dark class: <span className="font-mono">{document?.documentElement?.classList?.contains('dark') ? 'Yes' : 'No'}</span></div>
                      </div>
                      
                      {/* Alternative theme buttons for testing */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={theme === 'light' ? 'default' : 'outline'}
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="h-4 w-4 mr-1" />
                          Light
                        </Button>
                        <Button 
                          size="sm" 
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="h-4 w-4 mr-1" />
                          Dark
                        </Button>
                        <Button 
                          size="sm" 
                          variant={theme === 'system' ? 'default' : 'outline'}
                          onClick={() => setTheme('system')}
                        >
                          <Laptop className="h-4 w-4 mr-1" />
                          System
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Theme changes apply immediately across the entire application
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-muted-foreground">5 documents per month</p>
                </div>
                <Button className="bg-gradient-to-r from-yellow-400 to-blue-600 text-white">
                  Upgrade to Pro
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center p-4 border rounded-lg">
                      <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : statsError ? (
                <div className="text-center p-4 text-muted-foreground">
                  <p className="text-sm">Unable to load usage statistics</p>
                  <p className="text-xs mt-1">{statsError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <div className="text-2xl font-bold text-blue-600">{documentsCreated}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Documents Created</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center mb-2">
                      <Layout className="h-5 w-5 text-green-600 mr-2" />
                      <div className="text-2xl font-bold text-green-600">{templatesUsed}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Templates Used</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                      <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              )}
              {templatesCreated > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Templates Created by You</span>
                    <span className="font-medium text-orange-600">{templatesCreated}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to Home */}
          <div className="text-center">
            <Button
              onClick={() => router.push('/')}
              variant="outline"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}