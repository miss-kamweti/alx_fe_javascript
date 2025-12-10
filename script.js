// Quote Generator Application
class QuoteGenerator {
    constructor() {
        this.quotes = [];
        this.currentFilter = 'all';
        this.lastSyncTime = null;
        this.SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Mock API
        
        // Initialize the application
        this.init();
    }

    init() {
        // Load quotes from localStorage
        this.loadQuotes();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Populate categories
        this.populateCategories();
        
        // Display initial quote
        this.showRandomQuote();
        
        // Load last filter from sessionStorage
        this.loadLastFilter();
        
        // Load session info
        this.updateSessionInfo();
        
        // Update quotes list
        this.updateQuotesList();
        
        // Initial sync with server
        setTimeout(() => this.syncWithServer(), 1000);
    }

    // Sample initial quotes
    getInitialQuotes() {
        return [
            {
                id: 1,
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs",
                category: "Inspiration"
            },
            {
                id: 2,
                text: "Life is what happens to you while you're busy making other plans.",
                author: "John Lennon",
                category: "Life"
            },
            {
                id: 3,
                text: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt",
                category: "Dreams"
            },
            {
                id: 4,
                text: "It is during our darkest moments that we must focus to see the light.",
                author: "Aristotle",
                category: "Wisdom"
            },
            {
                id: 5,
                text: "Whoever is happy will make others happy too.",
                author: "Anne Frank",
                category: "Happiness"
            },
            {
                id: 6,
                text: "You must be the change you wish to see in the world.",
                author: "Mahatma Gandhi",
                category: "Change"
            }
        ];
    }

    // Load quotes from localStorage
    loadQuotes() {
        const savedQuotes = localStorage.getItem('quotes');
        if (savedQuotes) {
            this.quotes = JSON.parse(savedQuotes);
        } else {
            this.quotes = this.getInitialQuotes();
            this.saveQuotes();
        }
    }

    // Save quotes to localStorage
    saveQuotes() {
        localStorage.setItem('quotes', JSON.stringify(this.quotes));
        
        // Also save to sessionStorage for demonstration
        sessionStorage.setItem('lastUpdate', new Date().toISOString());
        
        // Update quotes list
        this.updateQuotesList();
        
        // Update categories
        this.populateCategories();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // New quote button
        document.getElementById('newQuote').addEventListener('click', () => {
            this.showRandomQuote();
        });

        // Add quote button
        document.getElementById('addQuoteBtn').addEventListener('click', () => {
            this.addQuote();
        });

        // Export quotes button
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

        // Category filter change
        document.getElementById('categoryFilter').addEventListener('change', (event) => {
            this.filterQuotes();
            // Save filter preference
            sessionStorage.setItem('lastFilter', event.target.value);
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (event) => {
            this.searchQuotes(event.target.value);
        });
    }

    // Show random quote
    showRandomQuote() {
        if (this.quotes.length === 0) return;
        
        let filteredQuotes = this.quotes;
        if (this.currentFilter !== 'all') {
            filteredQuotes = this.quotes.filter(quote => 
                quote.category === this.currentFilter
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

    // Display quote in the UI
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

    // Add new quote
    addQuote() {
        const textInput = document.getElementById('newQuoteText');
        const authorInput = document.getElementById('newQuoteAuthor');
        const categoryInput = document.getElementById('newQuoteCategory');
        
        const text = textInput.value.trim();
        const author = authorInput.value.trim();
        const category = categoryInput.value.trim() || 'General';
        
        if (!text) {
            alert('Please enter a quote text!');
            return;
        }
        
        const newQuote = {
            id: Date.now(), // Simple ID generation
            text: text,
            author: author || 'Anonymous',
            category: category
        };
        
        this.quotes.push(newQuote);
        this.saveQuotes();
        
        // Clear inputs
        textInput.value = '';
        authorInput.value = '';
        categoryInput.value = '';
        
        // Show success message
        this.showNotification('Quote added successfully!', 'success');
        
        // Show the new quote
        this.displayQuote(newQuote);
    }

    // Populate categories in filter dropdown
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

    // Filter quotes by category
    filterQuotes() {
        const categoryFilter = document.getElementById('categoryFilter');
        this.currentFilter = categoryFilter.value;
        
        if (this.currentFilter === 'all') {
            this.updateQuotesList();
        } else {
            const filteredQuotes = this.quotes.filter(quote => 
                quote.category === this.currentFilter
            );
            this.updateQuotesList(filteredQuotes);
        }
        
        // Update quote count
        this.updateQuoteCount();
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
    }

    // Update quotes list display
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
                <button class="delete-quote" data-id="${quote.id}" title="Delete quote">
                    <i class="fas fa-times"></i>
                </button>
                <div class="quote-card-text">"${quote.text}"</div>
                <div class="quote-card-author">${quote.author}</div>
                <div class="quote-card-category">${quote.category}</div>
            </div>
        `).join('');
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-quote').forEach(button => {
            button.addEventListener('click', (event) => {
                const id = parseInt(event.currentTarget.dataset.id);
                this.deleteQuote(id);
            });
        });
        
        // Update quote count
        this.updateQuoteCount(quotes.length);
    }

    // Delete a quote
    deleteQuote(id) {
        if (confirm('Are you sure you want to delete this quote?')) {
            this.quotes = this.quotes.filter(quote => quote.id !== id);
            this.saveQuotes();
            this.showNotification('Quote deleted successfully!', 'success');
        }
    }

    // Update quote count
    updateQuoteCount(count = null) {
        const quoteCount = document.getElementById('quoteCount');
        quoteCount.textContent = count || this.quotes.length;
    }

    // Export quotes to JSON file
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
    }

    // Import quotes from JSON file
    importFromJsonFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedQuotes = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!Array.isArray(importedQuotes)) {
                    throw new Error('Invalid format: Expected an array of quotes');
                }
                
                // Add unique IDs to imported quotes
                importedQuotes.forEach(quote => {
                    if (!quote.id) {
                        quote.id = Date.now() + Math.random();
                    }
                });
                
                // Merge with existing quotes (avoiding duplicates)
                const existingIds = new Set(this.quotes.map(q => q.text));
                const newQuotes = importedQuotes.filter(quote => 
                    !existingIds.has(quote.text)
                );
                
                if (newQuotes.length === 0) {
                    this.showNotification('No new quotes to import.', 'info');
                    return;
                }
                
                this.quotes.push(...newQuotes);
                this.saveQuotes();
                
                // Clear file input
                event.target.value = '';
                
                this.showNotification(`Successfully imported ${newQuotes.length} quotes!`, 'success');
            } catch (error) {
                this.showNotification(`Import failed: ${error.message}`, 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    // Sync with server (mock implementation)
    async syncWithServer() {
        const syncStatus = document.getElementById('syncStatus');
        
        try {
            syncStatus.textContent = 'Syncing with server...';
            syncStatus.className = 'sync-status info';
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Fetch from mock API
            const response = await fetch(`${this.SERVER_URL}?_limit=3`);
            if (!response.ok) throw new Error('Server request failed');
            
            const serverData = await response.json();
            
            // Transform server data to our quote format
            const serverQuotes = serverData.map(post => ({
                id: Date.now() + post.id,
                text: post.title,
                author: 'Server Import',
                category: 'Server',
                source: 'server'
            }));
            
            // Conflict resolution: Server data takes precedence for duplicates
            const existingTexts = new Set(this.quotes.map(q => q.text));
            const newQuotes = serverQuotes.filter(quote => 
                !existingTexts.has(quote.text)
            );
            
            if (newQuotes.length > 0) {
                this.quotes.push(...newQuotes);
                this.saveQuotes();
                this.showNotification(`Synced ${newQuotes.length} new quotes from server`, 'success');
            } else {
                this.showNotification('Already up to date with server', 'info');
            }
            
            this.lastSyncTime = new Date();
            syncStatus.textContent = `Last synced: ${this.lastSyncTime.toLocaleTimeString()}`;
            syncStatus.className = 'sync-status success';
            
        } catch (error) {
            console.error('Sync error:', error);
            syncStatus.textContent = `Sync failed: ${error.message}`;
            syncStatus.className = 'sync-status error';
            this.showNotification('Sync failed. Check console for details.', 'error');
        }
    }

    // Load last filter from sessionStorage
    loadLastFilter() {
        const lastFilter = sessionStorage.getItem('lastFilter');
        if (lastFilter) {
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.value = lastFilter;
            this.currentFilter = lastFilter;
            this.filterQuotes();
        }
    }

    // Update session info
    updateSessionInfo() {
        const lastViewed = document.getElementById('lastViewed');
        const lastQuote = sessionStorage.getItem('lastViewedQuote');
        
        if (lastQuote) {
            const quote = JSON.parse(lastQuote);
            lastViewed.textContent = `${quote.text.substring(0, 50)}...`;
        } else {
            lastViewed.textContent = 'None';
        }
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
        
        // Style the notification
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
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quoteGenerator = new QuoteGenerator();
    
    // Make it available globally for debugging
    window.quoteGenerator = quoteGenerator;
});