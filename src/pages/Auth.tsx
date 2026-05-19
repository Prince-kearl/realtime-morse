import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) navigate('/', { replace: true }); }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
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
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-border shadow-soft p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-sent grid place-items-center text-white shadow-card">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Morse Telegraph</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'signin' ? 'Sign in to send signals' : 'Create your operator account'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-1.5">
              <Label htmlFor="username">Operator handle</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="morse_op" required className="h-11 rounded-full bg-secondary border-0 px-4" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="h-11 rounded-full bg-secondary border-0 px-4" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              required className="h-11 rounded-full bg-secondary border-0 px-4" />
          </div>
          <Button type="submit" disabled={busy}
            className="w-full h-11 rounded-full bg-gradient-sent text-white hover:opacity-90 shadow-card">
            {busy ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <button type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-sm text-muted-foreground hover:text-primary transition">
          {mode === 'signin' ? "No account? Sign up" : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
