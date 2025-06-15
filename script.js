class ChromaticStaff {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
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
        
        // SMuFL Unicode for musical symbols
        this.symbols = {
            noteheadBlack: '\uE0A4',  // Black notehead - SMuFL
            staff5Lines: '\uE014',    // 5-line staff
            fallbackNote: '●',       // Fallback if font doesn't load
        };
        
        this.init();
    }
    
    init() {
        this.drawStaff();
        this.setupEventListeners();
        this.initAudio();
        this.checkFontLoading();
    }
    
    async checkFontLoading() {
        try {
            await document.fonts.load('40px Bravura');
            console.log('Bravura font loaded successfully');
            this.enableMusicSymbols();
        } catch (error) {
            console.log('Bravura font failed to load, using fallback symbols');
        }
    }
    
    enableMusicSymbols() {
        // Switch from ellipse to SMuFL symbols
        const ellipses = this.svg.querySelectorAll('ellipse');
        const symbols = this.svg.querySelectorAll('.music-symbol');
        
        ellipses.forEach(ellipse => ellipse.style.display = 'none');
        symbols.forEach(symbol => symbol.style.display = 'block');
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
        // Clear existing content
        this.svg.innerHTML = '';
        
        // Create staff group
        const staffGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        staffGroup.setAttribute('id', 'staff-lines');
        
        // Draw staff lines
        for (let i = 0; i < this.staffLines; i++) {
            const y = this.staffTop + (i * this.lineSpacing);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', this.staffLeft);
            line.setAttribute('y1', y);
            line.setAttribute('x2', this.staffLeft + this.staffWidth);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', '1');
            staffGroup.appendChild(line);
        }
        
        this.svg.appendChild(staffGroup);
        
        // Draw notes
        this.notes.forEach(note => {
            this.drawNote(note.x, note.y);
        });
    }
    
    drawNote(x, y) {
        const noteGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        noteGroup.setAttribute('class', 'note');
        
        // Create ellipse as fallback and primary note symbol
        const noteEllipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        noteEllipse.setAttribute('cx', x);
        noteEllipse.setAttribute('cy', y);
        noteEllipse.setAttribute('rx', '8');
        noteEllipse.setAttribute('ry', '6');
        noteEllipse.setAttribute('fill', '#000');
        noteGroup.appendChild(noteEllipse);
        
        // Also add the SMuFL symbol for future enhancement
        const noteSymbol = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteSymbol.setAttribute('x', x);
        noteSymbol.setAttribute('y', y + 6);
        noteSymbol.setAttribute('text-anchor', 'middle');
        noteSymbol.setAttribute('dominant-baseline', 'central');
        noteSymbol.setAttribute('class', 'music-symbol');
        noteSymbol.setAttribute('style', 'display: none;'); // Hidden for now
        noteSymbol.textContent = this.symbols.noteheadBlack;
        noteGroup.appendChild(noteSymbol);
        
        this.svg.appendChild(noteGroup);
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
    
    exportSVG() {
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = 'chromatic-staff-notation.svg';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(svgUrl);
    }
    
    setupEventListeners() {
        this.svg.addEventListener('click', (e) => {
            const rect = this.svg.getBoundingClientRect();
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
        
        document.getElementById('export-svg-btn').addEventListener('click', () => {
            this.exportSVG();
        });
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const staff = new ChromaticStaff('staff-svg');
});