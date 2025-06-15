## 🎯 User Story: Chromatic Staff Notation with Real-Time Audio Feedback

## 🧑‍🎨 As a...
Musician and music theorist using chromatic staff notation (where each visual step = 1 semitone),

## 🎯 I want to...
Enter notes on a 5-line chromatic staff and **immediately hear the corresponding pitch** upon input (click, keystroke, or MIDI),

## 🤩 So that I can...
- Develop inner hearing through visual-to-audio association,
- Compose and experiment in an intervallic, key-agnostic way,
- Use alternative notation systems with accurate feedback.

---

## 🧱 Functional Requirements

- Custom 5-line chromatic staff display (each step = semitone)
- Input via mouse/touch (click to add note)
- Real-time playback using correct pitch mapping
- Visual feedback (rendered notehead)
- Optional MIDI keyboard input
- Optional export to MIDI or MusicXML

---

# 🏗️ Architecture Options

## Option 1: 🌐 Web App (HTML5 + Tone.js)

**Pros:** Cross-platform, real-time audio, easy sharing  
**Cons:** No native file export to MusicXML without extra tooling

### Tech Stack:
- UI: HTML Canvas or SVG
- Playback: [Tone.js](https://tonejs.github.io/)
- Logic: JavaScript (React optional)
- File export: JSON (internal) + MIDI (via JS lib)

### Component Diagram:
User Input (Mouse/Keyboard) --> Note Engine (JS) --> Audio Engine (Tone.js) --> Visual Renderer (Canvas/SVG)

---

## Option 2: 🐍 Python Desktop App (PyQt or Tkinter + FluidSynth)

**Pros:** Full control, MIDI routing, save/export flexibility  
**Cons:** Requires installation, less portable

### Tech Stack:
- UI: PyQt5 or Tkinter for staff + input
- Playback: FluidSynth or pygame.midi
- Logic: Python class for pitch mapping
- Export: MIDI + optional LilyPond output

### Component Diagram:
User Input (Mouse/MIDI) --> Note Engine (Python) --> MIDI Output or FluidSynth
|
--> Qt Canvas Staff View


---

## Option 3: 🧬 Hybrid (LilyPond + Interactive Overlay)

**Pros:** Engraving-quality output, exact control over notation  
**Cons:** No real-time feedback unless extended with JavaScript

### Tech Stack:
- Visuals: LilyPond to SVG
- Playback: Web MIDI API or embedded audio
- Overlay: JavaScript maps SVG elements to pitches

---

# 🔁 Optional Enhancements

- Play selected intervals (e.g., click one note, then shift+click another)
- Export to MIDI, MusicXML, or LilyPond
- Add tonic anchor line or interval annotations
- Custom clefs for chromatic anchor points

---

# ✅ Recommendation

Start with **Option 1 (Web App with Tone.js)** for a fast, interactive prototype:
- Quick to develop and test
- No install needed
- Easy to iterate on pitch mappings and visuals

If successful, later expand to Option 2 for more advanced output and MIDI routing.

---

# 📦 Next Steps

1. Define pitch mapping (e.g. middle line = C4)
2. Create mock UI (Canvas staff + note input)
3. Hook up Tone.js for real-time pitch playback
4. Test input-to-sound flow
5. Expand to support intervals, sequences, and export




