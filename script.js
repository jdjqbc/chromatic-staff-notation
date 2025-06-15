// VexFlow 5.0.0 API
const { Factory, Stave, StaveNote, Voice, Formatter, Renderer } = VexFlow;

class ChromaticStaffVexFlow {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.notes = [];
        this.audioReady = false;
        
        // VexFlow setup
        this.factory = null;
        this.context = null;
        this.stave = null;
        this.voice = null;
        
        // Chromatic staff configuration
        this.staffWidth = 700;
        this.staffHeight = 200;
        this.staffTop = 50;
        this.staffLeft = 50;
        
        // Pitch mapping for chromatic staff
        this.middleLineNote = 60; // C4
        this.chromaticPositions = this.generateChromaticPositions();
        
        this.init();
    }
    
    async init() {
        await this.initFonts();
        this.setupVexFlow();
        this.drawStaff();
        this.setupEventListeners();
        this.initAudio();
    }
    
    async initFonts() {
        // VexFlow 5.0.0 font initialization
        try {
            // Set the fonts for VexFlow
            VexFlow.setFonts('Bravura', 'Academico');
            
            // Wait for fonts to load
            await document.fonts.load('1em Bravura');
            await document.fonts.load('1em Academico');
            console.log('VexFlow fonts loaded successfully');
        } catch (error) {
            console.warn('Font loading failed, using fallbacks:', error);
        }
    }
    
    setupVexFlow() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create VexFlow factory
        this.factory = new Factory({
            renderer: { elementId: this.container.id, width: 800, height: 300 }
        });
        
        this.context = this.factory.getContext();
    }
    
    generateChromaticPositions() {
        // Generate chromatic note positions for 5-line staff
        // In chromatic notation, each space/line represents a semitone
        const positions = [];
        const baseY = this.staffTop + 80; // Middle line position
        
        // Generate positions from top to bottom of staff area
        for (let i = -8; i <= 8; i++) {
            const y = baseY - (i * 6); // 6px per semitone for tight chromatic spacing
            const midiNote = this.middleLineNote + i;
            positions.push({
                semitoneIndex: i,
                y: y,
                midiNote: midiNote,
                frequency: this.midiToFrequency(midiNote)
            });
        }
        
        return positions;
    }
    
    drawStaff() {
        // Clear context
        this.context.clear();
        
        // Create staff using VexFlow 5.0.0 API
        this.stave = new Stave(this.staffLeft, this.staffTop, this.staffWidth);
        
        // Add staff elements
        this.stave.addClef('treble').addTimeSignature('4/4');
        
        // Draw the staff
        this.stave.setContext(this.context).draw();
        
        // Draw chromatic position indicators
        this.drawChromaticGuides();
        
        // Draw notes if any exist
        if (this.notes.length > 0) {
            this.drawNotes();
        }
    }
    
    drawChromaticGuides() {
        // Draw subtle guide lines for chromatic positions
        this.context.save();
        this.context.setStrokeStyle('#e0e0e0');
        this.context.setLineWidth(0.5);
        
        this.chromaticPositions.forEach(pos => {
            // Only draw guides for positions between staff lines
            if (pos.semitoneIndex % 2 !== 0) {
                this.context.beginPath();
                this.context.moveTo(this.staffLeft + 80, pos.y);
                this.context.lineTo(this.staffLeft + this.staffWidth - 20, pos.y);
                this.context.stroke();
            }
        });
        
        this.context.restore();
    }
    
    drawNotes() {
        if (this.notes.length === 0) return;
        
        try {
            // Convert our notes to VexFlow format
            const vexNotes = this.notes.map(note => this.createVexFlowNote(note));
            
            if (vexNotes.length === 0) return;
            
            // Create voice and add notes - VexFlow 5.0.0 syntax
            this.voice = new Voice({ num_beats: 4, beat_value: 4 });
            this.voice.addTickables(vexNotes);
            
            // Format and draw
            const formatter = new Formatter().joinVoices([this.voice]);
            formatter.format([this.voice], this.staffWidth - 160);
            
            this.voice.draw(this.context, this.stave);
        } catch (error) {
            console.error('Error drawing notes:', error);
        }
    }
    
    createVexFlowNote(note) {
        try {
            // Convert our chromatic note to VexFlow note
            const pitch = this.midiToPitch(note.midiNote);
            const vexNote = new StaveNote({
                clef: 'treble',
                keys: [pitch],
                duration: 'q'  // Quarter note
            });
            
            // Handle accidentals for chromatic notes
            const noteIndex = note.midiNote % 12;
            if ([1, 3, 6, 8, 10].includes(noteIndex)) { // Sharp notes
                vexNote.addModifier(new VexFlow.Accidental('#'), 0);
            }
            
            return vexNote;
        } catch (error) {
            console.error('Error creating VexFlow note:', error);
            return null;
        }
    }
    
    midiToPitch(midiNote) {
        // Convert MIDI note number to VexFlow pitch notation
        const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
        const octave = Math.floor(midiNote / 12) - 1;
        const noteIndex = midiNote % 12;
        const noteName = noteNames[noteIndex];
        
        return `${noteName}/${octave}`;
    }
    
    getStaffPosition(mouseX, mouseY) {
        // Find closest chromatic position
        let closestPos = this.chromaticPositions[0];
        let minDistance = Math.abs(mouseY - closestPos.y);
        
        for (const pos of this.chromaticPositions) {
            const distance = Math.abs(mouseY - pos.y);
            if (distance < minDistance) {
                minDistance = distance;
                closestPos = pos;
            }
        }
        
        return {
            x: mouseX,
            y: closestPos.y,
            semitoneIndex: closestPos.semitoneIndex,
            midiNote: closestPos.midiNote,
            frequency: closestPos.frequency
        };
    }
    
    addNote(x, y, position) {
        const note = {
            x: x,
            y: y,
            semitoneIndex: position.semitoneIndex,
            midiNote: position.midiNote,
            frequency: position.frequency,
            timestamp: Date.now()
        };
        
        this.notes.push(note);
        this.playNote(note.frequency);
        this.drawStaff(); // Redraw with new note
        
        return note;
    }
    
    midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    async initAudio() {
        try {
            await Tone.start();
            this.synth = new Tone.Synth().toDestination();
            this.audioReady = true;
            console.log('Audio initialized successfully');
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }
    
    async playNote(frequency) {
        if (!this.audioReady) {
            await this.initAudio();
        }
        if (this.audioReady && this.synth) {
            this.synth.triggerAttackRelease(frequency, '8n');
        }
    }
    
    clearNotes() {
        this.notes = [];
        this.drawStaff();
    }
    
    playSequence() {
        if (this.notes.length === 0) return;
        
        // Sort notes by timestamp (order added)
        const sortedNotes = [...this.notes].sort((a, b) => a.timestamp - b.timestamp);
        
        let time = Tone.now();
        sortedNotes.forEach((note, index) => {
            this.synth.triggerAttackRelease(note.frequency, '4n', time + index * 0.5);
        });
    }
    
    exportSVG() {
        const svg = this.container.querySelector('svg');
        if (!svg) return;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'chromatic-staff-notation-vexflow5.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    }
    
    setupEventListeners() {
        // Click handler for adding notes
        this.container.addEventListener('click', (e) => {
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Check if click is within staff area
            if (mouseX >= this.staffLeft + 80 && mouseX <= this.staffLeft + this.staffWidth - 20 &&
                mouseY >= this.staffTop - 20 && mouseY <= this.staffTop + 150) {
                
                const position = this.getStaffPosition(mouseX, mouseY);
                this.addNote(position.x, position.y, position);
            }
        });
        
        // Control buttons
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearNotes();
        });
        
        document.getElementById('play-sequence-btn').addEventListener('click', () => {
            this.playSequence();
        });
        
        document.getElementById('export-svg-btn').addEventListener('click', () => {
            this.exportSVG();
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const staff = new ChromaticStaffVexFlow('staff-svg');
});