import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Search, ArrowLeft, Phone, Video, MoreHorizontal, Settings2 } from 'lucide-react';
import { InputSourceDialog, InputSelection } from '@/components/InputSourceDialog';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { MainLayout } from '@/components/MainLayout';
import { CallDialog, CallMode } from '@/components/chat/CallDialog';
import { toast } from 'sonner';

interface Profile { id: string; username: string; display_name: string | null }
interface Conversation { id: string; user_a: string; user_b: string; last_message_at: string; other?: Profile }
interface Message { id: string; conversation_id: string; sender_id: string; morse: string; decoded: string; input_source: string; created_at: string }

type Tab = 'open' | 'archived';

const AVATAR_GRADIENTS = [
  'from-pink-400 to-orange-400',
  'from-blue-400 to-purple-400',
  'from-emerald-400 to-teal-400',
  'from-amber-400 to-rose-400',
  'from-indigo-400 to-pink-400',
  'from-cyan-400 to-blue-500',
];

function hashIndex(value: string, length: number) {
  let h = 0;
  for (let i = 0; i < value.length; i++) { h = (h << 5) - h + value.charCodeAt(i); h |= 0; }
  return Math.abs(h) % length;
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const g = AVATAR_GRADIENTS[hashIndex(name, AVATAR_GRADIENTS.length)];
  const initials = name.slice(0, 2).toUpperCase();
  const sz = size === 'sm' ? 'h-9 w-9 text-xs' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-11 w-11 text-sm';
  return (
    <Avatar className={`${sz} bg-gradient-to-br ${g} text-white font-semibold ring-2 ring-white shadow-card`}>
      <span className="grid place-items-center w-full h-full">{initials}</span>
    </Avatar>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [inputSel, setInputSel] = useState<InputSelection | null>(null);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [tab, setTab] = useState<Tab>('open');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [call, setCall] = useState<null | {
    conversationId: string;
    peerId: string;
    peerName: string;
    mode: CallMode;
    role: 'caller' | 'callee';
    remoteOffer?: RTCSessionDescriptionInit;
  }>(null);
  const [incoming, setIncoming] = useState<null | {
    conversationId: string;
    peerId: string;
    peerName: string;
    mode: CallMode;
    offer: RTCSessionDescriptionInit;
  }>(null);

  useEffect(() => { if (!user && !authLoading) navigate('/auth', { replace: true }); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile));
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('morse-input-selection');
    if (saved) {
      try { setInputSel(JSON.parse(saved) as InputSelection); }
      catch { localStorage.removeItem('morse-input-selection'); setShowInputDialog(true); }
    } else { setShowInputDialog(true); }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').neq('id', user.id).order('username').limit(50)
      .then(({ data }) => setAllProfiles((data as Profile[]) ?? []));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: convos } = await supabase.from('conversations').select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      if (!convos) return;
      const otherIds = convos.map(c => c.user_a === user.id ? c.user_b : c.user_a);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', otherIds);
      setConversations(convos.map(c => ({
        ...c,
        other: profiles?.find(p => p.id === (c.user_a === user.id ? c.user_b : c.user_a)) as Profile | undefined,
      })));
    };
    load();
    const channel = supabase.channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    supabase.from('messages').select('*').eq('conversation_id', activeId).order('created_at')
      .then(({ data }) => setMessages((data as Message[]) ?? []));
    const channel = supabase.channel(`messages-${activeId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages(m => [...m, payload.new as Message]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showNewChat || !searchQuery.trim() || !user) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('*')
        .ilike('username', `%${searchQuery.trim()}%`).neq('id', user.id).limit(10);
      setSearchResults((data as Profile[]) ?? []);
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery, showNewChat, user]);

  const startConversation = async (other: Profile) => {
    if (!user) return;
    const [a, b] = [user.id, other.id].sort();
    const existing = conversations.find(c => c.user_a === a && c.user_b === b);
    if (existing) { setActiveId(existing.id); setShowNewChat(false); return; }
    const { data, error } = await supabase.from('conversations').insert({ user_a: a, user_b: b }).select().maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data) { setActiveId(data.id); setShowNewChat(false); setSearchQuery(''); }
  };

  const sendMessage = async (morse: string, decoded: string, source: string) => {
    if (!user || !activeId) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId, sender_id: user.id, morse, decoded, input_source: source,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeId);
  };

  // Listen for incoming calls across all the user's conversations.
  useEffect(() => {
    if (!user || conversations.length === 0) return;
    const channels = conversations.map((c) => {
      const peer = c.other;
      const ch = supabase.channel(`call:${c.id}`, { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'signal' }, ({ payload }) => {
        if (!payload || payload.to !== user.id) return;
        if (payload.type === 'offer' && !call && !incoming) {
          setIncoming({
            conversationId: c.id,
            peerId: payload.from,
            peerName: peer?.display_name || peer?.username || 'Unknown',
            mode: (payload.payload?.mode as CallMode) ?? 'voice',
            offer: payload.payload?.sdp,
          });
        }
      });
      ch.subscribe();
      return ch;
    });
    return () => { channels.forEach((c) => supabase.removeChannel(c)); };
  }, [user, conversations, call, incoming]);

  const startCall = (mode: CallMode) => {
    if (!activeConvo || !activeUser || !user) return;
    setCall({
      conversationId: activeConvo.id,
      peerId: activeUser.id,
      peerName: activeUser.display_name || activeUser.username,
      mode,
      role: 'caller',
    });
  };

  const acceptIncoming = () => {
    if (!incoming) return;
    setCall({
      conversationId: incoming.conversationId,
      peerId: incoming.peerId,
      peerName: incoming.peerName,
      mode: incoming.mode,
      role: 'callee',
      remoteOffer: incoming.offer,
    });
    setIncoming(null);
  };
  const activeConvo = conversations.find(c => c.id === activeId);
  const activeUser = activeConvo?.other;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.other?.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="flex-1 grid place-items-center text-muted-foreground">Loading…</div>
      </MainLayout>
    );
  }

  // Mobile: show thread view full-screen when active, else show list
  const mobileShowThread = activeId !== null;

  return (
    <MainLayout>
      <InputSourceDialog
        open={showInputDialog}
        initial={inputSel?.source}
        onSelect={(sel) => {
          setInputSel(sel); setShowInputDialog(false);
          localStorage.setItem('morse-input-selection', JSON.stringify(sel));
        }}
        onClose={inputSel ? () => setShowInputDialog(false) : undefined}
      />

      <div className="flex-1 min-h-0 p-3 sm:p-5 lg:p-6">
        <div className="h-full grid gap-4 lg:grid-cols-[320px_1fr_280px] xl:grid-cols-[340px_1fr_300px]">

          {/* Conversation list */}
          <section className={`${mobileShowThread ? 'hidden lg:flex' : 'flex'} flex-col gap-3 rounded-3xl bg-white shadow-soft border border-border overflow-hidden`}>
            <div className="p-4 pb-2 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Chat</h2>
              <Button
                size="sm"
                onClick={() => setShowNewChat(s => !s)}
                className="h-9 w-9 p-0 rounded-full bg-gradient-sent text-white shadow-card hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search people, documents…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 rounded-full bg-secondary border-0"
                />
              </div>
            </div>

            <div className="px-4 flex gap-1 bg-secondary/60 mx-4 rounded-full p-1">
              {(['open', 'archived'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 capitalize text-sm font-medium py-2 rounded-full transition ${
                    tab === t ? 'bg-white shadow-card text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {showNewChat && (
                <div className="m-2 rounded-2xl bg-secondary/60 p-2 space-y-2">
                  <p className="text-xs font-semibold px-2 text-muted-foreground uppercase tracking-wider">Start a new chat</p>
                  {(searchQuery.trim() ? searchResults : allProfiles.slice(0, 8)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => startConversation(p)}
                      className="w-full flex items-center gap-3 rounded-xl bg-white p-2 hover:shadow-card transition"
                    >
                      <UserAvatar name={p.username} size="sm" />
                      <div className="text-left">
                        <div className="text-sm font-semibold">@{p.username}</div>
                        <div className="text-xs text-muted-foreground">{p.display_name || 'Operator'}</div>
                      </div>
                    </button>
                  ))}
                  {searchQuery.trim() && searchResults.length === 0 && (
                    <p className="px-2 text-xs text-muted-foreground">No operators found.</p>
                  )}
                </div>
              )}

              {filteredConversations.length === 0 && !showNewChat ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No chats yet. Tap <span className="inline-block align-middle"><Plus className="inline h-3 w-3" /></span> to start one.
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const active = activeId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition text-left ${
                        active ? 'bg-gradient-to-r from-pink-50 to-orange-50 shadow-card' : 'hover:bg-secondary/60'
                      }`}
                    >
                      <UserAvatar name={c.other?.username ?? 'user'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-sm truncate">{c.other?.display_name || `@${c.other?.username}`}</div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">@{c.other?.username}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Thread */}
          <section className={`${mobileShowThread ? 'flex' : 'hidden lg:flex'} flex-col rounded-3xl bg-white shadow-soft border border-border overflow-hidden min-h-0`}>
            {activeConvo ? (
              <>
                <div className="px-4 sm:px-5 py-3 border-b border-border flex items-center gap-3">
                  <button
                    onClick={() => setActiveId(null)}
                    className="lg:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <UserAvatar name={activeUser?.username ?? 'chat'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{activeUser?.display_name || `@${activeUser?.username}`}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle"></span>
                      Active now
                    </div>
                  </div>
                  <button onClick={() => startCall('voice')} className="hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><Phone className="h-4 w-4" /></button>
                  <button onClick={() => startCall('video')} className="hidden sm:grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><Video className="h-4 w-4" /></button>
                  <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary"><MoreHorizontal className="h-4 w-4" /></button>
                </div>

                <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4 bg-gradient-to-b from-white via-secondary/30 to-white">
                  {messages.length === 0 ? (
                    <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
                      <div>
                        <p>No messages yet.</p>
                        <p className="mt-1 text-xs">Tap the key, talk, or type below to begin.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <ChatBubble
                        key={m.id}
                        morse={m.morse}
                        decoded={m.decoded}
                        isOwn={m.sender_id === user.id}
                        timestamp={m.created_at}
                        inputSource={m.input_source}
                      />
                    ))
                  )}
                </div>

                {inputSel && (
                  <div className="p-3 sm:p-4 border-t border-border bg-white">
                    <MessageComposer
                      selection={inputSel}
                      onChangeInput={() => setShowInputDialog(true)}
                      onSend={sendMessage}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 grid place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-sent grid place-items-center text-white shadow-soft">
                    <Plus className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold">Pick a conversation</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Select an operator from the list, or start a new chat to begin sending Morse signals.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Right info panel */}
          <aside className="hidden lg:flex flex-col gap-4 rounded-3xl bg-white shadow-soft border border-border p-5 overflow-y-auto">
            {activeUser ? (
              <>
                <div className="flex flex-col items-center text-center gap-3">
                  <UserAvatar name={activeUser.username} size="lg" />
                  <div>
                    <div className="font-semibold">{activeUser.display_name || `@${activeUser.username}`}</div>
                    <div className="text-xs text-muted-foreground">@{activeUser.username}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="rounded-2xl bg-secondary py-3 grid place-items-center hover:bg-secondary/70 transition">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="rounded-2xl bg-secondary py-3 grid place-items-center hover:bg-secondary/70 transition">
                    <Video className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowInputDialog(true)}
                    className="rounded-2xl bg-gradient-sent text-white py-3 grid place-items-center hover:opacity-90 transition"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-2xl bg-secondary/60 p-4 text-xs space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Messages</span><span className="font-semibold">{messages.length}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Input</span><span className="font-semibold uppercase">{inputSel?.source ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-semibold">{activeConvo ? new Date(activeConvo.last_message_at).toLocaleDateString() : '—'}</span></div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground text-center">
                <p className="font-semibold text-foreground mb-2">Hello {profile?.display_name || profile?.username || 'operator'} 👋</p>
                <p>Select a conversation to see contact details, shared files, and recent activity here.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
