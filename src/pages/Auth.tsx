import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: username || email.split('@')[0], display_name: username || email.split('@')[0] },
          },
        });
        if (error) throw error;
        toast.success('Account created. You can start telegraphing!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-telegraph-bg text-telegraph-text flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-telegraph-border bg-telegraph-card">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">⚡ Morse Telegraph</h1>
            <p className="text-sm text-telegraph-muted">
              {mode === 'signin' ? 'Sign in to start sending signals' : 'Create your operator account'}
            </p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Operator handle</Label>
                <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="morse_op" required
                  className="bg-telegraph-bg border-telegraph-border" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="bg-telegraph-bg border-telegraph-border" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required
                className="bg-telegraph-bg border-telegraph-border" />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90">
              {busy ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="w-full text-sm text-telegraph-muted hover:text-telegraph-accent"
          >
            {mode === 'signin' ? "No account? Sign up" : 'Have an account? Sign in'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
