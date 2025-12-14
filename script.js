// Dynamic Quote Generator - Complete Solution
class QuoteGenerator {
    constructor() {
        this.quotes = [];
        this.currentFilter = 'all';
        this.SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API
        this.syncInterval = null;
        this.conflictResolutionMode = 'server'; // 'server' or 'manual'
        this.autoSyncEnabled = false;
        
        this.init();
    }

    // Initialize application
    init() {
        this.loadQuotes();
        this.setupEventListeners();
        this.populateCategories(); // TASK 2: Populate categories dynamically
        this.showRandomQuote();
        this.loadLastFilter(); // TASK 2: Restore last selected category
        this.updateQuotesList();
        this.updateSessionInfo();
        this.updateSyncStatus('info', 'Ready to sync');
    }

    // Sample initial quotes
    getInitialQuotes() {
        return [
            { id: 1, text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Inspiration" },
            { id: 2, text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", category: "Life" },
            { id: 3, text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
            { id: 4, text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Wisdom" },
            { id: 5, text: "Whoever is happy will make others happy too.", author: "Anne Frank", category: "Happiness" }
        ];
    }

    // TASK 0 & 1: Load quotes from localStorage
    loadQuotes() {
        const savedQuotes = localStorage.getItem('quotes');
        if (savedQuotes) {
            this.quotes = JSON.parse(savedQuotes);
            console.log(`Loaded ${this.quotes.length} quotes from localStorage`);
        } else {
            this.quotes = this.getInitialQuotes();
            this.saveQuotes();
            console.log(`Initialized with ${this.quotes.length} default quotes`);
        }
    }

    // TASK 0 & 1: Save quotes to localStorage
    saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(this.quotes));
        sessionStorage.setItem('lastUpdate', new Date().toISOString());
        console.log(`Saved ${this.quotes.length} quotes to localStorage`);
    }

    // TASK 0: Setup all event listeners
    setupEventListeners() {
        // TASK 0: Event listener for "Show New Quote" button
        document.getElementById('newQuote').addEventListener('click', () => {
            this.showRandomQuote();
        });

        // TASK 0: Event listener for "Add Quote" button
        document.getElementById('addQuoteBtn').addEventListener('click', () => {
            this.addQuote();
        });

        // TASK 1: Export button
        document.getElementById('exportJson').addEventListener('click', () => {
            this.exportToJson();
        });

        // TASK 1: Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        // TASK 1: Import file change
        document.getElementById('importFile').addEventListener('change', (event) => {
            this.importFromJsonFile(event);
        });

        // TASK 3: Sync button
        document.getElementById('syncBtn').addEventListener('click', () => {
            this.syncWithServer();
        });

        // TASK 3: Auto sync toggle
        document.getElementById('autoSyncToggle').addEventListener('click', () => {
            this.toggleAutoSync();
        });

        // TASK 2: Category filter change
        document.getElementById('categoryFilter').addEventListener('change', (event) => {
            this.filterQuotes();
            this.saveLastFilter(event.target.value);
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (event) => {
            this.searchQuotes(event.target.value);
        });

        // TASK 3: Conflict resolution radio buttons
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
        
        console.log(`Displayed random quote: "${randomQuote.text.substring(0, 50)}..."`);
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

    // TASK 0: Function to add new quote to array and update DOM
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
        
        // TASK 0: Add to quotes array
        this.quotes.push(newQuote);
        
        // TASK 0: Save to localStorage
        this.saveQuotes();
        
        // TASK 0: Update DOM
        this.displayQuote(newQuote);
        this.updateQuotesList();
        this.populateCategories(); // Update categories dropdown
        
        // Clear inputs
        textInput.value = '';
        authorInput.value = '';
        categoryInput.value = '';
        
        this.showNotification('Quote added successfully!', 'success');
        console.log(`Added new quote: "${text.substring(0, 50)}..."`);
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
        
        console.log(`Populated ${categories.length} categories`);
    }

    // TASK 2: Filter and update displayed quotes based on selected category
    filterQuotes() {
        const categoryFilter = document.getElementById('categoryFilter');
        this.currentFilter = categoryFilter.value;
        
        console.log(`Filtering by category: ${this.currentFilter}`);
        
        let filteredQuotes = this.quotes;
        if (this.currentFilter !== 'all') {
            filteredQuotes = this.quotes.filter(quote => 
                quote.category.toLowerCase() === this.currentFilter.toLowerCase()
            );
        }
        
        this.updateQuotesList(filteredQuotes);
        this.updateQuoteCount(filteredQuotes.length);
        
        // Update the displayed quote to match filter
        this.showRandomQuote();
    }

    // TASK 2: Save selected category to local storage
    saveLastFilter(filter) {
        localStorage.setItem('lastCategoryFilter', filter);
        console.log(`Saved filter preference: ${filter}`);
    }

    // TASK 2: Restore last selected category when page loads
    loadLastFilter() {
        const lastFilter = localStorage.getItem('lastCategoryFilter');
        if (lastFilter) {
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.value = lastFilter;
            this.currentFilter = lastFilter;
            console.log(`Restored filter preference: ${lastFilter}`);
        }
    }

    // Search quotes
    searchQuotes(searchTerm) {
        if (!searchTerm) {
            this.updateQuotesList();
            return;
        }
        
        const filteredQuotes = this.quotes.filter(quote => 
            quote.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.updateQuotesList(filteredQuotes);
        this.updateQuoteCount(filteredQuotes.length);
    }

    // TASK 3: Fetch data from server using mock API
    async fetchQuotesFromServer() {
        try {
            console.log('Fetching quotes from server...');
            this.updateSyncStatus('info', 'Fetching from server...');
            
            const response = await fetch(`${this.SERVER_URL}?_limit=5`);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const serverData = await response.json();
            console.log(`Fetched ${serverData.length} quotes from server`);
            
            // Transform to our quote format
            const serverQuotes = serverData.map(post => ({
                id: `server_${post.id}`,
                text: post.title,
                author: 'Server Import',
                category: 'Server',
                body: post.body,
                source: 'server',
                serverId: post.id,
                updatedAt: new Date().toISOString()
            }));
            
            return serverQuotes;
            
        } catch (error) {
            console.error('Error fetching from server:', error);
            this.showNotification(`Failed to fetch from server: ${error.message}`, 'error');
            return [];
        }
    }

    // TASK 3: Post data to server using mock API
    async postQuotesToServer(quotesToPost) {
        try {
            console.log('Posting quotes to server...');
            this.updateSyncStatus('info', 'Posting to server...');
            
            // Simulate posting to server
            const promises = quotesToPost.slice(0, 3).map(async (quote) => {
                const response = await fetch(this.SERVER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: quote.text.substring(0, 50),
                        body: `${quote.author} - ${quote.category}`,
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

    // TASK 3: Sync function with server data and conflict resolution
    async syncQuotes() {
        console.log('Starting sync process...');
        this.updateSyncStatus('info', 'Syncing with server...');
        
        try {
            // Fetch from server
            const serverQuotes = await this.fetchQuotesFromServer();
            
            if (serverQuotes.length === 0) {
                this.showNotification('No new quotes from server', 'info');
                this.updateSyncStatus('info', 'No updates from server');
                return;
            }
            
            // Apply conflict resolution
            const newQuotes = this.resolveConflicts(serverQuotes);
            
            if (newQuotes.length > 0) {
                // Add new quotes
                this.quotes.push(...newQuotes);
                this.saveQuotes(); // Update local storage
                
                // Post local quotes to server (simulated)
                await this.postQuotesToServer(this.quotes.slice(-3));
                
                // Show notifications
                this.showNotification(`Synced ${newQuotes.length} new quotes from server`, 'success');
                this.showConflictNotification(newQuotes);
                
                // Update UI
                this.updateQuotesList();
                this.populateCategories();
                
                this.updateSyncStatus('success', `Synced ${newQuotes.length} quotes at ${new Date().toLocaleTimeString()}`);
            } else {
                this.showNotification('Already up to date with server', 'info');
                this.updateSyncStatus('info', 'Already up to date');
            }
            
        } catch (error) {
            console.error('Sync failed:', error);
            this.updateSyncStatus('error', `Sync failed: ${error.message}`);
            this.showNotification('Sync failed. Check console for details.', 'error');
        }
    }

    // TASK 3: Conflict resolution for server data
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
                // Conflict detected
                console.log(`Conflict detected for quote: "${serverQuote.text.substring(0, 50)}..."`);
                
                if (this.conflictResolutionMode === 'server') {
                    // Server data takes precedence
                    const index = this.quotes.findIndex(q => q.id === existingQuote.id);
                    this.quotes[index] = { 
                        ...existingQuote, 
                        ...serverQuote, 
                        source: 'server-resolved',
                        resolvedAt: new Date().toISOString()
                    };
                    
                    this.showNotification(
                        `Resolved conflict (server precedence): "${serverQuote.text.substring(0, 50)}..."`, 
                        'info'
                    );
                } else {
                    // Manual resolution needed
                    this.queueManualResolution(existingQuote, serverQuote);
                }
            }
        });
        
        console.log(`Resolved conflicts: ${newQuotes.length} new quotes`);
        return newQuotes;
    }

    // TASK 3: Queue for manual conflict resolution
    queueManualResolution(localQuote, serverQuote) {
        const conflictPanel = document.getElementById('conflictResolutionPanel');
        if (!conflictPanel) return;
        
        const conflictItem = document.createElement('div');
        conflictItem.className = 'conflict-item';
        conflictItem.innerHTML = `
            <div class="conflict-text">
                <strong><i class="fas fa-exclamation-circle"></i> Conflict detected!</strong>
                <p><strong>Local:</strong> "${localQuote.text}"</p>
                <p><strong>Server:</strong> "${serverQuote.text}"</p>
            </div>
            <div class="conflict-actions">
                <button class="btn btn-sm btn-primary" onclick="quoteGenerator.resolveConflict('local', ${localQuote.id}, '${serverQuote.id}')">
                    Keep Local
                </button>
                <button class="btn btn-sm btn-success" onclick="quoteGenerator.resolveConflict('server', ${localQuote.id}, '${serverQuote.id}')">
                    Use Server
                </button>
                <button class="btn btn-sm btn-info" onclick="quoteGenerator.resolveConflict('merge', ${localQuote.id}, '${serverQuote.id}')">
                    Merge
                </button>
            </div>
        `;
        
        conflictPanel.querySelector('.conflicts-list').appendChild(conflictItem);
        this.showNotification('New conflict detected! Check resolution panel.', 'warning');
    }

    // TASK 3: Manual conflict resolution
    resolveConflict(resolution, localId, serverId) {
        console.log(`Manual resolution: ${resolution} for local:${localId}, server:${serverId}`);
        
        // Find and update the quote
        const quoteIndex = this.quotes.findIndex(q => q.id === localId);
        if (quoteIndex !== -1) {
            if (resolution === 'server') {
                this.quotes[quoteIndex].source = 'server-manual';
                this.quotes[quoteIndex].resolvedAt = new Date().toISOString();
            }
            
            this.saveQuotes();
            this.showNotification(`Conflict resolved using ${resolution} option`, 'success');
            
            // Remove from conflict panel
            const conflictPanel = document.getElementById('conflictResolutionPanel');
            const conflictItems = conflictPanel.querySelectorAll('.conflict-item');
            if (conflictItems.length > 0) {
                conflictItems[0].remove();
            }
        }
    }

    // TASK 3: Manual sync
    async syncWithServer() {
        this.showNotification('Manual sync started...', 'info');
        await this.syncQuotes();
    }

    // TASK 3: Toggle auto sync
    toggleAutoSync() {
        this.autoSyncEnabled = !this.autoSyncEnabled;
        const button = document.getElementById('autoSyncToggle');
        
        if (this.autoSyncEnabled) {
            this.startSync();
            button.innerHTML = '<i class="fas fa-pause"></i> Stop Auto Sync';
            button.className = 'btn btn-danger';
            this.showNotification('Auto sync started (every 60 seconds)', 'info');
        } else {
            this.stopSync();
            button.innerHTML = '<i class="fas fa-play"></i> Start Auto Sync';
            button.className = 'btn btn-secondary';
            this.showNotification('Auto sync stopped', 'info');
        }
    }

    // TASK 3: Periodically check for new quotes from server
    startSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        // Sync every 60 seconds
        this.syncInterval = setInterval(() => {
            this.syncQuotes();
        }, 60000); // 60 seconds
        
        console.log('Auto-sync started (every 60 seconds)');
    }

    // TASK 3: Stop auto sync
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('Auto-sync stopped');
        }
    }

    // TASK 3: Update sync status in UI
    updateSyncStatus(type, message) {
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;
            syncStatus.className = `sync-status ${type}`;
        }
    }

    // TASK 3: Show conflict notification
    showConflictNotification(newQuotes) {
        if (newQuotes.length > 0) {
            const notification = document.createElement('div');
            notification.className = 'notification success';
            notification.innerHTML = `
                <i class="fas fa-sync-alt"></i>
                <span>${newQuotes.length} new quote(s) added from server</span>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
    }

    // Helper: Update quotes list display
    updateQuotesList(quotesToShow = null) {
        const quotesList = document.getElementById('quotesList');
        const quotes = quotesToShow || this.quotes;
        
        if (quotes.length === 0) {
            quotesList.innerHTML = `
                <div class="no-quotes" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 20px; opacity: 0.3;"></i>
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
                ${quote.source === 'server' || quote.source === 'server-resolved' || quote.source === 'server-manual' 
                    ? '<span class="server-badge">From Server</span>' 
                    : ''}
            </div>
        `).join('');
        
        this.updateQuoteCount(quotes.length);
    }

    // Helper: Update quote count
    updateQuoteCount(count = null) {
        const quoteCount = document.getElementById('quoteCount');
        if (quoteCount) {
            quoteCount.textContent = count || this.quotes.length;
        }
    }

    // Helper: Update session info
    updateSessionInfo() {
        const lastViewed = document.getElementById('lastViewed');
        if (lastViewed) {
            const lastQuote = sessionStorage.getItem('lastViewedQuote');
            if (lastQuote) {
                try {
                    const quote = JSON.parse(lastQuote);
                    lastViewed.textContent = `"${quote.text.substring(0, 50)}${quote.text.length > 50 ? '...' : ''}"`;
                } catch (e) {
                    lastViewed.textContent = 'Error loading last quote';
                }
            } else {
                lastViewed.textContent = 'None';
            }
        }
    }

    // TASK 1: Export to JSON
    exportToJson() {
        const dataStr = JSON.stringify(this.quotes, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `quotes_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        this.showNotification('Quotes exported successfully!', 'success');
        console.log('Exported quotes to JSON');
    }

    // TASK 1: Import from JSON file
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
                this.updateQuotesList();
                this.populateCategories();
                
                console.log(`Imported ${newQuotes.length} quotes from JSON`);
                
            } catch (error) {
                this.showNotification(`Import failed: ${error.message}`, 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add close button event
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Add to document
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        console.log(`Notification: ${type} - ${message}`);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quoteGenerator = new QuoteGenerator();
    console.log('Dynamic Quote Generator initialized');
});