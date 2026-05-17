import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Plus, Search, Radio, Menu, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { InputSourceDialog, InputSelection } from '@/components/InputSourceDialog';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { Avatar } from '@/components/chat/Avatar';
import { toast } from 'sonner';

interface Profile { id: string; username: string; display_name: string | null }
interface Conversation {
  id: string; user_a: string; user_b: string; last_message_at: string;
  other?: Profile; lastPreview?: string;
}
interface Message {
  id: string; conversation_id: string; sender_id: string;
  morse: string; decoded: string; input_source: string; created_at: string;
}

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
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile));
  }, [user]);

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
      setMobileShowThread(true);
      return;
    }
    const { data, error } = await supabase.from('conversations').insert({ user_a: a, user_b: b }).select().maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setActiveId(data.id);
      setShowNewChat(false);
      setSearchQuery('');
      setMobileShowThread(true);
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
    return (
      <div className="min-h-screen bg-gradient-app flex items-center justify-center text-telegraph-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-app text-telegraph-text flex overflow-hidden">
      <InputSourceDialog
        open={showInputDialog}
        initial={inputSel?.source}
        onSelect={(sel) => { setInputSel(sel); setShowInputDialog(false); }}
        onClose={inputSel ? () => setShowInputDialog(false) : undefined}
      />

      {/* Sidebar */}
      <aside className={`${mobileShowThread ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-telegraph-border/60 bg-telegraph-bg/40 backdrop-blur-xl`}>
        {/* Sidebar header */}
        <header className="px-4 py-4 flex items-center justify-between">
          <button className="text-telegraph-muted hover:text-telegraph-text transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-telegraph-accent" />
            <h1 className="text-base font-semibold tracking-wide">Messages</h1>
          </div>
          <button
            onClick={() => setShowNewChat(s => !s)}
            className="text-telegraph-muted hover:text-telegraph-accent transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
        </header>

        {/* New chat / search */}
        {showNewChat && (
          <div className="px-4 pb-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-telegraph-muted" />
              <Input
                placeholder="Search operators by handle…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full bg-telegraph-surface border-telegraph-border text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1 max-h-56 overflow-auto">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => startConversation(p)}
                  className="w-full text-left px-2 py-2 rounded-xl hover:bg-telegraph-surface flex items-center gap-3 transition-colors"
                >
                  <Avatar name={p.username} size={36} />
                  <div>
                    <div className="text-sm font-medium text-telegraph-text">@{p.username}</div>
                    {p.display_name && <div className="text-xs text-telegraph-muted">{p.display_name}</div>}
                  </div>
                </button>
              ))}
              {searchQuery.trim() && searchResults.length === 0 && (
                <p className="text-xs text-telegraph-muted px-2 py-2">No operators found</p>
              )}
            </div>
          </div>
        )}

        {/* Conversation list */}
        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-telegraph-muted">No conversations yet.</p>
              <Button
                onClick={() => setShowNewChat(true)}
                variant="ghost"
                className="mt-3 text-telegraph-accent hover:text-telegraph-accent-2"
              >
                Start your first chat
              </Button>
            </div>
          ) : (
            <div className="px-2 pb-24">
              {conversations.map(c => {
                const active = activeId === c.id;
                const username = c.other?.username ?? '…';
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveId(c.id); setMobileShowThread(true); }}
                    className={`w-full text-left px-3 py-3 rounded-2xl mb-1 flex items-center gap-3 transition-all ${
                      active
                        ? 'bg-telegraph-surface shadow-soft'
                        : 'hover:bg-telegraph-surface/60'
                    }`}
                  >
                    <Avatar name={username} size={44} online />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className={`text-sm font-semibold truncate ${active ? 'text-telegraph-text' : 'text-telegraph-text'}`}>
                          {c.other?.display_name || `@${username}`}
                        </div>
                        <div className="text-[10px] text-telegraph-muted whitespace-nowrap">
                          {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-xs text-telegraph-muted truncate mt-0.5">
                        @{username} · Tap to telegraph
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Sidebar footer / current user */}
        <div className="px-4 py-3 border-t border-telegraph-border/60 flex items-center gap-3 bg-telegraph-bg/40">
          <Avatar name={profile?.username ?? '?'} size={38} online />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{profile?.display_name || profile?.username || '…'}</div>
            <div className="text-[11px] text-telegraph-muted truncate">@{profile?.username}</div>
          </div>
          <button
            onClick={() => setShowNewChat(true)}
            className="h-9 w-9 rounded-full bg-gradient-sent flex items-center justify-center shadow-bubble hover:opacity-90 transition-opacity"
            title="New chat"
          >
            <Plus className="h-4 w-4 text-white" />
          </button>
          <button
            onClick={signOut}
            className="text-telegraph-muted hover:text-telegraph-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Thread */}
      <main className={`${mobileShowThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
        {activeConvo ? (
          <>
            {/* Thread header */}
            <header className="px-4 py-3 flex items-center gap-3 border-b border-telegraph-border/60 bg-telegraph-bg/40 backdrop-blur-xl">
              <button
                onClick={() => setMobileShowThread(false)}
                className="md:hidden text-telegraph-muted hover:text-telegraph-text"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar name={activeConvo.other?.username ?? '?'} size={40} online />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {activeConvo.other?.display_name || `@${activeConvo.other?.username}`}
                </div>
                <div className="text-[11px] text-telegraph-online flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-telegraph-online" /> Online
                </div>
              </div>
              <button className="text-telegraph-muted hover:text-telegraph-accent transition-colors p-2">
                <Video className="h-4 w-4" />
              </button>
              <button className="text-telegraph-muted hover:text-telegraph-accent transition-colors p-2">
                <Phone className="h-4 w-4" />
              </button>
              <button className="text-telegraph-muted hover:text-telegraph-accent transition-colors p-2">
                <MoreVertical className="h-4 w-4" />
              </button>
            </header>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-sent flex items-center justify-center shadow-bubble mb-4">
                    <Radio className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-sm text-telegraph-text font-medium">
                    Send the first signal
                  </p>
                  <p className="text-xs text-telegraph-muted mt-1">
                    Tap a bubble after sending to flip between Morse and decoded text
                  </p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const showAvatar = !prev || prev.sender_id !== m.sender_id;
                  return (
                    <ChatBubble
                      key={m.id}
                      morse={m.morse}
                      decoded={m.decoded}
                      isOwn={m.sender_id === user.id}
                      timestamp={m.created_at}
                      inputSource={m.input_source}
                      senderName={activeConvo.other?.username}
                      showAvatar={showAvatar}
                    />
                  );
                })
              )}
            </div>

            {inputSel && (
              <MessageComposer
                selection={inputSel}
                onChangeInput={() => setShowInputDialog(true)}
                onSend={sendMessage}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="h-20 w-20 rounded-full bg-gradient-sent flex items-center justify-center shadow-bubble mb-5">
              <Radio className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-telegraph-text">Morse Telegraph</h2>
            <p className="text-sm text-telegraph-muted mt-2 max-w-sm">
              Select a conversation from the left, or start a new one to begin telegraphing.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
