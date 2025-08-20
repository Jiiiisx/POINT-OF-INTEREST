// Enhanced Sidebar Functionality

class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.overlay = document.getElementById('sidebarOverlay');
        this.salesList = document.querySelector('.sales-list');
        this.menuItems = document.querySelectorAll('.menu-list li');
        
        this.init();
    }

    init() {
        this.setupToggle();
        this.setupSalesList();
        this.setupMenuStates();
        this.loadSavedState();
    }

    setupToggle() {
        if (!this.sidebarToggle || !this.sidebar) return;

        this.sidebarToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Close sidebar when clicking overlay
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
    }

    setupSalesList() {
        if (!this.salesList) return;

        // Clear existing content
        this.salesList.innerHTML = '';

        // Add "All Sales" option
        const allSalesItem = this.createSalesItem('All Sales', 'all', true);
        this.salesList.appendChild(allSalesItem);

        // Add dynamic sales from Google Sheets
        this.loadSalesFromSheets();
    }

    createSalesItem(name, id, isActive = false) {
        const li = document.createElement('li');
        li.className = `sales-item ${isActive ? 'active' : ''}`;
        li.dataset.salesId = id;
        li.dataset.salesName = name;
        li.innerHTML = `
            <i class="fas fa-user-tie"></i>
            <span>${name}</span>
        `;
        return li;
    }

    loadSalesFromSheets() {
        // Placeholder for dynamic loading
        // This would be populated from Google Sheets API
    }

    loadSavedState() {
        // Placeholder for saved state loading
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SidebarManager();
});
