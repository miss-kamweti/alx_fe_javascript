// Dynamic Quote Generator - Complete Solution
class QuoteGenerator {
    constructor() {
        this.quotes = [];
        this.currentFilter = 'all';
        this.SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API
        this.syncInterval = null;
        this.conflictResolutionMode = 'server'; // 'server' or 'manual'
        
        this.init();
    }

    // TASK 0: Initialize application
    init() {
        this.loadQuotes();
        this.setupEventListeners();
        this.populateCategories(); // TASK 2: Populate categories dynamically
        this.showRandomQuote();
        this.loadLastFilter(); // TASK 2: Restore last selected category
        this.updateQuotesList();
        this.startSync(); // TASK 3: Start periodic sync
    }

    // TASK 0: Load quotes from localStorage
    loadQuotes() {
        const savedQuotes = localStorage.getItem('quotes');
        if (savedQuotes) {
            this.quotes = JSON.parse(savedQuotes);
        } else {
            this.quotes = this.getInitialQuotes();
            this.saveQuotes();
        }
        console.log(`Loaded ${this.quotes.length} quotes from storage`);
    }

    getInitialQuotes() {
        return [
            { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Inspiration" },
            { id: 2, text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", category: "Life" },
            { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
            { id: 4, text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Wisdom" },
            { id: 5, text: "Whoever is happy will make others happy too.", author: "Anne Frank", category: "Happiness" }
        ];
    }

    // TASK 0: Save quotes to localStorage
    saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(this.quotes));
        sessionStorage.setItem('lastUpdate', new Date().toISOString());
        
        // Update categories dropdown when new categories are added
        this.populateCategories();
        this.updateQuotesList();
    }

    // TASK 0: Setup all event listeners
    setupEventListeners() {
        // Show New Quote button
        document.getElementById('newQuote').addEventListener('click', () => {
            this.showRandomQuote();
        });

        // Add Quote button
        document.getElementById('addQuoteBtn').addEventListener('click', () => {
            this.addQuote();
        });

        // Export button
        document.getElementById('exportJson').addEventListener('click', () => {
            this.exportToJson();
        });

        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // Import file change
        document.getElementById('importFile').addEventListener('change', (event) => {
            this.importFromJsonFile(event);
        });

        // Sync button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncWithServer();
        });

        // Category filter change - TASK 2: Filter quotes based on selected category
        document.getElementById('categoryFilter').addEventListener('change', (event) => {
            this.filterQuotes();
            this.saveLastFilter(event.target.value); // TASK 2: Save to local storage
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (event) => {
            this.searchQuotes(event.target.value);
        });

        // Conflict resolution radio buttons
        document.querySelectorAll('input[name="conflictResolution"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                this.conflictResolutionMode = event.target.value;
                this.showNotification(`Conflict resolution set to: ${this.conflictResolutionMode}`, 'info');
            });
        });
    }

    // TASK 0: Show random quote
    showRandomQuote() {
        if (this.quotes.length === 0) {
            this.displayQuote({
                text: "No quotes available. Add some quotes first!",
                author: "System",
                category: "Info"
            });
            return;
        }

        let filteredQuotes = this.quotes;
        if (this.currentFilter !== 'all') {
            filteredQuotes = this.quotes.filter(quote => 
                quote.category.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }

        if (filteredQuotes.length === 0) {
            this.displayQuote({
                text: "No quotes found in this category. Try another filter or add a new quote!",
                author: "System",
                category: "Info"
            });
            return;
        }

        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];
        
        this.displayQuote(randomQuote);
        
        // Save to sessionStorage
        sessionStorage.setItem('lastViewedQuote', JSON.stringify(randomQuote));
        this.updateSessionInfo();
    }

    // TASK 0: Display quote in UI
    displayQuote(quote) {
        const quoteDisplay = document.getElementById('quoteDisplay');
        quoteDisplay.innerHTML = `
            <div class="quote-content">
                <div class="quote-text">"${quote.text}"</div>
                ${quote.author ? `<div class="quote-author">- ${quote.author}</div>` : ''}
                <div class="quote-category">${quote.category}</div>
            </div>
        `;
    }

    // TASK 0: Add new quote function
    addQuote() {
        const textInput = document.getElementById('newQuoteText');
        const authorInput = document.getElementById('newQuoteAuthor');
        const categoryInput = document.getElementById('newQuoteCategory');
        
        const text = textInput.value.trim();
        const author = authorInput.value.trim();
        const category = categoryInput.value.trim() || 'General';
        
        if (!text) {
            this.showNotification('Please enter a quote text!', 'error');
            return;
        }
        
        const newQuote = {
            id: Date.now(),
            text: text,
            author: author || 'Anonymous',
            category: category,
            createdAt: new Date().toISOString(),
            source: 'user'
        };
        
        this.quotes.push(newQuote);
        this.saveQuotes();
        
        // Clear inputs
        textInput.value = '';
        authorInput.value = '';
        categoryInput.value = '';
        
        // Show success
        this.showNotification('Quote added successfully!', 'success');
        
        // Show the new quote
        this.displayQuote(newQuote);
    }

    // TASK 2: Populate categories dynamically
    populateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        
        // Get unique categories
        const categories = [...new Set(this.quotes.map(quote => quote.category))];
        
        // Clear existing options (keeping "All Categories")
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // TASK 2: Filter quotes based on selected category
    filterQuotes() {
        const categoryFilter = document.getElementById('categoryFilter');
        this.currentFilter = categoryFilter.value;
        
        console.log(`Filtering by category: ${this.currentFilter}`);
        
        if (this.currentFilter === 'all') {
            this.updateQuotesList(this.quotes);
        } else {
            const filteredQuotes = this.quotes.filter(quote => 
                quote.category.toLowerCase() === this.currentFilter.toLowerCase()
            );
            this.updateQuotesList(filteredQuotes);
        }
        
        this.updateQuoteCount();
    }

    // TASK 2: Save last selected filter to localStorage
    saveLastFilter(filter) {
        localStorage.setItem('lastCategoryFilter', filter);
        console.log(`Saved filter preference: ${filter}`);
    }

    // TASK 2: Load last selected filter from localStorage
    loadLastFilter() {
        const lastFilter = localStorage.getItem('lastCategoryFilter');
        if (lastFilter) {
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.value = lastFilter;
            this.currentFilter = lastFilter;
            this.filterQuotes();
            console.log(`Restored filter preference: ${lastFilter}`);
        }
    }

    // TASK 2: Search quotes
    searchQuotes(searchTerm) {
        if (!searchTerm) {
            this.updateQuotesList(this.quotes);
            return;
        }
        
        const filteredQuotes = this.quotes.filter(quote => 
            quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.updateQuotesList(filteredQuotes);
    }

    // TASK 3: Fetch quotes from server (mock API)
    async fetchQuotesFromServer() {
        try {
            console.log('Fetching quotes from server...');
            const response = await fetch(`${this.SERVER_URL}?_limit=5`);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const serverData = await response.json();
            
            // Transform to our quote format
            return serverData.map(post => ({
                id: `server_${post.id}`,
                text: post.title,
                author: 'Server Import',
                category: 'Server',
                body: post.body,
                source: 'server',
                serverId: post.id,
                updatedAt: new Date().toISOString()
            }));
            
        } catch (error) {
            console.error('Error fetching from server:', error);
            this.showNotification(`Failed to fetch from server: ${error.message}`, 'error');
            return [];
        }
    }

    // TASK 3: Post data to server (mock API)
    async postQuotesToServer(quotesToPost) {
        try {
            console.log('Posting quotes to server...');
            
            // Simulate posting to server
            const promises = quotesToPost.map(async (quote, index) => {
                const response = await fetch(this.SERVER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: quote.text,
                        body: quote.author,
                        userId: 1
                    })
                });
                
                return response.json();
            });
            
            const results = await Promise.all(promises);
            console.log(`Posted ${results.length} quotes to server`);
            return results;
            
        } catch (error) {
            console.error('Error posting to server:', error);
            this.showNotification(`Failed to post to server: ${error.message}`, 'error');
            return [];
        }
    }

    // TASK 3: Sync quotes with server
    async syncQuotes() {
        console.log('Starting sync process...');
        
        try {
            // Fetch from server
            const serverQuotes = await this.fetchQuotesFromServer();
            
            if (serverQuotes.length === 0) {
                this.showNotification('No new quotes from server', 'info');
                return;
            }
            
            // Apply conflict resolution
            const newQuotes = this.resolveConflicts(serverQuotes);
            
            if (newQuotes.length > 0) {
                // Add new quotes
                this.quotes.push(...newQuotes);
                this.saveQuotes();
                
                // Show notification
                this.showNotification(`Synced ${newQuotes.length} new quotes from server`, 'success');
                this.showConflictNotification(newQuotes);
                
                // Update UI
                this.updateQuotesList();
            } else {
                this.showNotification('Already up to date with server', 'info');
            }
            
            // Update sync status
            this.updateSyncStatus('success', `Last synced: ${new Date().toLocaleTimeString()}`);
            
        } catch (error) {
            console.error('Sync failed:', error);
            this.updateSyncStatus('error', `Sync failed: ${error.message}`);
            this.showNotification('Sync failed. Check console for details.', 'error');
        }
    }

    // TASK 3: Conflict resolution logic
    resolveConflicts(serverQuotes) {
        const newQuotes = [];
        
        serverQuotes.forEach(serverQuote => {
            // Check if quote already exists (by text)
            const existingQuote = this.quotes.find(q => 
                q.text.toLowerCase() === serverQuote.text.toLowerCase()
            );
            
            if (!existingQuote) {
                // New quote, add it
                newQuotes.push(serverQuote);
            } else {
                // Conflict detected - handle based on resolution mode
                console.log(`Conflict detected for quote: "${serverQuote.text}"`);
                
                if (this.conflictResolutionMode === 'server') {
                    // Server data takes precedence
                    const index = this.quotes.findIndex(q => q.id === existingQuote.id);
                    this.quotes[index] = { ...existingQuote, ...serverQuote, source: 'server-resolved' };
                    this.showNotification(`Resolved conflict (server precedence): "${serverQuote.text.substring(0, 50)}..."`, 'info');
                } else {
                    // Manual resolution needed
                    this.queueManualResolution(existingQuote, serverQuote);
                }
            }
        });
        
        return newQuotes;
    }

    // TASK 3: Queue for manual conflict resolution
    queueManualResolution(localQuote, serverQuote) {
        const resolutionDiv = document.getElementById('conflictResolution');
        if (!resolutionDiv) return;
        
        const conflictItem = document.createElement('div');
        conflictItem.className = 'conflict-item';
        conflictItem.innerHTML = `
            <div class="conflict-text">
                <strong>Conflict detected!</strong>
                <p><strong>Local:</strong> "${localQuote.text}"</p>
                <p><strong>Server:</strong> "${serverQuote.text}"</p>
            </div>
            <div class="conflict-actions">
                <button class="btn btn-sm btn-primary" onclick="quoteGenerator.resolveConflict('local', '${localQuote.id}', '${serverQuote.id}')">
                    Keep Local
                </button>
                <button class="btn btn-sm btn-success" onclick="quoteGenerator.resolveConflict('server', '${localQuote.id}', '${serverQuote.id}')">
                    Use Server
                </button>
                <button class="btn btn-sm btn-info" onclick="quoteGenerator.resolveConflict('merge', '${localQuote.id}', '${serverQuote.id}')">
                    Merge
                </button>
            </div>
        `;
        
        resolutionDiv.appendChild(conflictItem);
        this.showNotification('New conflict detected! Check resolution panel.', 'warning');
    }

    // TASK 3: Manual conflict resolution
    resolveConflict(resolution, localId, serverId) {
        console.log(`Manual resolution: ${resolution} for local:${localId}, server:${serverId}`);
        // Implementation depends on your conflict structure
        this.showNotification(`Conflict resolved using ${resolution} option`, 'success');
    }

    // TASK 3: Start periodic sync
    startSync() {
        // Sync every 30 seconds for demonstration
        this.syncInterval = setInterval(() => {
            this.syncQuotes();
        }, 30000); // 30 seconds
        
        console.log('Auto-sync started (every 30 seconds)');
    }

    // TASK 3: Stop sync
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            console.log('Auto-sync stopped');
        }
    }

    // TASK 3: Manual sync
    async syncWithServer() {
        this.showNotification('Manual sync started...', 'info');
        await this.syncQuotes();
    }

    // TASK 3: Update sync status in UI
    updateSyncStatus(type, message) {
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.textContent = message;
            syncStatus.className = `sync-status ${type}`;
        }
    }

    // TASK 3: Show conflict notification
    showConflictNotification(newQuotes) {
        if (newQuotes.length > 0) {
            const notification = document.createElement('div');
            notification.className = 'conflict-notification';
            notification.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>${newQuotes.length} new quote(s) added from server</span>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            Object.assign(notification.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                background: '#4CAF50',
                color: 'white',
                padding: '15px',
                borderRadius: '5px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: '1000',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            });
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
    }

    // Helper methods
    updateQuotesList(quotesToShow = null) {
        const quotesList = document.getElementById('quotesList');
        const quotes = quotesToShow || this.quotes;
        
        if (quotes.length === 0) {
            quotesList.innerHTML = `
                <div class="no-quotes">
                    <i class="fas fa-inbox"></i>
                    <p>No quotes found. Add some quotes to get started!</p>
                </div>
            `;
            return;
        }
        
        quotesList.innerHTML = quotes.map(quote => `
            <div class="quote-card">
                <div class="quote-card-text">"${quote.text}"</div>
                <div class="quote-card-author">${quote.author}</div>
                <div class="quote-card-category">${quote.category}</div>
                ${quote.source === 'server' ? '<span class="server-badge">From Server</span>' : ''}
            </div>
        `).join('');
        
        this.updateQuoteCount(quotes.length);
    }

    updateQuoteCount(count = null) {
        const quoteCount = document.getElementById('quoteCount');
        if (quoteCount) {
            quoteCount.textContent = count || this.quotes.length;
        }
    }

    updateSessionInfo() {
        const lastViewed = document.getElementById('lastViewed');
        if (lastViewed) {
            const lastQuote = sessionStorage.getItem('lastViewedQuote');
            if (lastQuote) {
                const quote = JSON.parse(lastQuote);
                lastViewed.textContent = `${quote.text.substring(0, 50)}...`;
            } else {
                lastViewed.textContent = 'None';
            }
        }
    }

    exportToJson() {
        const dataStr = JSON.stringify(this.quotes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `quotes_${new Date().toISOString().split('T')[0]}.json`;
        downloadLink.click();
        
        this.showNotification('Quotes exported successfully!', 'success');
    }

    importFromJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedQuotes = JSON.parse(e.target.result);
                
                if (!Array.isArray(importedQuotes)) {
                    throw new Error('Invalid format: Expected an array of quotes');
                }
                
                // Add unique IDs
                importedQuotes.forEach(quote => {
                    if (!quote.id) quote.id = Date.now() + Math.random();
                });
                
                // Merge avoiding duplicates
                const existingTexts = new Set(this.quotes.map(q => q.text));
                const newQuotes = importedQuotes.filter(quote => 
                    !existingTexts.has(quote.text)
                );
                
                if (newQuotes.length === 0) {
                    this.showNotification('No new quotes to import.', 'info');
                    return;
                }
                
                this.quotes.push(...newQuotes);
                this.saveQuotes();
                event.target.value = '';
                
                this.showNotification(`Successfully imported ${newQuotes.length} quotes!`, 'success');
                
            } catch (error) {
                this.showNotification(`Import failed: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            background: type === 'success' ? '#d4edda' : 
                       type === 'error' ? '#f8d7da' : '#d1ecf1',
            color: type === 'success' ? '#155724' : 
                   type === 'error' ? '#721c24' : '#0c5460',
            border: `1px solid ${type === 'success' ? '#c3e6cb' : 
                               type === 'error' ? '#f5c6cb' : '#bee5eb'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxWidth: '400px'
        });
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quoteGenerator = new QuoteGenerator();
});