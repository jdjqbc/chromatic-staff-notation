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
        
        // Note positioning system
        this.noteSpacing = 60; // Horizontal space between notes
        this.firstNoteX = this.staffLeft + 120; // Starting position for first note
        this.noteColumns = []; // Track which columns are occupied
        
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
    
    getNextNotePosition() {
        // Find the next available horizontal position
        const nextColumn = this.notes.length;
        const x = this.firstNoteX + (nextColumn * this.noteSpacing);
        
        // Make sure we don't go past the staff boundary
        const maxX = this.staffLeft + this.staffWidth - 80;
        
        if (x > maxX) {
            // If we're running out of space, start a new "line" or compress spacing
            const compressedSpacing = Math.min(this.noteSpacing, (maxX - this.firstNoteX) / (this.notes.length + 1));
            return this.firstNoteX + (this.notes.length * compressedSpacing);
        }
        
        return x;
    }
    
    getNoteColumn(clickX) {
        // Determine which column the user clicked in
        const relativeX = clickX - this.firstNoteX;
        const column = Math.round(relativeX / this.noteSpacing);
        return Math.max(0, column);
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
        
        // Draw note column guides
        this.drawColumnGuides();
        
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
    
    drawColumnGuides() {
        // Draw subtle vertical lines to show note column positions
        this.context.save();
        this.context.setStrokeStyle('#f0f0f0');
        this.context.setLineWidth(0.5);
        
        // Draw guides for potential note positions
        const maxColumns = Math.floor((this.staffWidth - 200) / this.noteSpacing) + 1;
        
        for (let i = 0; i < maxColumns; i++) {
            const x = this.firstNoteX + (i * this.noteSpacing);
            if (x < this.staffLeft + this.staffWidth - 50) {
                this.context.beginPath();
                this.context.moveTo(x, this.staffTop - 10);
                this.context.lineTo(x, this.staffTop + 120);
                this.context.stroke();
            }
        }
        
        this.context.restore();
    }
    
    drawNotes() {
        if (this.notes.length === 0) return;
        
        console.log('Drawing', this.notes.length, 'notes'); // Debug logging
        
        try {
            // Draw notes individually for now - simpler approach for VexFlow 5.0.0
            this.notes.forEach((note, index) => {
                this.drawSingleNote(note, index);
            });
        } catch (error) {
            console.error('Error drawing notes:', error);
        }
    }
    
    drawSingleNote(note, index) {
        try {
            console.log('Drawing note at position:', note.x, note.y); // Debug logging
            
            // For now, draw a simple circle to ensure visibility
            this.context.save();
            this.context.setFillStyle('#000');
            this.context.beginPath();
            this.context.arc(note.x, note.y, 6, 0, 2 * Math.PI);
            this.context.fill();
            this.context.restore();
            
        } catch (error) {
            console.error('Error drawing single note:', error);
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
        // Use automatic horizontal positioning instead of click position
        const noteX = this.getNextNotePosition();
        
        const note = {
            x: noteX, // Use calculated position, not click position
            y: position.y, // Use snapped Y position for pitch
            semitoneIndex: position.semitoneIndex,
            midiNote: position.midiNote,
            frequency: position.frequency,
            timestamp: Date.now(),
            column: this.notes.length // Track column for ordering
        };
        
        this.notes.push(note);
        console.log('Added note at column', note.column, ':', note); // Debug logging
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
        this.noteColumns = []; // Reset column tracking
        this.drawStaff();
        console.log('Cleared all notes and reset positioning');
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