
// Theme Toggle
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme();
        this.bindEvents();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    bindEvents() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleTheme());
        }
    }
}

// Notes App
class NotesApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentNoteId = null;
        this.lastAction = 0;
        this.actionLimit = 100; // Reduced from 300ms to 100ms
        this.maxNotes = 100;
        this.maxTitleLength = 100;
        this.maxContentLength = 10000;
        this.init();
    }

    loadNotes() {
        try {
            const stored = localStorage.getItem('vnotes-data');
            if (!stored) {
                console.log('No stored notes found, starting fresh');
                return [];
            }
            
            const notes = JSON.parse(stored);
            if (!Array.isArray(notes)) {
                console.log('Invalid notes format, starting fresh');
                return [];
            }
            
            const validNotes = notes.filter(note => this.validateNote(note));
            console.log(`Loaded ${validNotes.length} valid notes`);
            return validNotes;
        } catch (error) {
            console.error('Error loading notes:', error);
            return [];
        }
    }

    validateNote(note) {
        return (
            note &&
            typeof note === 'object' &&
            typeof note.id === 'string' &&
            typeof note.title === 'string' &&
            typeof note.content === 'string' &&
            typeof note.createdAt === 'string' &&
            typeof note.updatedAt === 'string' &&
            note.title.length <= this.maxTitleLength &&
            note.content.length <= this.maxContentLength
        );
    }

    checkRateLimit() {
        const now = Date.now();
        if (now - this.lastAction < this.actionLimit) {
            this.showNotification('Please wait before performing another action', 'error');
            return false;
        }
        this.lastAction = now;
        return true;
    }

    validateInput(title, content) {
        if (!title || title.trim().length === 0) {
            this.showNotification('Title is required', 'error');
            return false;
        }
        
        if (!content || content.trim().length === 0) {
            this.showNotification('Content is required', 'error');
            return false;
        }
        
        if (title.length > this.maxTitleLength) {
            this.showNotification(`Title must be ${this.maxTitleLength} characters or less`, 'error');
            return false;
        }
        
        if (content.length > this.maxContentLength) {
            this.showNotification(`Content must be ${this.maxContentLength} characters or less`, 'error');
            return false;
        }
        
        return true;
    }

    checkNotesLimit() {
        if (this.notes.length >= this.maxNotes) {
            this.showNotification(`Maximum ${this.maxNotes} notes allowed`, 'error');
            return false;
        }
        return true;
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(el => el.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, type === 'error' ? 4000 : 2000);
    }

    init() {
        this.bindEvents();
        this.render();
        console.log('NotesApp initialized with', this.notes.length, 'notes');
    }

    bindEvents() {
        document.getElementById('add-note-btn').addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('note-modal').addEventListener('click', (e) => {
            if (e.target.id === 'note-modal') {
                this.closeModal();
            }
        });

        document.getElementById('note-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('note-modal').style.display === 'block') {
                this.closeModal();
            }
        });
    }

    openModal(noteId = null) {
        this.currentNoteId = noteId;
        const modal = document.getElementById('note-modal');
        const modalTitle = document.getElementById('modal-title');
        const noteTitle = document.getElementById('note-title');
        const noteContent = document.getElementById('note-content');
        const saveBtn = document.getElementById('save-btn');

        if (noteId) {
            const note = this.notes.find(n => n.id === noteId);
            if (!note) {
                this.showNotification('Note not found', 'error');
                return;
            }
            modalTitle.textContent = 'Edit Note';
            noteTitle.value = note.title;
            noteContent.value = note.content;
            saveBtn.textContent = 'Update Note';
        } else {
            modalTitle.textContent = 'Add New Note';
            noteTitle.value = '';
            noteContent.value = '';
            saveBtn.textContent = 'Save Note';
        }

        modal.style.display = 'block';
        setTimeout(() => noteTitle.focus(), 100);
    }

    closeModal() {
        document.getElementById('note-modal').style.display = 'none';
        this.currentNoteId = null;
    }

    saveNote() {
        if (!this.checkRateLimit()) return;
        
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();

        if (!this.validateInput(title, content)) return;
        
        if (!this.currentNoteId && !this.checkNotesLimit()) return;

        try {
            if (this.currentNoteId) {
                const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
                if (noteIndex === -1) {
                    this.showNotification('Note not found', 'error');
                    return;
                }
                
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    title: title,
                    content: content,
                    updatedAt: new Date().toISOString()
                };
                console.log('Note updated:', this.notes[noteIndex]);
            } else {
                const newNote = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    title: title,
                    content: content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.notes.unshift(newNote);
                console.log('New note created:', newNote);
            }

            const saveResult = this.saveToStorage();
            if (saveResult) {
                const isEdit = !!this.currentNoteId;
                this.render();
                this.closeModal();
                this.showNotification(isEdit ? 'Note updated successfully' : 'Note created successfully');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            this.showNotification('Failed to save note', 'error');
        }
    }

    deleteNote(noteId) {
        if (!this.checkRateLimit()) return;
        
        if (!noteId || typeof noteId !== 'string') {
            this.showNotification('Invalid note ID', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this note?')) {
            try {
                const originalLength = this.notes.length;
                this.notes = this.notes.filter(note => note.id !== noteId);
                
                if (this.notes.length === originalLength) {
                    this.showNotification('Note not found', 'error');
                    return;
                }
                
                console.log('Note deleted, remaining notes:', this.notes.length);
                
                const saveResult = this.saveToStorage();
                if (saveResult) {
                    this.render();
                    this.showNotification('Note deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                this.showNotification('Failed to delete note', 'error');
            }
        }
    }

    saveToStorage() {
        try {
            const dataToSave = JSON.stringify(this.notes);
            localStorage.setItem('vnotes-data', dataToSave);
            console.log('Notes saved to localStorage, count:', this.notes.length);
            
            // Verify the save worked
            const verification = localStorage.getItem('vnotes-data');
            if (verification !== dataToSave) {
                throw new Error('Data verification failed after save');
            }
            
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Failed to save notes - storage may be full', 'error');
            return false;
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    truncateContent(content, maxLength = 150) {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    render() {
        const notesGrid = document.getElementById('notes-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.notes.length === 0) {
            notesGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        notesGrid.innerHTML = this.notes.map(note => `
            <div class="note-card">
                <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                <p class="note-content">${this.escapeHtml(this.truncateContent(note.content))}</p>
                <div class="note-date">
                    ${note.updatedAt !== note.createdAt ? 'Updated' : 'Created'}: ${this.formatDate(note.updatedAt)}
                </div>
                <div class="note-actions">
                    <button class="btn btn-small btn-secondary" onclick="window.app.openModal('${note.id}')">
                        Edit
                    </button>
                    <button class="btn btn-small btn-danger" onclick="window.app.deleteNote('${note.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    window.app = new NotesApp();
});
