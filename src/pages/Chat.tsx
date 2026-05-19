import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Plus, Search, X } from 'lucide-react';
import { InputSourceDialog, InputSelection } from '@/components/InputSourceDialog';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { MainLayout } from '@/components/MainLayout';
import { toast } from 'sonner';

interface Profile { id: string; username: string; display_name: string | null }
interface Conversation { id: string; user_a: string; user_b: string; last_message_at: string; other?: Profile }
interface Message { id: string; conversation_id: string; sender_id: string; morse: string; decoded: string; input_source: string; created_at: string }

type ChatFilter = 'all' | 'contacts' | 'groups';

const AVATAR_EMOJIS = ['🚀', '🛰️', '🧭', '⚡', '👾', '🛸', '✨', '🌌', '💡', '🎖️', '🪐', '🔧'];
const AVATAR_GRADIENTS = [
  'from-[#5A54FF] via-[#9B59FF] to-[#FF80F4]',
  'from-[#18A0FB] via-[#30CBE8] to-[#6DF2AD]',
  'from-[#F5AF19] via-[#F05D23] to-[#FF416C]',
  'from-[#7B61FF] via-[#A64DF7] to-[#FF6CB2]',
  'from-[#34D399] via-[#22C55E] to-[#10B981]',
];

const GROUPS = [
  { id: 'ops', name: 'Operator Squad', description: 'Realtime practice and feed', members: 12 },
  { id: 'learn', name: 'Morse Learners', description: 'Beginner sessions and study', members: 24 },
  { id: 'events', name: 'Launch Team', description: 'Live build coordination', members: 6 },
];

function getHashedIndex(value: string, length: number) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % length;
}

function BitmojiAvatar({ username }: { username: string }) {
  const emoji = AVATAR_EMOJIS[getHashedIndex(username, AVATAR_EMOJIS.length)];
  const gradient = AVATAR_GRADIENTS[getHashedIndex(username + 'color', AVATAR_GRADIENTS.length)];

  return (
    <Avatar className={`bg-gradient-to-br ${gradient} text-black ring-1 ring-white/10`}>
      <span className="text-xl">{emoji}</span>
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
  const [showChatList, setShowChatList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [inputSel, setInputSel] = useState<InputSelection | null>(null);
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfile(data as Profile));
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem('morse-input-selection');
    if (saved) {
      try {
        setInputSel(JSON.parse(saved) as InputSelection);
      } catch {
        localStorage.removeItem('morse-input-selection');
      }
    } else {
      setShowInputDialog(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadProfiles = async () => {
      const { data } = await supabase.from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('username', { ascending: true })
        .limit(50);
      setAllProfiles((data as Profile[]) ?? []);
    };
    loadProfiles();
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

    const channel = supabase.channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    const channel = supabase.channel(`messages-${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages(m => [...m, payload.new as Message]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showNewChat || !searchQuery.trim() || !user) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('*')
        .ilike('username', `%${searchQuery.trim()}%`)
        .neq('id', user.id)
        .limit(10);
      setSearchResults((data as Profile[]) ?? []);
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, showNewChat, user]);

  const startConversation = async (other: Profile) => {
    if (!user) return;
    const [a, b] = [user.id, other.id].sort();
    const existing = conversations.find(c => c.user_a === a && c.user_b === b);
    if (existing) {
      setActiveId(existing.id);
      setShowNewChat(false);
      setShowChatList(false);
      return;
    }
    const { data, error } = await supabase.from('conversations').insert({ user_a: a, user_b: b }).select().maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setActiveId(data.id);
      setShowNewChat(false);
      setShowChatList(false);
      setSearchQuery('');
    }
  };

  const sendMessage = async (morse: string, decoded: string, source: string) => {
    if (!user || !activeId) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: user.id,
      morse,
      decoded,
      input_source: source,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', activeId);
  };

  const activeConvo = conversations.find(c => c.id === activeId);
  const activeUser = activeConvo?.other;
  const totalUsers = allProfiles.length + 1;
  const activeChats = conversations.length;
  const conversationsWithActivity = conversations.filter(c => c.last_message_at).length;

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => c.other?.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const filteredContacts = searchQuery.trim()
    ? allProfiles.filter(p => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : allProfiles.slice(0, 8);

  const tabs: { value: ChatFilter; label: string }[] = [
    { value: 'all', label: 'All chats' },
    { value: 'contacts', label: 'My Contacts' },
    { value: 'groups', label: 'Groups' },
  ];

  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center flex-1 text-slate-500">Loading…</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <InputSourceDialog
        open={showInputDialog}
        initial={inputSel?.source}
        onSelect={(sel) => {
          setInputSel(sel);
          setShowInputDialog(false);
          localStorage.setItem('morse-input-selection', JSON.stringify(sel));
        }}
        onClose={inputSel ? () => setShowInputDialog(false) : undefined}
      />

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="mx-auto flex min-h-full max-w-[1500px] flex-col gap-4 p-4 sm:p-6">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-sky-200/20 backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-slate-400">Morse Telegraph</p>
                <h1 className="mt-3 text-4xl font-semibold text-slate-900 leading-tight">Operators & live messaging</h1>
                <p className="mt-4 max-w-2xl text-sm text-slate-500">
                  Browse all account holders, open recent chats, and start messaging with a single tap. The platform now mirrors a polished operator dashboard with bitmoji-style avatars.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-slate-200/75 bg-slate-100/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.55em] text-slate-400">Users</p>
                  <div className="mt-3 text-2xl font-semibold text-slate-900">{totalUsers}</div>
                </div>
                <div className="rounded-[24px] border border-slate-200/75 bg-slate-100/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.55em] text-slate-400">Chats</p>
                  <div className="mt-3 text-2xl font-semibold text-slate-900">{activeChats}</div>
                </div>
                <div className="rounded-[24px] border border-slate-200/75 bg-slate-100/80 p-4">
                  <p className="text-[10px] uppercase tracking-[0.55em] text-slate-400">Live threads</p>
                  <div className="mt-3 text-2xl font-semibold text-slate-900">{conversationsWithActivity}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1.5fr)_320px]">
              <section className="space-y-4 rounded-[28px] border border-slate-200/75 bg-white/95 p-4 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.55em] text-slate-400">Recent chats</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Active operators</h2>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowNewChat(s => !s)} className="rounded-full border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100">
                    <Plus className="h-4 w-4 mr-1" /> New
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 rounded-full bg-slate-50 p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveFilter(tab.value)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                        activeFilter === tab.value ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search operators…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-sm bg-white border-slate-200 text-slate-700"
                  />
                </div>

                <div className="space-y-3 overflow-hidden">
                  {activeFilter === 'all' && (
                    filteredConversations.length === 0 ? (
                      <p className="text-sm text-slate-500">No conversations match your search.</p>
                    ) : (
                      filteredConversations.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setActiveId(c.id); setShowChatList(false); }}
                          className={`group flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                            activeId === c.id ? 'border-sky-200 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <BitmojiAvatar username={c.other?.username ?? 'user'} />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-900">@{c.other?.username ?? '…'}</div>
                            <p className="text-xs text-slate-500">{c.other?.display_name ?? 'Operator'}</p>
                          </div>
                          <span className="text-[10px] text-slate-400">{c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</span>
                        </button>
                      ))
                    )
                  )}

                  {activeFilter === 'contacts' && (
                    filteredContacts.length === 0 ? (
                      <p className="text-sm text-slate-500">No contacts found.</p>
                    ) : (
                      filteredContacts.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => startConversation(p)}
                          className="group flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                        >
                          <BitmojiAvatar username={p.username} />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">@{p.username}</div>
                            <div className="text-xs text-slate-500">{p.display_name || 'Operator'}</div>
                          </div>
                        </button>
                      ))
                    )
                  )}

                  {activeFilter === 'groups' && (
                    <div className="space-y-3">
                      {GROUPS.map((group) => (
                        <button
                          key={group.id}
                          className="group w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
                          onClick={() => setShowNewChat(true)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{group.name}</div>
                              <p className="text-xs text-slate-500">{group.description}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-slate-500">{group.members} members</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {showNewChat && (
                  <div className="rounded-[28px] border border-slate-200/75 bg-slate-50 p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        placeholder="Search operators…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 text-sm bg-white border-slate-200 text-slate-700"
                      />
                    </div>
                    <div className="mt-3 grid gap-3 max-h-64 overflow-y-auto">
                      {(searchQuery.trim() ? searchResults : allProfiles.slice(0, 8)).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => startConversation(p)}
                          className="group flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                        >
                          <BitmojiAvatar username={p.username} />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">@{p.username}</div>
                            <div className="text-xs text-slate-500">{p.display_name || 'Operator'}</div>
                          </div>
                        </button>
                      ))}
                      {searchQuery.trim() && searchResults.length === 0 && (
                        <p className="text-sm text-slate-500">No operators found.</p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-5 shadow-sm">
                {activeConvo ? (
                  <>
                    <div className="mb-4 flex items-center gap-4">
                      <BitmojiAvatar username={activeUser?.username ?? 'chat'} />
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.55em] text-slate-400">Conversation</p>
                        <h2 className="text-xl font-semibold text-slate-900">@{activeUser?.username}</h2>
                        <p className="text-sm text-slate-500">{activeUser?.display_name ?? 'Messaging operator'}</p>
                      </div>
                    </div>
                    <div ref={scrollRef} className="max-h-[420px] overflow-y-auto space-y-3 pb-3">
                      {messages.length === 0 ? (
                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          Start the conversation by tapping the key or sending a message.
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
                      <div className="mt-4">
                        <MessageComposer selection={inputSel} onChangeInput={() => setShowInputDialog(true)} onSend={sendMessage} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-slate-200/80 bg-slate-50 p-6 text-center">
                    <p className="text-sm text-slate-500">Choose an operator or recent chat to open the live interface.</p>
                    <Button variant="secondary" className="mt-4 rounded-full bg-sky-600 px-5 py-2 text-white hover:bg-sky-700" onClick={() => setShowChatList(true)}>
                      Browse chats
                    </Button>
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-slate-200/75 bg-white/95 p-5 shadow-sm">
                <div className="mb-5">
                  <p className="text-[10px] uppercase tracking-[0.55em] text-slate-400">Statistics</p>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">Workspace overview</h2>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.55em] text-slate-500">Engagement</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{Math.min(activeChats * 5 + 30, 99)}%</p>
                    <p className="mt-2 text-sm text-slate-500">Live operator traffic is healthy.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.55em] text-slate-500">Ready operators</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{allProfiles.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-[10px] uppercase tracking-[0.55em] text-slate-500">Selected input</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{inputSel ? inputSel.source : 'None'}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
