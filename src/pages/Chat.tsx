import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { MessageSquarePlus, Search, ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { InputSourceDialog, InputSelection } from '@/components/InputSourceDialog';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { MainLayout } from '@/components/MainLayout';
import { CallDialog, CallMode } from '@/components/chat/CallDialog';
import { toast } from 'sonner';

interface Profile { id: string; username: string; display_name: string | null }
interface Conversation { id: string; user_a: string; user_b: string; last_message_at: string; other?: Profile }
interface Message { id: string; conversation_id: string; sender_id: string; morse: string; decoded: string; input_source: string; created_at: string }

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-sky-500', 'bg-violet-500',
  'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500',
];

function hashIndex(value: string, length: number) {
  let h = 0;
  for (let i = 0; i < value.length; i++) { h = (h << 5) - h + value.charCodeAt(i); h |= 0; }
  return Math.abs(h) % length;
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const c = AVATAR_COLORS[hashIndex(name, AVATAR_COLORS.length)];
  const initials = name.slice(0, 2).toUpperCase();
  const sz = size === 'sm' ? 'h-9 w-9 text-xs' : size === 'lg' ? 'h-14 w-14 text-base' : 'h-12 w-12 text-sm';
  return (
    <Avatar className={`${sz} ${c} text-white font-semibold`}>
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

      <div className="flex-1 min-h-0 grid md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr]">

        {/* Conversation list */}
        <section className={`${mobileShowThread ? 'hidden md:flex' : 'flex'} flex-col bg-card border-r border-border min-h-0`}>
          {/* List header */}
          <div className="bg-wa-header px-4 py-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Chats</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChat(s => !s)}
                title="New chat"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </button>
              <button title="More" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="p-2 bg-card border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 rounded-full bg-secondary border-0 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {showNewChat && (
              <div className="border-b border-border bg-secondary/40">
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Start new chat</p>
                {(searchQuery.trim() ? searchResults : allProfiles.slice(0, 8)).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => startConversation(p)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[hsl(var(--wa-list-hover))] transition text-left"
                  >
                    <UserAvatar name={p.username} size="sm" />
                    <div>
                      <div className="text-sm font-medium">{p.display_name || `@${p.username}`}</div>
                      <div className="text-xs text-muted-foreground">@{p.username}</div>
                    </div>
                  </button>
                ))}
                {searchQuery.trim() && searchResults.length === 0 && (
                  <p className="px-4 py-3 text-xs text-muted-foreground">No operators found.</p>
                )}
              </div>
            )}

            {filteredConversations.length === 0 && !showNewChat ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                No chats yet. Tap the new-chat icon to start one.
              </div>
            ) : (
              filteredConversations.map((c) => {
                const active = activeId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 transition text-left border-b border-border/60 ${
                      active ? 'bg-[hsl(var(--wa-list-active))]' : 'hover:bg-[hsl(var(--wa-list-hover))]'
                    }`}
                  >
                    <UserAvatar name={c.other?.username ?? 'user'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium text-[15px] truncate">{c.other?.display_name || `@${c.other?.username}`}</div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <div className="text-[13px] text-muted-foreground truncate">@{c.other?.username}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Thread */}
        <section className={`${mobileShowThread ? 'flex' : 'hidden md:flex'} flex-col min-h-0`}>
          {activeConvo ? (
            <>
              {/* Thread header */}
              <div className="bg-wa-header px-3 sm:px-4 py-2.5 flex items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <UserAvatar name={activeUser?.username ?? 'chat'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{activeUser?.display_name || `@${activeUser?.username}`}</div>
                  <div className="text-[11px] opacity-80 truncate">online</div>
                </div>
                <button onClick={() => startCall('video')} title="Video call" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><Video className="h-5 w-5" /></button>
                <button onClick={() => startCall('voice')} title="Voice call" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><Phone className="h-5 w-5" /></button>
                <button title="More" className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10"><MoreVertical className="h-5 w-5" /></button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-3 px-2 sm:px-6 bg-wa-chat">
                {messages.length === 0 ? (
                  <div className="h-full grid place-items-center text-center text-sm text-muted-foreground">
                    <div className="bg-card/80 backdrop-blur rounded-lg px-5 py-4 shadow-bubble">
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

              {/* Composer */}
              {inputSel && (
                <div className="px-2 sm:px-4 py-2 bg-secondary border-t border-border">
                  <MessageComposer
                    selection={inputSel}
                    onChangeInput={() => setShowInputDialog(true)}
                    onSend={sendMessage}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 grid place-items-center p-8 text-center bg-wa-chat">
              <div className="max-w-sm">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary grid place-items-center text-primary-foreground shadow-soft">
                  <MessageSquarePlus className="h-9 w-9" />
                </div>
                <h3 className="text-lg font-semibold">
                  Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a chat or start a new conversation to begin sending Morse signals end-to-end.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {call && (
        <CallDialog
          open
          conversationId={call.conversationId}
          selfId={user.id}
          peerId={call.peerId}
          peerName={call.peerName}
          mode={call.mode}
          role={call.role}
          remoteOffer={call.remoteOffer}
          onClose={() => setCall(null)}
        />
      )}

      {incoming && !call && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-card shadow-soft border border-border p-4 flex items-center gap-3 max-w-sm w-[90%]">
          <div className="h-10 w-10 rounded-full bg-primary grid place-items-center text-primary-foreground">
            {incoming.mode === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{incoming.peerName}</div>
            <div className="text-xs text-muted-foreground capitalize">Incoming {incoming.mode} call</div>
          </div>
          <button onClick={() => setIncoming(null)} className="grid h-9 w-9 place-items-center rounded-full bg-destructive text-destructive-foreground">
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </button>
          <button onClick={acceptIncoming} className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Phone className="h-4 w-4" />
          </button>
        </div>
      )}
    </MainLayout>
  );
}
