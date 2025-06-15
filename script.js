class ChromaticStaff {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.notes = [];
        this.audioReady = false;
        
        // Staff configuration
        this.staffLines = 5;
        this.lineSpacing = 20;
        this.staffTop = 80;
        this.staffLeft = 50;
        this.staffWidth = 700;
        
        // Pitch mapping: middle line (3rd line) = C4
        this.middleLineNote = 60; // MIDI note number for C4
        
        this.init();
    }
    
    init() {
        this.drawStaff();
        this.setupEventListeners();
        this.initAudio();
    }
    
    async initAudio() {
        try {
            await Tone.start();
            this.synth = new Tone.Synth().toDestination();
            this.audioReady = true;
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }
    
    drawStaff() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw staff lines
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i < this.staffLines; i++) {
            const y = this.staffTop + (i * this.lineSpacing);
            this.ctx.beginPath();
            this.ctx.moveTo(this.staffLeft, y);
            this.ctx.lineTo(this.staffLeft + this.staffWidth, y);
            this.ctx.stroke();
        }
        
        // Draw notes
        this.notes.forEach(note => {
            this.drawNote(note.x, note.y);
        });
    }
    
    drawNote(x, y) {
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 8, 6, 0, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    getStaffPosition(mouseX, mouseY) {
        // Snap to staff lines and spaces
        const relativeY = mouseY - this.staffTop;
        const lineIndex = Math.round(relativeY / (this.lineSpacing / 2));
        const snappedY = this.staffTop + (lineIndex * (this.lineSpacing / 2));
        
        return {
            x: mouseX,
            y: snappedY,
            lineIndex: lineIndex
        };
    }
    
    getMidiNote(lineIndex) {
        // Convert staff position to MIDI note
        // Middle line (lineIndex 4) = C4 (MIDI 60)
        // Each half-step up = +1 semitone, down = -1 semitone
        const middleLineIndex = 4;
        const semitoneOffset = (middleLineIndex - lineIndex);
        return this.middleLineNote + semitoneOffset;
    }
    
    midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    addNote(x, y, lineIndex) {
        const midiNote = this.getMidiNote(lineIndex);
        const frequency = this.midiToFrequency(midiNote);
        
        const note = {
            x: x,
            y: y,
            lineIndex: lineIndex,
            midiNote: midiNote,
            frequency: frequency
        };
        
        this.notes.push(note);
        this.playNote(frequency);
        this.drawStaff();
        
        return note;
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
        
        // Sort notes by x position (left to right)
        const sortedNotes = [...this.notes].sort((a, b) => a.x - b.x);
        
        let time = Tone.now();
        sortedNotes.forEach((note, index) => {
            this.synth.triggerAttackRelease(note.frequency, '4n', time + index * 0.5);
        });
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Define staff boundaries (extend above and below staff lines)
            const staffTop = this.staffTop - this.lineSpacing;
            const staffBottom = this.staffTop + (this.staffLines - 1) * this.lineSpacing + this.lineSpacing;
            
            // Check if click is within staff area (both X and Y)
            if (mouseX >= this.staffLeft && mouseX <= this.staffLeft + this.staffWidth &&
                mouseY >= staffTop && mouseY <= staffBottom) {
                const position = this.getStaffPosition(mouseX, mouseY);
                this.addNote(position.x, position.y, position.lineIndex);
            }
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearNotes();
        });
        
        document.getElementById('play-sequence-btn').addEventListener('click', () => {
            this.playSequence();
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const staff = new ChromaticStaff('staff-canvas');
});