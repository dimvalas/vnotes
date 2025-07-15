class NotesApp {
    constructor() {
        this.storageKey = 'notes_app_data';
        this.notes = this.loadNotes();
        this.currentNoteId = null;
        this.lastAction = 0;
        this.actionLimit = 300;
        this.maxNotes = 100;
        this.maxTitleLength = 100;
        this.maxContentLength = 10000;
        this.init();
    }

    // Enhanced localStorage operations with better error handling
    loadNotes() {
        try {
            // Check if localStorage is available
            if (!this.isLocalStorageAvailable()) {
                console.warn('localStorage not available, using session storage');
                return this.loadFromSessionStorage();
            }

            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                console.log('No existing notes found, starting fresh');
                return [];
            }
            
            const parsed = JSON.parse(stored);
            
            // Handle different data formats for backward compatibility
            let notes = [];
            if (Array.isArray(parsed)) {
                notes = parsed;
            } else if (parsed && parsed.notes && Array.isArray(parsed.notes)) {
                notes = parsed.notes;
            } else {
                console.warn('Invalid notes format, starting fresh');
                return [];
            }
            
            // Validate and filter notes
            const validNotes = notes.filter(note => this.validateNote(note));
            
            if (validNotes.length !== notes.length) {
                console.warn(`Filtered out ${notes.length - validNotes.length} invalid notes`);
                // Save the cleaned data back
                this.saveToStorage(validNotes);
            }
            
            console.log(`Loaded ${validNotes.length} notes from storage`);
            return validNotes;
            
        } catch (error) {
            console.error('Error loading notes from localStorage:', error);
            
            // Try to recover from sessionStorage
            try {
                return this.loadFromSessionStorage();
            } catch (sessionError) {
                console.error('Error loading from sessionStorage:', sessionError);
                return [];
            }
        }
    }

    // Fallback to sessionStorage if localStorage fails
    loadFromSessionStorage() {
        const stored = sessionStorage.getItem(this.storageKey);
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.filter(note => this.validateNote(note)) : [];
    }

    // Check if localStorage is available and working
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Enhanced note validation
    validateNote(note) {
        if (!note || typeof note !== 'object') return false;
        
        const requiredFields = ['id', 'title', 'content', 'createdAt', 'updatedAt'];
        
        for (const field of requiredFields) {
            if (!note.hasOwnProperty(field) || typeof note[field] !== 'string') {
                return false;
            }
        }
        
        // Validate content length
        if (note.title.length > this.maxTitleLength || 
            note.content.length > this.maxContentLength) {
            return false;
        }
        
        // Validate dates
        if (isNaN(Date.parse(note.createdAt)) || isNaN(Date.parse(note.updatedAt))) {
            return false;
        }
        
        return true;
    }

    // Enhanced storage save with multiple fallbacks
    saveToStorage(notes = this.notes) {
        const dataToSave = {
            notes: notes,
            lastModified: new Date().toISOString(),
            version: '1.0'
        };
        
        try {
            // Primary: localStorage
            if (this.isLocalStorageAvailable()) {
                localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
                console.log('Notes saved to localStorage');
                return true;
            }
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
        
        try {
            // Fallback: sessionStorage
            sessionStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            console.log('Notes saved to sessionStorage (fallback)');
            this.showWarning('Notes saved to session storage - they will be lost when you close the browser');
            return true;
        } catch (error) {
            console.error('Failed to save to sessionStorage:', error);
        }
        
        // If all storage methods fail
        this.showError('Failed to save notes - storage not available');
        return false;
    }

    // Auto-save functionality
    autoSave() {
        if (this.notes.length > 0) {
            this.saveToStorage();
        }
    }

    // Enhanced backup functionality
    createBackup() {
        const backup = {
            notes: this.notes,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `notes_backup_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        this.showSuccess('Backup created successfully');
    }

    // Import functionality
    importNotes(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                let importedNotes = [];
                
                if (Array.isArray(imported)) {
                    importedNotes = imported;
                } else if (imported.notes && Array.isArray(imported.notes)) {
                    importedNotes = imported.notes;
                } else {
                    throw new Error('Invalid backup format');
                }
                
                const validNotes = importedNotes.filter(note => this.validateNote(note));
                
                if (validNotes.length === 0) {
                    this.showError('No valid notes found in backup file');
                    return;
                }
                
                // Merge with existing notes (avoid duplicates)
                const existingIds = new Set(this.notes.map(n => n.id));
                const newNotes = validNotes.filter(note => !existingIds.has(note.id));
                
                this.notes = [...this.notes, ...newNotes];
                this.saveToStorage();
                this.render();
                
                this.showSuccess(`Imported ${newNotes.length} notes successfully`);
                
            } catch (error) {
                console.error('Import error:', error);
                this.showError('Failed to import notes - invalid file format');
            }
        };
        
        reader.readAsText(file);
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
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showNotification(message, type = 'info') {
        const colors = {
            error: { bg: '#dc3545', shadow: 'rgba(220, 53, 69, 0.3)' },
            success: { bg: '#28a745', shadow: 'rgba(40, 167, 69, 0.3)' },
            warning: { bg: '#ffc107', shadow: 'rgba(255, 193, 7, 0.3)', text: '#212529' },
            info: { bg: '#17a2b8', shadow: 'rgba(23, 162, 184, 0.3)' }
        };
        
        const color = colors[type] || colors.info;
        
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `notification-message ${type}`;
        notificationDiv.textContent = message;
        notificationDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color.bg};
            color: ${color.text || 'white'};
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 15px ${color.shadow};
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notificationDiv);
        
        setTimeout(() => {
            notificationDiv.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notificationDiv.parentNode) {
                    notificationDiv.parentNode.removeChild(notificationDiv);
                }
            }, 300);
        }, type === 'error' ? 4000 : 2000);
    }

    init() {
        this.bindEvents();
        this.render();
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.autoSave();
        }, 30000);
        
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
        
        // Handle storage events (sync across tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.notes = this.loadNotes();
                this.render();
                this.showSuccess('Notes synced from another tab');
            }
        });
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

        // Add backup/import functionality if elements exist
        const backupBtn = document.getElementById('backup-btn');
        const importBtn = document.getElementById('import-btn');
        const importFile = document.getElementById('import-file');
        
        if (backupBtn) {
            backupBtn.addEventListener('click', () => {
                this.createBackup();
            });
        }
        
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
            
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importNotes(file);
                    e.target.value = ''; // Reset file input
                }
            });
        }
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
            
            // Save to storage with error handling
            if (this.saveToStorage()) {
                this.render();
                this.closeModal();
                this.showSuccess(isEdit ? 'Note updated successfully' : 'Note created successfully');
            }
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
                
                if (this.saveToStorage()) {
                    this.render();
                    this.showSuccess('Note deleted successfully');
                }
            } catch (error) {
                console.error('Error deleting note:', error);
                this.showError('Failed to delete note');
            }
        }
    }

    // Legacy method for backward compatibility
    saveToLocalStorage() {
        return this.saveToStorage();
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

        // Remove old event listeners to prevent duplicates
        const oldGrid = document.getElementById('notes-grid');
        const newGrid = oldGrid.cloneNode(true);
        oldGrid.parentNode.replaceChild(newGrid, oldGrid);

        // Add fresh event listeners
        newGrid.addEventListener('click', (e) => {
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

    // Additional utility methods
    clearAllNotes() {
        if (confirm('Are you sure you want to delete ALL notes? This action cannot be undone.')) {
            this.notes = [];
            this.saveToStorage();
            this.render();
            this.showSuccess('All notes cleared');
        }
    }

    getStorageInfo() {
        try {
            const used = new Blob([localStorage.getItem(this.storageKey) || '']).size;
            const total = 5 * 1024 * 1024; // 5MB typical localStorage limit
            return {
                used: used,
                total: total,
                percentage: (used / total) * 100,
                remaining: total - used
            };
        } catch (error) {
            return null;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NotesApp();
    
    // Add global methods for debugging/testing
    window.notesAppDebug = {
        getStorageInfo: () => window.app.getStorageInfo(),
        clearAllNotes: () => window.app.clearAllNotes(),
        createBackup: () => window.app.createBackup(),
        getNotes: () => window.app.notes
    };
});
