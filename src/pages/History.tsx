import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MainLayout } from '@/components/MainLayout';
import { Copy, Check, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  morse: string;
  decoded: string;
  input_source: string;
  created_at: string;
  sender_id: string;
  conversation_id: string;
}

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
}

export default function History() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<(Message & { senderProfile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadMessages();
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_id
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set((msgs || []).map(m => m.sender_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);

      if (profileError) throw profileError;

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, Profile>);

      const enriched = (msgs || []).map(m => ({
        ...m,
        senderProfile: profileMap[m.sender_id],
      }));

      setMessages(enriched);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (morse: string, id: string) => {
    navigator.clipboard.writeText(morse);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (!error) {
      setMessages(messages.filter(m => m.id !== id));
    }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'Source', 'Morse', 'Decoded'].join(','),
      ...messages.map(m =>
        [
          new Date(m.created_at).toISOString(),
          m.input_source,
          `"${m.morse}"`,
          `"${m.decoded}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morse-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const inputSources = [...new Set(messages.map(m => m.input_source))];
  const filteredMessages = messages.filter(m => {
    if (filterSource && m.input_source !== filterSource) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        m.morse.toLowerCase().includes(query) ||
        m.decoded.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <MainLayout>
      <ScrollArea className="flex-1">
        <div className="min-h-screen bg-telegraph-bg text-telegraph-text">
          {/* Header */}
          <header className="border-b border-telegraph-border px-4 py-6 bg-telegraph-card">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-telegraph-text">
              📜 Message History
            </h1>
            <p className="text-sm text-telegraph-muted mt-1">View and manage your sent messages</p>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-telegraph-muted mb-1">Total Messages</p>
                  <p className="text-2xl font-bold text-telegraph-accent">{messages.length}</p>
                </CardContent>
              </Card>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-telegraph-muted mb-1">This Week</p>
                  <p className="text-2xl font-bold text-telegraph-accent">
                    {messages.filter(m => {
                      const date = new Date(m.created_at);
                      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                      return date > weekAgo;
                    }).length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6 text-center">
                  <p className="text-xs text-telegraph-muted mb-1">Input Sources</p>
                  <p className="text-2xl font-bold text-telegraph-accent">{inputSources.length}</p>
                </CardContent>
              </Card>
              <Card className="border-telegraph-border bg-telegraph-card">
                <CardContent className="pt-6">
                  <Button
                    onClick={handleExport}
                    size="sm"
                    className="w-full bg-telegraph-accent text-telegraph-bg hover:bg-telegraph-accent/90"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="border-telegraph-border bg-telegraph-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Search & Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-telegraph-bg border-telegraph-border text-telegraph-text placeholder-telegraph-muted"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterSource === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterSource(null)}
                    className={filterSource === null
                      ? 'bg-telegraph-accent text-telegraph-bg'
                      : 'border-telegraph-border text-telegraph-muted'
                    }
                  >
                    All
                  </Button>
                  {inputSources.map(source => (
                    <Button
                      key={source}
                      variant={filterSource === source ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterSource(source)}
                      className={filterSource === source
                        ? 'bg-telegraph-accent text-telegraph-bg'
                        : 'border-telegraph-border text-telegraph-muted'
                      }
                    >
                      {source}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Messages list */}
            {loading ? (
              <div className="text-center py-12 text-telegraph-muted">Loading messages...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-telegraph-muted">
                {searchQuery || filterSource ? 'No messages match your filters' : 'No messages yet'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMessages.map(msg => (
                  <Card key={msg.id} className="border-telegraph-border bg-telegraph-card hover:border-telegraph-accent/30 transition-colors">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 rounded bg-telegraph-accent/10 text-telegraph-accent font-mono">
                                {msg.input_source}
                              </span>
                              <span className="text-xs text-telegraph-muted">
                                {format(new Date(msg.created_at), 'MMM dd, yyyy HH:mm:ss')}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(msg.id)}
                            className="text-telegraph-muted hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Morse code */}
                        <div>
                          <p className="text-xs text-telegraph-muted mb-1">Morse</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 rounded bg-telegraph-bg border border-telegraph-border font-mono text-sm text-telegraph-accent break-all">
                              {msg.morse}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopy(msg.morse, msg.id)}
                              className="h-8 w-8 text-telegraph-muted hover:text-telegraph-accent"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Decoded */}
                        <div>
                          <p className="text-xs text-telegraph-muted mb-1">Decoded</p>
                          <p className="p-2 rounded bg-telegraph-bg border border-telegraph-border text-telegraph-text break-all">
                            {msg.decoded}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </ScrollArea>
    </MainLayout>
  );
}
