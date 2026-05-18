# 📡 Morse Telegraph - Real-Time Morse Code Messaging

A modern web application for real-time morse code messaging, learning, and translation. Send messages encoded in morse code, practice morse recognition, and communicate with other operators in real-time.

![Morse Telegraph](https://img.shields.io/badge/Built%20with-React-61dafb?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square)

---

## 🎯 **Features**

### 💬 **Real-Time Messaging**
- Send and receive morse code messages instantly
- User search and conversation management
- Message history with filtering
- Support for multiple input methods (keyboard, button, audio, text)

### ⚡ **Morse Code Tools**
- **Text → Morse Encoder** — Convert text to morse with audio playback
- **Audio Morse Decoder** — Detect morse from microphone using Goertzel algorithm
- **Signal Visualizer** — Real-time visual feedback of dot/dash signals
- **Interactive Telegraph Key** — Physical-style button or keyboard input

### 📚 **Learning System**
- **Interactive Training** — 3 difficulty levels (Easy, Medium, Hard)
- **Audio Playback** — Listen to morse code symbols
- **Score Tracking** — Monitor learning progress with streak counter
- **Quick Reference** — Comprehensive morse code chart

### 📖 **Complete Reference**
- All morse letters (A-Z), numbers (0-9), and punctuation
- Common morse phrases (SOS, RST, QSO, etc.)
- Click-to-copy functionality
- Timing explanations

### 📜 **Message History**
- View all sent messages
- Search by morse or decoded text
- Filter by input source
- Export to CSV
- Delete messages

### ⚙️ **Customizable Settings**
- Audio detection parameters (frequency, threshold, timing)
- Display preferences (compact mode, auto-scroll)
- Settings persistence via localStorage

### 👤 **User Profile**
- Edit display name and username
- View account creation date
- Copy user ID
- Secure authentication via Supabase

---

## 🏗️ **Tech Stack**

- **Frontend**: React 18.3 + TypeScript 5.8
- **Build**: Vite 5.4 with SWC
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Real-time**: Supabase Realtime subscriptions
- **State Management**: React hooks + React Query
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint 9.32 + TypeScript ESLint

---

## 📋 **Prerequisites**

- **Node.js** 18+ or **Bun** runtime
- **Supabase** account ([create one](https://supabase.com))
- **Git** for version control

---

## 🚀 **Getting Started**

### 1. **Clone the Repository**
```bash
git clone <repository-url>
cd realtime-morse
```

### 2. **Install Dependencies**
Using Bun (recommended):
```bash
bun install
```

Or with npm:
```bash
npm install
```

### 3. **Configure Supabase**

Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from your Supabase project dashboard (Settings → API).

### 4. **Start Development Server**

With Bun:
```bash
bun run dev
```

With npm:
```bash
npm run dev
```

The app opens at **http://localhost:8080**

---

## 📦 **Available Commands**

```bash
# Development
bun run dev              # Start dev server with hot reload
bun run build            # Build for production
bun run build:dev        # Build for development mode
bun run preview          # Preview production build

# Code Quality
bun run lint             # Run ESLint
bun run test             # Run tests once
bun run test:watch       # Run tests in watch mode

# With npm, replace 'bun run' with 'npm run'
```

---

## 📂 **Project Structure**

```
src/
├── pages/                    # Route pages
│   ├── Chat.tsx             # Real-time messaging
│   ├── Translator.tsx       # Morse translator tools
│   ├── Tools.tsx            # Audio decoder & encoder
│   ├── Learn.tsx            # Interactive training
│   ├── Reference.tsx        # Morse code guide
│   ├── History.tsx          # Message history
│   ├── Profile.tsx          # User account
│   ├── Settings.tsx         # App settings
│   ├── Auth.tsx             # Authentication
│   └── NotFound.tsx         # 404 page
│
├── components/              # Reusable components
│   ├── MainLayout.tsx       # Navigation sidebar
│   ├── AudioDecoder.tsx     # Microphone morse decoder
│   ├── TextToMorse.tsx      # Text → Morse encoder
│   ├── TelegraphKey.tsx     # Input button/keyboard
│   ├── SignalVisualizer.tsx # Dot/dash visualization
│   ├── MorseReference.tsx   # Quick reference chart
│   ├── ControlsPanel.tsx    # Settings controls
│   ├── DecodedOutput.tsx    # Display decoded text
│   ├── MessageHistory.tsx   # Message list
│   ├── InputSourceDialog.tsx # Select input method
│   ├── chat/                # Chat components
│   │   ├── ChatBubble.tsx
│   │   └── MessageComposer.tsx
│   └── ui/                  # shadcn/ui components
│
├── hooks/                   # Custom React hooks
│   ├── useTelegraph.ts      # Morse encoding/decoding
│   ├── useAudioDecoder.ts   # Microphone input
│   └── use-mobile.tsx       # Mobile detection
│
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication state
│
├── lib/                     # Utilities
│   ├── morse.ts             # Morse code tables
│   ├── morseEncoder.ts      # Encoding logic
│   └── utils.ts             # Helper functions
│
├── integrations/
│   └── supabase/            # Supabase client
│       ├── client.ts
│       └── types.ts
│
└── test/                    # Test files
    ├── setup.ts
    └── example.test.ts
```

---

## 🌐 **Routes**

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Chat | Default landing page |
| `/chat` | Chat | Real-time morse messaging |
| `/translator` | Translator | Morse decoding & encoding |
| `/tools` | Tools | Audio decoder & text encoder |
| `/learn` | Learn | Interactive training system |
| `/reference` | Reference | Complete morse code chart |
| `/history` | History | Message history & export |
| `/profile` | Profile | User account management |
| `/settings` | Settings | App preferences |
| `/auth` | Auth | Login/signup |

---

## 🔑 **Key Features Explained**

### **Chat Page**
- Create conversations with other users
- Search users by username
- Send messages via selected input method
- Real-time message updates
- Message history in conversation thread

### **Translator Page**
- Telegraph key input (keyboard spacebar or click button)
- Live signal visualization (dots and dashes)
- Decoded text output
- Adjustable timing parameters
- Text-to-morse converter with audio playback

### **Tools Page**
- **Audio Decoder**: Listen to morse code and auto-decode
- **Text Encoder**: Type text and convert to morse with playback
- **Reference**: Quick lookup for any morse character

### **Learn Page**
- Three difficulty levels with progressive character sets
- Random character presentation
- Correct/incorrect feedback
- Score and streak tracking
- Audio playback for each character
- Progress indicator

### **Reference Page**
- Visual morse code chart (letters, numbers, symbols)
- Click-to-copy morse codes
- Common phrases section
- Learning tips
- Timing explanations (dot = 1 unit, dash = 3 units)

### **History Page**
- View all sent messages with timestamps
- Search messages by content
- Filter by input source (keyboard, button, microphone, text)
- Export to CSV for analysis
- Delete individual messages
- Statistics dashboard

### **Profile Page**
- View and edit display name
- View username (read-only)
- View email address
- See account creation date
- Copy user ID for developer reference
- Sign out

### **Settings Page**
- **Audio Settings**:
  - Toggle audio playback
  - Adjust dot threshold (determines dot vs dash)
  - Set letter gap timing
  - Set word gap timing
  - Configure target frequency (600Hz default)
  - Set volume threshold for microphone
- All settings persist in browser localStorage

---

## 🔐 **Authentication**

The app uses **Supabase Authentication** with automatic profile creation:

1. User signs up with email/password
2. Supabase trigger auto-creates a profile
3. Username generated from email or custom metadata
4. Profile viewable and editable in Settings

RLS (Row Level Security) policies ensure:
- Users can only see other users' profiles
- Users can only modify their own profile
- Users can only see conversations they're part of
- Users can only send messages in conversations they're in

---

## 📊 **Database Schema**

### **Profiles Table**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY (auth.users.id),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **Conversations Table**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES auth.users(id),
  user_b UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_pair_unique UNIQUE (user_a, user_b),
  CONSTRAINT user_pair_ordered CHECK (user_a < user_b)
);
```

### **Messages Table**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES auth.users(id),
  morse TEXT NOT NULL,
  decoded TEXT NOT NULL,
  input_source TEXT DEFAULT 'keyboard',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🎨 **UI Theme**

The app uses a custom telegraph-inspired dark theme:

```css
--telegraph-bg: Slate-900       /* Main background */
--telegraph-text: White         /* Primary text */
--telegraph-muted: Gray-400     /* Muted text */
--telegraph-accent: Amber-400   /* Highlight color */
--telegraph-border: Gray-700    /* Borders */
--telegraph-card: Slate-800     /* Card backgrounds */
```

All colors use CSS custom properties and can be customized in `src/index.css`.

---

## 🔊 **Audio Features**

### **Morse Playback**
- Web Audio API oscillator (600Hz default)
- Configurable dot/dash duration
- Real-time audio generation

### **Microphone Input**
- Uses Web Audio API `getUserMedia()`
- Goertzel algorithm for single-frequency detection
- Configurable detection threshold
- Real-time frequency analysis

---

## 🧪 **Testing**

Run the test suite:

```bash
bun run test              # Run once
bun run test:watch       # Watch mode
```

Tests use:
- **Vitest** as test runner
- **React Testing Library** for component testing
- **jsdom** as DOM environment

---

## 📝 **Development Notes**

### **State Management**
- Local state with `useState` for UI state
- Context API for authentication
- React Query for server state (configured but minimal usage)

### **Real-time Updates**
- Supabase Realtime subscriptions for messages and conversations
- Automatic subscription cleanup on component unmount
- Debounced user search (200ms)

### **Performance**
- Memoized components where needed
- Lazy message loading (limit 500 messages)
- Optimized re-renders with proper dependency arrays

### **Accessibility**
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Mobile-responsive design

---

## 🚀 **Deployment**

### **Build for Production**
```bash
bun run build
```

This creates an optimized build in the `dist/` directory.

### **Deploy to Vercel/Netlify**
1. Connect your GitHub repo
2. Set build command: `npm run build` (or `bun run build`)
3. Set output directory: `dist`
4. Add environment variables from `.env.local`
5. Deploy!

### **Environment Variables**
Required for production:
```env
VITE_SUPABASE_URL=<your-url>
VITE_SUPABASE_ANON_KEY=<your-key>
```

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is open source and available under the MIT License.

---

## 🆘 **Troubleshooting**

### **Port 8080 already in use?**
```bash
# Change port in vite.config.ts or use:
bun run dev -- --port 3000
```

### **Supabase connection failing?**
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Ensure row-level security policies are configured

### **Microphone not working?**
- Check browser permissions (chrome://settings/content/microphone)
- Use HTTPS (required for Web Audio API in production)
- Try different frequency settings (200-1200 Hz range)

### **Messages not syncing?**
- Check Supabase Realtime is enabled
- Verify conversation exists with other user
- Check browser console for errors

---

## 📞 **Support**

For issues, questions, or suggestions:
1. Check existing GitHub Issues
2. Create a new Issue with detailed description
3. Include screenshots/error logs if applicable

---

## 🎓 **Learning Resources**

- [Morse Code](https://en.wikipedia.org/wiki/Morse_code)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React Documentation](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)

---

**Happy morse coding! 📡⚡**
