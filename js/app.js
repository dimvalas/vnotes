
class NotesApp {
    constructor() {
        this.notes = this.loadNotes();
        this.currentNoteId = null;
        this.lastAction = 0;
        this.actionLimit = 300;
        this.maxNotes = 100;
        this.maxTitleLength = 100;
        this.maxContentLength = 10000;
        this.init();
    }


    loadNotes() {
        try {
            const stored = localStorage.getItem('notes');
            if (!stored) return [];
            
            const notes = JSON.parse(stored);
            if (!Array.isArray(notes)) return [];
            
            return notes.filter(note => this.validateNote(note));
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
            this.showError('Please wait before performing another action');
            return false;
        }
        this.lastAction = now;
        return true;
    }


    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        return input
            .replace(/[<>&"']/g, (char) => {
                const entities = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '&': '&amp;',
                    '"': '&quot;',
                    "'": '&#39;'
                };
                return entities[char];
            })
            .trim();
    }


    validateInput(title, content) {
        if (!title || title.length === 0) {
            this.showError('Title is required');
            return false;
        }
        
        if (!content || content.length === 0) {
            this.showError('Content is required');
            return false;
        }
        
        if (title.length > this.maxTitleLength) {
            this.showError(`Title must be ${this.maxTitleLength} characters or less`);
            return false;
        }
        
        if (content.length > this.maxContentLength) {
            this.showError(`Content must be ${this.maxContentLength} characters or less`);
            return false;
        }
        
        return true;
    }

    checkNotesLimit() {
        if (this.notes.length >= this.maxNotes) {
            this.showError(`Maximum ${this.maxNotes} notes allowed`);
            return false;
        }
        return true;
    }


    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 3000);
    }

    init() {
        this.bindEvents();
        this.render();
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
                this.showError('Note not found');
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
        noteTitle.focus();
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


        const cleanTitle = title;
        const cleanContent = content;

        try {
            if (this.currentNoteId) {
                const noteIndex = this.notes.findIndex(n => n.id === this.currentNoteId);
                if (noteIndex === -1) {
                    this.showError('Note not found');
                    return;
                }
                
                this.notes[noteIndex] = {
                    ...this.notes[noteIndex],
                    title: cleanTitle,
                    content: cleanContent,
                    updatedAt: new Date().toISOString()
                };
            } else {
                const newNote = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    title: cleanTitle,
                    content: cleanContent,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.notes.unshift(newNote);
            }

            const isEdit = !!this.currentNoteId;
            this.saveToLocalStorage();
            this.render();
            this.closeModal();
            this.showSuccess(isEdit ? 'Note updated successfully' : 'Note created successfully');
        } catch (error) {
            console.error('Error saving note:', error);
            this.showError('Failed to save note');
        }
    }

    deleteNote(noteId) {

        if (!this.checkRateLimit()) return;
        

        if (!noteId || typeof noteId !== 'string') {
            this.showError('Invalid note ID');
            return;
        }

        if (confirm('Are you sure you want to delete this note?')) {
            try {
                const originalLength = this.notes.length;
                this.notes = this.notes.filter(note => note.id !== noteId);
                
                if (this.notes.length === originalLength) {
                    this.showError('Note not found');
                    return;
                }
                
                this.saveToLocalStorage();
                this.render();
                this.showSuccess('Note deleted successfully');
            } catch (error) {
                console.error('Error deleting note:', error);
                this.showError('Failed to delete note');
            }
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('notes', JSON.stringify(this.notes));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showError('Failed to save notes');
        }
    }


    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 300);
        }, 2000);
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
                    <button class="btn btn-small btn-secondary" data-action="edit" data-note-id="${this.escapeHtml(note.id)}">
                        Edit
                    </button>
                    <button class="btn btn-small btn-danger" data-action="delete" data-note-id="${this.escapeHtml(note.id)}">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');


        notesGrid.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            const noteId = button.dataset.noteId;
            
            if (action === 'edit') {
                this.openModal(noteId);
            } else if (action === 'delete') {
                this.deleteNote(noteId);
            }
        });
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotesApp();
});
