import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LogOut, Plus, Search, Radio, Phone, Video, MoreVertical, ArrowLeft,
  MessageSquare, Users, Clock, Briefcase, BarChart3, Bell, ChevronDown,
  Tag, Star, FileText, Folder, Settings, Mail, PhoneCall, Calendar, User,
} from 'lucide-react';
import { InputSourceDialog, InputSelection } from '@/components/InputSourceDialog';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { Avatar } from '@/components/chat/Avatar';
import { toast } from 'sonner';

interface Profile { id: string; username: string; display_name: string | null }
interface Conversation {
  id: string; user_a: string; user_b: string; last_message_at: string;
  other?: Profile;
}
interface Message {
  id: string; conversation_id: string; sender_id: string;
  morse: string; decoded: string; input_source: string; created_at: string;
}

type MobileTab = 'chats' | 'contacts' | 'recent' | 'profile';

const RAIL_ITEMS = [
  { icon: MessageSquare, label: 'Chats' },
  { icon: Users, label: 'Contacts' },
  { icon: Clock, label: 'Recent' },
  { icon: Briefcase, label: 'Workspace' },
  { icon: BarChart3, label: 'Activity' },
] as const;

const BOTTOM_TABS: { id: MobileTab; icon: typeof MessageSquare; label: string }[] = [
  { id: 'chats', icon: MessageSquare, label: 'Chats' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'recent', icon: Clock, label: 'Recent' },
  { id: 'profile', icon: User, label: 'Profile' },
];

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
  const [globalSearch, setGlobalSearch] = useState('');
  const [inputSel, setInputSel] = useState<InputSelection | null>(null);
  const [showInputDialog, setShowInputDialog] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chats');
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
        .from('conversations').select('*')
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
    const ch = supabase.channel('conversations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    const load = async () => {
      const { data } = await supabase.from('messages').select('*')
        .eq('conversation_id', activeId).order('created_at', { ascending: true });
      setMessages((data as Message[]) ?? []);
    };
    load();
    const ch = supabase.channel(`messages-${activeId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
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
    if (existing) {
      setActiveId(existing.id);
      setShowNewChat(false); setSearchQuery('');
      setMobileShowThread(true);
      return;
    }
    const { data, error } = await supabase.from('conversations').insert({ user_a: a, user_b: b }).select().maybeSingle();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setActiveId(data.id); setShowNewChat(false); setSearchQuery('');
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
  const filteredConvos = conversations.filter(c =>
    !globalSearch.trim() || c.other?.username.toLowerCase().includes(globalSearch.toLowerCase())
    || c.other?.display_name?.toLowerCase().includes(globalSearch.toLowerCase())
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-app flex items-center justify-center text-telegraph-muted">
        Loading…
      </div>
    );
  }

  // ---- subcomponents (inline for compactness) ----

  const ConversationListPanel = (
    <div className="flex flex-col h-full bg-telegraph-bg/40">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-sm font-semibold text-telegraph-text mb-3">Conversation</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-telegraph-muted" />
          <Input
            placeholder="Search here"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            className="pl-9 h-9 rounded-lg bg-telegraph-surface border-telegraph-border text-sm"
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-[11px]">
          <button className="text-telegraph-muted flex items-center gap-1 uppercase tracking-wider">
            Recent Chats <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowNewChat(s => !s)}
            className="text-telegraph-accent flex items-center gap-1 uppercase tracking-wider"
          >
            New Chat <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {showNewChat && (
        <div className="px-4 pb-3 space-y-2 border-b border-telegraph-border/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-telegraph-muted" />
            <Input
              placeholder="Find operator by handle…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-lg bg-telegraph-surface border-telegraph-border text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1 max-h-48 overflow-auto">
            {searchResults.map(p => (
              <button key={p.id} onClick={() => startConversation(p)}
                className="w-full text-left px-2 py-2 rounded-lg hover:bg-telegraph-surface flex items-center gap-3">
                <Avatar name={p.username} size={32} />
                <div>
                  <div className="text-sm font-medium">@{p.username}</div>
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

      <ScrollArea className="flex-1 px-2 pb-24 md:pb-2">
        {filteredConvos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-telegraph-muted">No conversations yet.</p>
            <Button onClick={() => setShowNewChat(true)} variant="ghost"
              className="mt-3 text-telegraph-accent hover:text-telegraph-accent-2">
              Start your first chat
            </Button>
          </div>
        ) : (
          filteredConvos.map(c => {
            const active = activeId === c.id;
            const username = c.other?.username ?? '…';
            return (
              <button key={c.id}
                onClick={() => { setActiveId(c.id); setMobileShowThread(true); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 flex items-center gap-3 transition-all ${
                  active ? 'bg-gradient-sent shadow-bubble text-white' : 'hover:bg-telegraph-surface'
                }`}
              >
                <Avatar name={username} size={40} online />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-telegraph-text'}`}>
                      {c.other?.display_name || `@${username}`}
                    </div>
                    <div className={`text-[10px] whitespace-nowrap ${active ? 'text-white/80' : 'text-telegraph-muted'}`}>
                      {new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`text-xs truncate mt-0.5 ${active ? 'text-white/80' : 'text-telegraph-muted'}`}>
                    @{username} · Tap to telegraph
                  </div>
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );

  const ProfilePanel = activeConvo ? (
    <div className="flex flex-col h-full overflow-y-auto bg-telegraph-bg/40 px-5 py-6 gap-4">
      <div className="flex flex-col items-center text-center">
        <Avatar name={activeConvo.other?.username ?? '?'} size={88} online />
        <h3 className="mt-3 text-base font-semibold">
          {activeConvo.other?.display_name || `@${activeConvo.other?.username}`}
        </h3>
        <p className="text-xs text-telegraph-muted">Operator</p>
      </div>

      <div className="bg-telegraph-surface rounded-2xl p-4 shadow-soft">
        <h4 className="text-xs font-semibold text-telegraph-text mb-3">Personal Information</h4>
        <div className="space-y-2.5 text-xs text-telegraph-muted">
          <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-telegraph-accent" /> @{activeConvo.other?.username}</div>
          <div className="flex items-center gap-2"><PhoneCall className="h-3.5 w-3.5 text-telegraph-accent" /> Telegraph line</div>
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-telegraph-accent" /> Active 24 / 7</div>
        </div>
      </div>

      {[
        { icon: Tag, label: 'Add Tag' },
        { icon: Star, label: 'Chat Rating' },
        { icon: FileText, label: 'View Pages' },
      ].map(item => (
        <button key={item.label}
          className="flex items-center justify-between bg-telegraph-surface hover:bg-telegraph-card transition-colors rounded-2xl px-4 py-3 shadow-soft">
          <span className="flex items-center gap-2.5 text-sm">
            <item.icon className="h-4 w-4 text-telegraph-accent" /> {item.label}
          </span>
          <MoreVertical className="h-4 w-4 text-telegraph-muted" />
        </button>
      ))}

      <div className="bg-telegraph-surface rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-sm">
            <Folder className="h-4 w-4 text-telegraph-accent" /> Shared Document
          </span>
          <ChevronDown className="h-4 w-4 text-telegraph-muted" />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full items-center justify-center text-xs text-telegraph-muted">
      Select a chat to see details
    </div>
  );

  return (
    <div className="h-[100dvh] bg-gradient-app text-telegraph-text flex flex-col overflow-hidden">
      <InputSourceDialog
        open={showInputDialog}
        initial={inputSel?.source}
        onSelect={(sel) => { setInputSel(sel); setShowInputDialog(false); }}
        onClose={inputSel ? () => setShowInputDialog(false) : undefined}
      />

      {/* Top bar */}
      <header className="hidden md:flex h-14 shrink-0 items-center justify-between px-5 border-b border-telegraph-border/40 bg-telegraph-bg/60 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-sent flex items-center justify-center shadow-bubble">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide text-telegraph-accent">Telegraph</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-telegraph-muted" />
            <Input placeholder="Search here" className="pl-9 h-9 w-64 rounded-lg bg-telegraph-surface border-telegraph-border text-sm" />
          </div>
          <button className="relative text-telegraph-muted hover:text-telegraph-accent">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-telegraph-accent" />
          </button>
          <div className="relative">
            <button onClick={() => setShowUserMenu(s => !s)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-telegraph-surface">
              <Avatar name={profile?.username ?? '?'} size={28} />
              <span className="text-sm font-medium">{profile?.display_name || profile?.username}</span>
              <ChevronDown className="h-3 w-3 text-telegraph-muted" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-telegraph-surface border border-telegraph-border shadow-soft overflow-hidden text-sm z-50">
                <button className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-telegraph-card"><User className="h-4 w-4" /> Profile</button>
                <button onClick={() => setShowInputDialog(true)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-telegraph-card"><Settings className="h-4 w-4" /> Settings</button>
                <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-telegraph-card text-telegraph-accent"><LogOut className="h-4 w-4" /> Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden h-12 shrink-0 flex items-center justify-between px-4 border-b border-telegraph-border/40 bg-telegraph-bg/60 backdrop-blur-xl">
        {mobileShowThread && activeConvo ? (
          <>
            <button onClick={() => setMobileShowThread(false)} className="text-telegraph-muted"><ArrowLeft className="h-5 w-5" /></button>
            <div className="flex items-center gap-2">
              <Avatar name={activeConvo.other?.username ?? '?'} size={28} online />
              <span className="text-sm font-semibold truncate max-w-[140px]">
                {activeConvo.other?.display_name || `@${activeConvo.other?.username}`}
              </span>
            </div>
            <button onClick={() => setShowProfilePanel(true)} className="text-telegraph-muted"><MoreVertical className="h-5 w-5" /></button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-sent flex items-center justify-center"><Radio className="h-4 w-4 text-white" /></div>
              <span className="font-semibold text-telegraph-accent">Telegraph</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-telegraph-muted"><Bell className="h-5 w-5" /></button>
              <Avatar name={profile?.username ?? '?'} size={28} />
            </div>
          </>
        )}
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Left icon rail (desktop) */}
        <nav className="hidden md:flex w-14 shrink-0 flex-col items-center gap-2 py-5 border-r border-telegraph-border/40 bg-telegraph-bg/60">
          {RAIL_ITEMS.map((it, i) => (
            <button key={it.label} title={it.label}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                i === 0 ? 'bg-gradient-sent text-white shadow-bubble' : 'text-telegraph-muted hover:bg-telegraph-surface hover:text-telegraph-text'
              }`}>
              <it.icon className="h-5 w-5" />
            </button>
          ))}
          <button onClick={signOut} title="Sign out"
            className="mt-auto h-10 w-10 rounded-xl flex items-center justify-center text-telegraph-muted hover:bg-telegraph-surface hover:text-telegraph-text">
            <LogOut className="h-5 w-5" />
          </button>
        </nav>

        {/* Conversation list */}
        <aside className={`${mobileShowThread ? 'hidden md:flex' : 'flex'} w-full md:w-72 lg:w-80 shrink-0 border-r border-telegraph-border/40`}>
          {ConversationListPanel}
        </aside>

        {/* Thread */}
        <main className={`${mobileShowThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
          {activeConvo ? (
            <>
              <header className="hidden md:flex h-14 shrink-0 items-center gap-3 px-5 border-b border-telegraph-border/40 bg-telegraph-bg/40">
                <Avatar name={activeConvo.other?.username ?? '?'} size={40} online />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {activeConvo.other?.display_name || `@${activeConvo.other?.username}`}
                  </div>
                  <div className="text-[11px] text-telegraph-online flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-telegraph-online" /> Online
                  </div>
                </div>
                <button className="h-9 w-9 rounded-full bg-telegraph-surface hover:bg-telegraph-card flex items-center justify-center text-telegraph-accent"><Video className="h-4 w-4" /></button>
                <button className="h-9 w-9 rounded-full bg-telegraph-surface hover:bg-telegraph-card flex items-center justify-center text-telegraph-accent"><Phone className="h-4 w-4" /></button>
                <button onClick={() => setShowProfilePanel(s => !s)}
                  className="lg:hidden h-9 w-9 rounded-full bg-telegraph-surface hover:bg-telegraph-card flex items-center justify-center text-telegraph-muted"><MoreVertical className="h-4 w-4" /></button>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-5 py-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-sent flex items-center justify-center shadow-bubble mb-4">
                      <Radio className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-sm font-medium">Send the first signal</p>
                    <p className="text-xs text-telegraph-muted mt-1 max-w-xs">
                      Tap a bubble after sending to flip between Morse and decoded text
                    </p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const prev = messages[i - 1];
                    const showAvatar = !prev || prev.sender_id !== m.sender_id;
                    return (
                      <ChatBubble key={m.id} morse={m.morse} decoded={m.decoded}
                        isOwn={m.sender_id === user.id} timestamp={m.created_at}
                        inputSource={m.input_source} senderName={activeConvo.other?.username}
                        showAvatar={showAvatar} />
                    );
                  })
                )}
              </div>

              {inputSel && (
                <div className="pb-16 md:pb-0">
                  <MessageComposer selection={inputSel} onChangeInput={() => setShowInputDialog(true)} onSend={sendMessage} />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="h-20 w-20 rounded-full bg-gradient-sent flex items-center justify-center shadow-bubble mb-5">
                <Radio className="h-9 w-9 text-white" />
              </div>
              <h2 className="text-lg font-semibold">Morse Telegraph</h2>
              <p className="text-sm text-telegraph-muted mt-2 max-w-sm">
                Select a conversation, or start a new one to begin telegraphing.
              </p>
            </div>
          )}
        </main>

        {/* Right profile panel */}
        <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 border-l border-telegraph-border/40">
          {ProfilePanel}
        </aside>

        {/* Mobile/tablet profile panel as overlay */}
        {showProfilePanel && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfilePanel(false)} />
            <div className="w-80 max-w-[85vw] bg-telegraph-bg border-l border-telegraph-border shadow-soft">
              {ProfilePanel}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 h-16 bg-telegraph-bg/95 backdrop-blur-xl border-t border-telegraph-border/40 flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_TABS.map(tab => {
          const active = mobileTab === tab.id;
          return (
            <button key={tab.id}
              onClick={() => {
                setMobileTab(tab.id);
                if (tab.id === 'profile') setShowProfilePanel(true);
                else if (tab.id === 'chats') { setMobileShowThread(false); setShowProfilePanel(false); }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                active ? 'text-telegraph-accent' : 'text-telegraph-muted'
              }`}>
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
