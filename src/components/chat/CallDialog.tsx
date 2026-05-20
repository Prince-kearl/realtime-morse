import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Phone } from 'lucide-react';
import { toast } from 'sonner';

export type CallMode = 'voice' | 'video';
export type CallRole = 'caller' | 'callee';

interface Props {
  open: boolean;
  conversationId: string;
  selfId: string;
  peerId: string;
  peerName: string;
  mode: CallMode;
  role: CallRole;
  remoteOffer?: RTCSessionDescriptionInit;
  onClose: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CallDialog({
  open,
  conversationId,
  selfId,
  peerId,
  peerName,
  mode,
  role,
  remoteOffer,
  onClose,
}: Props) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [status, setStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>(
    role === 'caller' ? 'ringing' : 'connecting'
  );
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const cleanup = () => {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
      pcRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };

    const send = (type: string, payload: any) => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type, to: peerId, from: selfId, payload },
      });
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === 'video',
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current && mode === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          const [remoteStream] = e.streams;
          if (remoteVideoRef.current && mode === 'video') {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
          }
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) send('ice', e.candidate);
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setStatus('connected');
          if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
            setStatus('ended');
          }
        };

        // Signaling channel
        const channel = supabase.channel(`call:${conversationId}`, {
          config: { broadcast: { self: false } },
        });
        channelRef.current = channel;

        channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
          if (!payload || payload.to !== selfId) return;
          const pc2 = pcRef.current;
          if (!pc2) return;
          try {
            if (payload.type === 'answer') {
              await pc2.setRemoteDescription(new RTCSessionDescription(payload.payload));
            } else if (payload.type === 'ice') {
              await pc2.addIceCandidate(new RTCIceCandidate(payload.payload));
            } else if (payload.type === 'hangup') {
              setStatus('ended');
              setTimeout(onClose, 300);
            }
          } catch (err) {
            console.error('signal error', err);
          }
        });

        await new Promise<void>((resolve) => {
          channel.subscribe((s) => {
            if (s === 'SUBSCRIBED') resolve();
          });
        });

        if (role === 'caller') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          // Send call invite + offer
          send('offer', { sdp: offer, mode });
        } else if (remoteOffer) {
          await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send('answer', answer);
          setStatus('connected');
        }
      } catch (err: any) {
        toast.error(err?.message ?? 'Could not start call');
        onClose();
      }
    })();

    return () => {
      cancelled = true;
      // Notify peer of hangup
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type: 'hangup', to: peerId, from: selfId },
      });
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggleMute = () => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    tracks.forEach((t) => (t.enabled = muted));
    setMuted(!muted);
  };
  const toggleCam = () => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    tracks.forEach((t) => (t.enabled = camOff));
    setCamOff(!camOff);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-slate-900 text-white border-0">
        <div className="relative aspect-video bg-black">
          {mode === 'video' ? (
            <>
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-32 h-24 rounded-xl object-cover ring-2 ring-white/30 shadow-lg"
              />
            </>
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-sent grid place-items-center mb-3 animate-pulse">
                  <Phone className="h-10 w-10" />
                </div>
                <div className="text-lg font-semibold">{peerName}</div>
                <div className="text-xs text-white/60 capitalize mt-1">{status}…</div>
              </div>
            </div>
          )}
          <audio ref={remoteAudioRef} autoPlay />
          {mode === 'video' && (
            <div className="absolute top-3 left-3 rounded-full bg-black/40 px-3 py-1 text-xs">
              {peerName} · <span className="capitalize">{status}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 py-4 bg-slate-900">
          <button
            onClick={toggleMute}
            className={`grid h-12 w-12 place-items-center rounded-full ${muted ? 'bg-red-500/80' : 'bg-white/15 hover:bg-white/25'}`}
          >
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          {mode === 'video' && (
            <button
              onClick={toggleCam}
              className={`grid h-12 w-12 place-items-center rounded-full ${camOff ? 'bg-red-500/80' : 'bg-white/15 hover:bg-white/25'}`}
            >
              {camOff ? <VideoOff className="h-5 w-5" /> : <VideoIcon className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="grid h-12 w-14 place-items-center rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-5 w-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
