import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Plus, Search, Radio } from 'lucide-react';
import { InputSourceDialog, InputSelection } from '@/components/InputSourceDialog';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { toast } from 'sonner';

interface Profile { id: string; username: string; display_name: string | null }
interface Conversation { id: string; user_a: string; user_b: string; last_message_at: string; other?: Profile }
interface Message { id: string; conversation_id: string; sender_id: string; morse: string; decoded: string; input_source: string; created_at: string }

export default function Chat() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [inputSel, setInputSel] = useState<InputSelection | null>(null);
  const [showInputDialog, setShowInputDialog] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // redirect if not signed in
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  // load profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile));
  }, [user]);

  // load conversations + realtime
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: convos } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (!convos) return;
      const otherIds = convos.map(c => c.user_a === user.id ? c.user_b : c.user_a);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds);
      const enriched = convos.map(c => ({
        ...c,
        other: profiles?.find(p => p.id === (c.user_a === user.id ? c.user_b : c.user_a)) as Profile | undefined,
      }));
      setConversations(enriched);
    };
    load();

    const ch = supabase.channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  // load messages for active conversation + realtime
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeId)
        .order('created_at', { ascending: true });
      setMessages((data as Message[]) ?? []);
    };
    load();
    const ch = supabase.channel(`messages-${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages(m => [...m, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // search users
  useEffect(() => {
    if (!showNewChat || !searchQuery.trim() || !user) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user.id)
        .limit(10);
      setSearchResults((data as Profile[]) ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery, showNewChat, user]);

  const startConversation = async (other: Profile) => {
    if (!user) return;
    const [a, b] = [user.id, other.id].sort();
    const existing = conversations.find(c => c.user_a === a && c.user_b === b);
    if (existing) {
      setActiveId(existing.id);
      setShowNewChat(false);
      return;
    }
    const { data, error } = await supabase.from('conversations').insert({ user_a: a, user_b: b }).select().maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setActiveId(data.id);
      setShowNewChat(false);
      setSearchQuery('');
    }
  };

  const sendMessage = async (morse: string, decoded: string, source: string) => {
    if (!user || !activeId) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId, sender_id: user.id, morse, decoded, input_source: source,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeId);
  };

  const activeConvo = conversations.find(c => c.id === activeId);

  if (authLoading || !user) {
    return <div className="min-h-screen bg-telegraph-bg flex items-center justify-center text-telegraph-muted">Loading…</div>;
  }

  return (
    <div className="h-screen bg-telegraph-bg text-telegraph-text flex flex-col">
      <InputSourceDialog
        open={showInputDialog}
        initial={inputSel?.source}
        onSelect={(sel) => { setInputSel(sel); setShowInputDialog(false); }}
        onClose={inputSel ? () => setShowInputDialog(false) : undefined}
      />

      {/* Header */}
      <header className="border-b border-telegraph-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-telegraph-accent" />
          <div>
            <h1 className="text-sm font-bold tracking-wide">Morse Telegraph</h1>
            <p className="text-[10px] text-telegraph-muted">@{profile?.username ?? '…'}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-telegraph-muted hover:text-telegraph-accent">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-telegraph-border flex flex-col">
          <div className="p-3 border-b border-telegraph-border">
            <Button onClick={() => setShowNewChat(s => !s)} variant="outline" size="sm"
              className="w-full border-telegraph-border text-telegraph-accent hover:bg-telegraph-accent/10">
              <Plus className="h-4 w-4 mr-1" /> New chat
            </Button>
            {showNewChat && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-telegraph-muted" />
                  <Input placeholder="Search by handle…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="pl-7 h-8 text-sm bg-telegraph-bg border-telegraph-border" />
                </div>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {searchResults.map(p => (
                    <button key={p.id} onClick={() => startConversation(p)}
                      className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-telegraph-accent/10 text-telegraph-text">
                      <span className="text-telegraph-accent">@{p.username}</span>
                      {p.display_name && <span className="text-telegraph-muted ml-2 text-xs">{p.display_name}</span>}
                    </button>
                  ))}
                  {searchQuery.trim() && searchResults.length === 0 && (
                    <p className="text-xs text-telegraph-muted px-2">No operators found</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <p className="p-4 text-xs text-telegraph-muted text-center">No conversations yet. Start one above!</p>
            ) : (
              conversations.map(c => (
                <button key={c.id} onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-telegraph-border/50 transition-colors ${
                    activeId === c.id ? 'bg-telegraph-accent/10' : 'hover:bg-telegraph-accent/5'
                  }`}>
                  <div className={`text-sm font-medium ${activeId === c.id ? 'text-telegraph-accent' : 'text-telegraph-text'}`}>
                    @{c.other?.username ?? '…'}
                  </div>
                  <div className="text-[10px] text-telegraph-muted mt-0.5">
                    {new Date(c.last_message_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </aside>

        {/* Thread */}
        <main className="flex-1 flex flex-col min-w-0">
          {activeConvo ? (
            <>
              <div className="px-4 py-2.5 border-b border-telegraph-border">
                <div className="text-sm font-semibold text-telegraph-accent">@{activeConvo.other?.username}</div>
                <div className="text-[10px] text-telegraph-muted">Tap a bubble to flip between Morse and decoded text</div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-telegraph-bg">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-telegraph-muted mt-8">No messages yet — send the first signal ⚡</p>
                ) : (
                  messages.map(m => (
                    <ChatBubble key={m.id}
                      morse={m.morse} decoded={m.decoded}
                      isOwn={m.sender_id === user.id}
                      timestamp={m.created_at}
                      inputSource={m.input_source} />
                  ))
                )}
              </div>
              {inputSel && (
                <MessageComposer selection={inputSel}
                  onChangeInput={() => setShowInputDialog(true)}
                  onSend={sendMessage} />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-telegraph-muted text-sm">
              Select a conversation or start a new one
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
