
# Real-Time Morse Code Telegraph Translator

## Overview
A sleek, dark-themed interactive Morse code translator that simulates a real telegraph experience with real-time signal visualization and decoding.

## Architecture

### Pages & Layout
- **Single-page app** with a dark mode dashboard layout
- Header with title "Morse Code Translator" and subtitle
- Three main panels arranged in a responsive grid: Input, Visualization, Output
- Controls panel at the bottom

### Components

1. **TelegraphKey** — Large interactive button for tap/hold input. Glows on press, animates pulses.

2. **SignalVisualizer** — Horizontal bar that fills while pressing (shows dot/dash threshold). Below it, displays the raw signal sequence (e.g., `.... . .-.. .-.. ---`) with dots/dashes animating in.

3. **DecodedOutput** — Large text display showing the translated message updating in real time with a typing cursor animation.

4. **TimingIndicator** — Visual feedback showing dot vs dash threshold, letter pause, and word pause detection states.

5. **ControlsPanel** — Reset button, input mode toggle (Keyboard/Button), and sliders for dot duration threshold, letter gap, and word gap timing.

6. **MessageHistory** — Collapsible panel showing previously decoded messages with copy-to-clipboard.

### Simulated Logic (all frontend)
- **Morse dictionary** mapping signal sequences → characters (A-Z, 0-9, common punctuation)
- **Timing engine**: keydown/keyup or mousedown/mouseup timestamps determine dot vs dash based on configurable threshold
- **Gap detection**: setTimeout-based — short gap = next letter, long gap = space between words
- **Signal buffer**: React state accumulating dots/dashes, flushing to decoded text on gaps

### Input Modes
- **Keyboard mode**: Spacebar press duration determines dot/dash. Visual indicator on screen.
- **Button mode**: Click/hold the telegraph button. Auto-selected on mobile.

### UX & Design
- Dark theme with amber/gold accents (telegraph aesthetic)
- Smooth animations: button press glow, signal pulse ripples, text fade-in
- Cards with rounded corners and subtle shadows
- Sound feedback using Web Audio API (short beep for dot, longer beep for dash)
- Fully responsive — stacked layout on mobile, button mode auto-enabled

### Bonus Features
- Audio beeps for dot/dash
- Copy-to-clipboard on decoded output
- Message history log
- Dark/light mode toggle
