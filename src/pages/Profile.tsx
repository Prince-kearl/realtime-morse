import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/MainLayout';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy, Check, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName || null })
        .eq('id', user.id);

      if (error) throw error;
      setProfile(profile ? { ...profile, display_name: displayName || null } : null);
      setEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center flex-1 text-telegraph-muted">
          Loading...
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollArea className="flex-1">
        <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
          {/* Header */}
          <header className="border-b border-telegraph-border px-4 py-6 bg-telegraph-card">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
              👤 Profile
            </h1>
            <p className="text-sm text-telegraph-muted mt-1">Manage your account information</p>
          </header>

          <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
            {/* Profile card */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Username */}
                <div>
                  <label className="text-xs text-telegraph-muted block mb-2">Username</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={profile?.username || ''}
                      className="bg-telegraph-bg border-telegraph-border text-telegraph-text"
                    />
                  </div>
                  <p className="text-xs text-telegraph-muted mt-1">Your unique identifier in morse telegraph</p>
                </div>

                {/* Display name */}
                <div>
                  <label className="text-xs text-telegraph-muted block mb-2">Display Name</label>
                  {editing ? (
                    <Input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Enter display name"
                      className="bg-telegraph-bg border-telegraph-border text-telegraph-text"
                    />
                  ) : (
                    <Input
                      readOnly
                      value={displayName || 'Not set'}
                      className="bg-telegraph-bg border-telegraph-border text-telegraph-text"
                    />
                  )}
                  <p className="text-xs text-telegraph-muted mt-1">How others see your name</p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs text-telegraph-muted block mb-2">Email</label>
                  <Input
                    readOnly
                    value={user?.email || ''}
                    className="bg-telegraph-bg border-telegraph-border text-telegraph-text"
                  />
                </div>

                {/* Joined date */}
                {profile?.created_at && (
                  <div>
                    <label className="text-xs text-telegraph-muted block mb-2">Joined</label>
                    <Input
                      readOnly
                      value={new Date(profile.created_at).toLocaleDateString()}
                      className="bg-telegraph-bg border-telegraph-border text-telegraph-text"
                    />
                  </div>
                )}

                {/* Edit button */}
                {!editing ? (
                  <Button
                    onClick={() => setEditing(true)}
                    className="w-full bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="flex-1 bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditing(false);
                        setDisplayName(profile?.display_name || '');
                      }}
                      variant="outline"
                      className="flex-1 border-telegraph-border text-telegraph-muted hover:text-telegraph-accent"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User ID card */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm">User ID</CardTitle>
                <CardDescription className="text-xs">For developer reference</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 rounded bg-telegraph-bg border border-telegraph-border font-mono text-xs text-telegraph-accent break-all">
                    {user?.id}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyUserId}
                    className="border-telegraph-border text-telegraph-muted hover:text-telegraph-accent"
                  >
                    {copiedUserId ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-red-500/20 bg-telegraph-card">
              <CardHeader>
                <CardTitle className="text-sm text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="border-telegraph-border/50 bg-telegraph-card/50">
              <CardContent className="pt-6 text-xs text-telegraph-muted space-y-2">
                <p>• Your morse telegraph account is linked to your Supabase auth account</p>
                <p>• Changes to your profile are immediately reflected across all morse telegraph services</p>
                <p>• Sign out from any device will clear your local session</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </ScrollArea>
    </MainLayout>
  );
}
