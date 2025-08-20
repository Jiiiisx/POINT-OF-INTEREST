// Google Sheets Integration Script - Enhanced Version with White Screen Prevention

// Global variables for Google API client
let gapiInited = false;
let gisLoadedFlag = false;
let currentIdToken = null;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// Enhanced error handling and logging
const ErrorHandler = {
  log: (message, level = 'info') => {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] ${message}`);
  },
  
  handleError: (error, context) => {
    ErrorHandler.log(`Error in ${context}: ${error.message}`, 'error');
    ErrorHandler.showUserError(`Terjadi kesalahan: ${error.message}`);
  },
  
  showUserError: (message) => {
    const errorDisplay = document.getElementById('errorDisplay');
    if (errorDisplay) {
      errorDisplay.innerHTML = `
        <div class="alert alert-danger" style="margin: 20px; padding: 15px; border-radius: 5px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;">
          <i class="fas fa-exclamation-triangle"></i> ${message}
          <button onclick="this.parentElement.parentElement.style.display='none'" 
                  style="float: right; background: none; border: none; font-size: 20px; cursor: pointer;">
            &times;
          </button>
        </div>
      `;
      errorDisplay.style.display = 'block';
    }
  }
};

// Enhanced initialization with retry mechanism
window.gapiLoaded = function() {
  console.log('gapiLoaded called');
  ErrorHandler.log('gapiLoaded: Google API client library loaded.');
  gapi.load('client', initializeGapiClient);
};

async function initializeGapiClient() {
  console.log('initializeGapiClient called');
  try {
    ErrorHandler.log('initializeGapiClient: Initializing gapi.client...');
    
    if (!CONFIG || !CONFIG.API_KEY || !CONFIG.SCOPES) {
      throw new Error('Configuration missing. Please check config.js');
    }
    
    await gapi.client.init({
      apiKey: CONFIG.API_KEY,
      discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
      scope: CONFIG.SCOPES,
    });
    
    gapiInited = true;
    ErrorHandler.log('GAPI client initialized successfully');
    maybeRenderSignInButton();
    
  } catch (error) {
    ErrorHandler.handleError(error, 'initializeGapiClient');
    initializationAttempts++;
    
    if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
      ErrorHandler.log(`Retrying initialization... (${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS})`);
      setTimeout(initializeGapiClient, 2000 * initializationAttempts);
    }
  }
}

window.gisLoaded = function() {
  console.log('gisLoaded called');
  try {
    ErrorHandler.log('gisLoaded: Google Identity Services loaded.');
    
    if (!CONFIG || !CONFIG.CLIENT_ID) {
      throw new Error('CLIENT_ID missing in configuration');
    }
    
    google.accounts.id.initialize({
      client_id: CONFIG.CLIENT_ID,
      callback: window.handleCredentialResponse,
    });
    
    gisLoadedFlag = true;
    ErrorHandler.log('GIS initialized successfully');
    maybeRenderSignInButton();
    
  } catch (error) {
    ErrorHandler.handleError(error, 'gisLoaded');
  }
};

window.handleCredentialResponse = function(response) {
  console.log('handleCredentialResponse called');
  try {
    ErrorHandler.log("Credential response received");
    
    if (response.credential) {
      currentIdToken = response.credential;
      updateSigninStatus(true);
      ErrorHandler.log("Login successful");
    } else {
      throw new Error("No credential in response");
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'handleCredentialResponse');
    updateSigninStatus(false);
  }
};

function maybeRenderSignInButton() {
  console.log('maybeRenderSignInButton called');
  try {
    if (gapiInited && gisLoadedFlag) {
      console.log('gapiInited and gisLoadedFlag are true, rendering button');
      const signInButtonContainer = document.getElementById('g_id_onload');
      if (signInButtonContainer) {
        console.log('signInButtonContainer found');
        google.accounts.id.renderButton(
          signInButtonContainer,
          { 
            theme: "outline", 
            size: "large", 
            text: "signin_with", 
            shape: "rectangular", 
            width: "250" 
          }
        );
        updateSigninStatus(false);
      } else {
        console.log('signInButtonContainer not found');
      }
    } else {
        console.log('gapiInited or gisLoadedFlag is false');
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'maybeRenderSignInButton');
  }
}

function handleSignoutClick() {
  try {
    console.log('handleSignoutClick called');
    if (typeof google !== 'undefined' && typeof google.accounts !== 'undefined' && typeof google.accounts.id !== 'undefined') {
      console.log('google.accounts.id is defined. Attempting disableAutoSelect.');
      google.accounts.id.disableAutoSelect();
    } else {
      console.log('google.accounts.id is NOT defined. Skipping disableAutoSelect.');
    }
    currentIdToken = null;
    updateSigninStatus(false);
    sessionStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isLoggedIn'); // Add this line
    ErrorHandler.log("User signed out");
  } catch (error) {
    ErrorHandler.handleError(error, 'handleSignoutClick');
  }
}

function updateSigninStatus(isSignedIn) {
  try {
    ErrorHandler.log(`Updating sign-in status: ${isSignedIn}`);
    
    const signInWrapper = document.querySelector('.sign-in');
    const mainContent = document.getElementById('main-content');
    const signOutButton = document.getElementById('sign-out-button');
    const wavyLines = document.querySelector('.wavy-lines');

    if (!signInWrapper || !mainContent || !signOutButton) {
      ErrorHandler.log('Required DOM elements not found for sign-in status update');
      return;
    }

    if (isSignedIn) {
      signInWrapper.style.display = 'none';
      mainContent.style.display = 'block';
      signOutButton.style.display = 'block';

      // Hide wavy lines when logged in
      if (wavyLines) {
        wavyLines.style.display = 'none';
      }

      // Set the gapi client token after successful sign-in
      if (currentIdToken) {
        gapi.client.setToken({
          access_token: currentIdToken
        });
        ErrorHandler.log('GAPI client token set.');
      }
      
      // Force dashboard to appear immediately after login
      mainContent.style.display = 'block';
      signInWrapper.style.display = 'none';
      
      // Ensure dashboard is properly initialized
      setTimeout(() => {
        try {
          // Force display to ensure visibility
          mainContent.style.display = 'block';
          signInWrapper.style.display = 'none';
          
          // Initialize Google Sheets integration
          if (window.googleSheetsIntegration) {
            window.googleSheetsIntegration.init().then(() => {
              console.log('✅ Dashboard initialized successfully');
              if (window.googleSheetsIntegration.refreshData) {
                window.googleSheetsIntegration.refreshData();
              }
            }).catch(error => {
              console.error('❌ Dashboard initialization error:', error);
            });
          } else {
            console.warn('⚠️ googleSheetsIntegration not ready, using fallback');
            // Ensure dashboard is visible even without data
            mainContent.style.display = 'block';
            signInWrapper.style.display = 'none';
            
            // Create fallback data display
            const tbody = document.querySelector('#customerTable tbody');
            if (tbody) {
              tbody.innerHTML = `
                <tr>
                  <td colspan="10" style="text-align: center; padding: 40px;">
                    <i class="fas fa-info-circle" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
                    <br>
                    <strong>Dashboard Loaded Successfully</strong>
                    <br>
                    <small>Please wait while data is being loaded...</small>
                  </td>
                </tr>
              `;
            }
          }
        } catch (error) {
          console.error('❌ Dashboard display error:', error);
          // Ensure dashboard appears even on error
          mainContent.style.display = 'block';
          signInWrapper.style.display = 'none';
        }
      }, 50);
      
      sessionStorage.setItem('isLoggedIn', 'true');
    } else {
      signInWrapper.style.display = 'flex';
      mainContent.style.display = 'none';
      signOutButton.style.display = 'none';
      
      // Show wavy lines when logged out
      if (wavyLines) {
        wavyLines.style.display = 'block';
      }
      
      // Clear the gapi client token on sign-out
      gapi.client.setToken('');
      ErrorHandler.log('GAPI client token cleared.');
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'updateSigninStatus');
  }
}


// Safe wrapper for googleSheetsIntegration.refreshData
function safeRefreshData() {
  if (typeof googleSheetsIntegration !== 'undefined' && googleSheetsIntegration.refreshData) {
    googleSheetsIntegration.refreshData();
  } else {
    console.warn('googleSheetsIntegration not ready, retrying...');
    setTimeout(safeRefreshData, 500);
  }
}

// Global functions with error handling

function closeEditModal() {
  try {
    const editModal = document.getElementById('editModal');
    if (editModal) {
      editModal.style.display = 'none';
      editModal.classList.remove('show');
      
      // Reset form when closing
      const editForm = document.getElementById('editForm');
      if (editForm) {
        editForm.reset();
      }
      
      // Clear any error messages
      const errorDisplay = document.getElementById('errorDisplay');
      if (errorDisplay) {
        errorDisplay.style.display = 'none';
      }
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'closeEditModal');
  }
}

// Enhanced DOMContentLoaded with white screen prevention
document.addEventListener('DOMContentLoaded', () => {
  try {
    ErrorHandler.log('DOM Content Loaded - Initializing application...');
    
    // Prevent white screen by ensuring elements exist
    const requiredElements = ['sign-in-container', 'main-content', 'errorDisplay'];
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
      ErrorHandler.log(`Missing elements: ${missingElements.join(', ')}`);
      return;
    }
    
    // Check login status
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    ErrorHandler.log(`Login status: ${isLoggedIn}`);
    
    if (isLoggedIn) {
      updateSigninStatus(true);
    }
    
    // Initialize UI components
    initializeUIComponents();
    
    // Sidebar toggle is now handled by SidebarManager
    // No need for duplicate initialization
    
  } catch (error) {
    ErrorHandler.handleError(error, 'DOMContentLoaded');
  }
});

function initializeUIComponents() {
  try {
    // Modal and button event listeners
    const addSalesModal = document.getElementById('addSalesModal');
    const openAddSalesBtn = document.getElementById('openAddSalesBtn');
    const closeAddSalesModal = document.getElementById('closeAddSalesModal');
    const cancelAddSalesBtn = document.getElementById('cancelAddSalesBtn');
    const editModal = document.getElementById('editModal');
    const toggleCustomerFormBtn = document.getElementById('toggle-customer-form');
    const addCustomerFormContainer = document.getElementById('add-customer-form-container');
    const overviewBtn = document.getElementById('overview-btn');

    // Toggle Add Customer Form
    if (toggleCustomerFormBtn) {
      toggleCustomerFormBtn.addEventListener('click', () => {
        const addCustomerSection = document.getElementById('add-customer-section');
        if (addCustomerSection) {
          const isVisible = addCustomerSection.style.display === 'block';
          addCustomerSection.style.display = isVisible ? 'none' : 'block';
          
          // Reset form when opening
          if (!isVisible) {
            resetAddCustomerForm();
            populateSalesDropdown();
          }
          
          // Scroll to form
          if (!isVisible) {
            addCustomerSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }
    
    // Close form button
    const closeFormBtn = document.getElementById('closeFormBtn');
    if (closeFormBtn) {
      closeFormBtn.addEventListener('click', () => {
        const addCustomerSection = document.getElementById('add-customer-section');
        if (addCustomerSection) {
          addCustomerSection.style.display = 'none';
          resetAddCustomerForm();
        }
      });
    }
    
    // Cancel button
    const cancelAddCustomerBtn = document.getElementById('cancelAddCustomer');
    if (cancelAddCustomerBtn) {
      cancelAddCustomerBtn.addEventListener('click', () => {
        const addCustomerSection = document.getElementById('add-customer-section');
        if (addCustomerSection) {
          addCustomerSection.style.display = 'none';
          resetAddCustomerForm();
        }
      });
    }
    
    // Initialize Add Customer Form
    initializeAddCustomerForm();

    // Populate sales dropdown
    populateSalesDropdown();

    // Open modal
    if (openAddSalesBtn && addSalesModal) {
      openAddSalesBtn.addEventListener('click', () => {
        addSalesModal.classList.add('show');
      });
    }

    // Close modal
    if(closeAddSalesModal && addSalesModal) {
      closeAddSalesModal.addEventListener('click', () => {
        addSalesModal.classList.remove('show');
      });
    }

    if (cancelAddSalesBtn && addSalesModal) {
      cancelAddSalesBtn.addEventListener('click', () => {
        addSalesModal.classList.remove('show');
      });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === addSalesModal) addSalesModal.classList.remove('show');
      if (event.target === editModal) editModal.classList.remove('show');
    });

    // Close modal with ESC key
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const editModal = document.getElementById('editModal');
        const addSalesModal = document.getElementById('addSalesModal');
        
        if (editModal && editModal.classList.contains('show')) {
          closeEditModal();
        }
        
        if (addSalesModal && addSalesModal.classList.contains('show')) {
          addSalesModal.classList.remove('show');
        }
      }
    });

    // Show all data when overview is clicked
    if (overviewBtn) {
      overviewBtn.addEventListener('click', () => {
        googleSheetsIntegration.filterBySales('All');
        document.querySelectorAll('.sales-item').forEach(i => i.classList.remove('active'));
        overviewBtn.classList.add('active');
      });
    }

    // Handle form submissions
    setupFormHandlers();
    
  } catch (error) {
    ErrorHandler.handleError(error, 'initializeUIComponents');
  }
}

function setupFormHandlers() {
  try {
    // Handle form tambah sales
    const addSalesForm = document.getElementById('addSalesForm');
    if (addSalesForm) {
      addSalesForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const salesName = document.getElementById('salesName').value.trim();
        if (salesName) {
          alert('Fitur tambah sales akan segera tersedia');
          document.getElementById('addSalesModal').classList.remove('show');
          addSalesForm.reset();
        }
      });
    }

// Handle edit form submission
    const editForm = document.getElementById('editForm');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const index = parseInt(document.getElementById('editRowIndex').value);
            
            const customerData = {
                odp_terdekat: document.getElementById('editOdp').value,
                nama: document.getElementById('editNama').value,
                alamat: document.getElementById('editAlamat').value,
                no_telepon: document.getElementById('editTelepon').value,
                nama_sales: document.getElementById('editSales').value,
                visit: document.getElementById('editVisit').value,
                keterangan: document.getElementById('editKeterangan').value,
                status: document.getElementById('editStatus').value,
                keterangan_tambahan: document.getElementById('editKeteranganTambahan').value
            };

            if (googleSheetsCRUD) {
                await googleSheetsCRUD.updateCustomer(index, customerData);
                console.log('✅ Customer updated successfully');
                closeEditModal();
                safeRefreshData();
            } else {
                throw new Error('Google Sheets CRUD not initialized');
            }

        } catch (error) {
            console.error('❌ Update row error:', error);
            ErrorHandler.handleError(error, 'editForm.submit');
        }
      });
    }
  } catch (error) {
    ErrorHandler.handleError(error, 'setupFormHandlers');
  }
}

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  // Check if this is the specific refreshData error
  if (event.message.includes('refreshData') && event.message.includes('undefined')) {
    console.warn('Caught refreshData undefined error - this is expected during initialization');
    return; // Don't show this specific error to user
  }
  ErrorHandler.handleError(new Error(event.message), 'Global Error');
});

/**
 * Menghapus baris data dari Google Spreadsheet menggunakan GoogleSheetsCRUD
 * @param {number} rowIndex Indeks baris data yang akan dihapus (0-indexed dari data yang ditampilkan, setelah header).
 */
async function deleteCustomerRow(rowIndex) {
    try {
        ErrorHandler.log(`Attempting to delete row at index: ${rowIndex}`);

        if (googleSheetsCRUD) {
            await googleSheetsCRUD.deleteCustomer(rowIndex);
            ErrorHandler.log(`Row ${rowIndex} deleted successfully from Google Sheets.`);
            ErrorHandler.showUserError('Data pelanggan berhasil dihapus!');
            safeRefreshData();
        } else {
            throw new Error('Google Sheets CRUD not initialized');
        }

    } catch (error) {
        ErrorHandler.handleError(error, `deleteCustomerRow for index ${rowIndex}`);
        ErrorHandler.showUserError(`Gagal menghapus data: ${error.message}`);
    }
}


window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handleError(new Error(event.reason), 'Unhandled Promise Rejection');
});

// Listen for googleSheetsIntegration ready event
document.addEventListener('googleSheetsIntegrationReady', () => {
  console.log('googleSheetsIntegration is now ready');
  safeRefreshData();
});

// Initialize googleSheetsIntegration safely
function initializeGoogleSheetsIntegration() {
  if (typeof googleSheetsIntegration === 'undefined') {
    console.log('Waiting for googleSheetsIntegration to load...');
    setTimeout(initializeGoogleSheetsIntegration, 1000);
  } else {
    console.log('googleSheetsIntegration loaded successfully');
    // Ensure it's properly initialized
    if (googleSheetsIntegration.isInitialized) {
      safeRefreshData();
    }
  }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', initializeGoogleSheetsIntegration);

// Sidebar toggle functionality has been moved to sidebar-manager.js
// The SidebarManager class now handles all sidebar interactions

// Add Customer Form Functions
function initializeAddCustomerForm() {
  try {
    const addCustomerForm = document.getElementById('addCustomerForm');
    const cancelAddCustomerBtn = document.getElementById('cancelAddCustomer');
    
    if (addCustomerForm) {
      addCustomerForm.addEventListener('submit', handleAddCustomerSubmit);
    }
    
    if (cancelAddCustomerBtn) {
      cancelAddCustomerBtn.addEventListener('click', () => {
        const addCustomerFormContainer = document.getElementById('add-customer-form-container');
        if (addCustomerFormContainer) {
          addCustomerFormContainer.style.display = 'none';
        }
        resetAddCustomerForm();
      });
    }
    
  } catch (error) {
    ErrorHandler.handleError(error, 'initializeAddCustomerForm');
  }
}



function populateSalesDropdown() {
  try {
    const salesSelect = document.getElementById('assignedSales');
    const editSalesSelect = document.getElementById('editSales');
    
    // Only proceed if they are select elements
    if (!salesSelect || salesSelect.tagName !== 'SELECT' || 
        !editSalesSelect || editSalesSelect.tagName !== 'SELECT') {
      return; 
    }
    
    // Clear existing options
    salesSelect.innerHTML = '<option value="">Pilih Sales</option>';
    editSalesSelect.innerHTML = '<option value="">Pilih Sales</option>';
    
    // Get sales from the sidebar
    const salesItems = document.querySelectorAll('.sales-item');
    salesItems.forEach(item => {
      const salesName = item.textContent.trim();
      if (salesName && salesName !== 'All') {
        const option1 = new Option(salesName, salesName);
        const option2 = new Option(salesName, salesName);
        salesSelect.add(option1);
        editSalesSelect.add(option2);
      }
    });
    
  } catch (error) {
    ErrorHandler.handleError(error, 'populateSalesDropdown');
  }
}

async function handleAddCustomerSubmit(e) {
  e.preventDefault();

  if (!googleSheetsCRUD) {
    ErrorHandler.showUserError('Google Sheets CRUD belum diinisialisasi. Silakan refresh halaman.');
    return;
  }
  
  try {
    const formData = new FormData(e.target);
    const customerData = Object.fromEntries(formData.entries());
    
    // Validate required fields
    if (!customerData.nama || !customerData.no_telepon || !customerData.alamat || !customerData.odp_terdekat || !customerData.nama_sales) {
      ErrorHandler.showUserError('Mohon lengkapi semua field yang wajib diisi');
      return;
    }
    
    // Validate customer data
    googleSheetsCRUD.validateCustomerData(customerData);
    
    // Show loading
    const saveBtn = document.getElementById('saveCustomer');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
    saveBtn.disabled = true;
    
    // Prepare data for Google Sheets
    const customerDataForSheets = {
        odp_terdekat: customerData.odp_terdekat || '',
        nama: customerData.nama || '',
        alamat: customerData.alamat || '',
        no_telepon: customerData.no_telepon || '',
        nama_sales: customerData.nama_sales || '',
        visit: customerData.visit || 'Not Visited',
        keterangan: customerData.keterangan || '',
        status: customerData.status || 'Baru',
        keterangan_tambahan: customerData.keterangan_tambahan || ''
    };
    
    // Add new customer using GoogleSheetsCRUD
    await googleSheetsCRUD.addCustomer(customerDataForSheets);
    
    // Success message
    ErrorHandler.showUserError('Calon pelanggan berhasil ditambahkan!');
    
    // Reset form and hide
    resetAddCustomerForm();
    const addCustomerSection = document.getElementById('add-customer-section');
    if (addCustomerSection) {
      addCustomerSection.style.display = 'none';
    }
    
    // Refresh data
    safeRefreshData();
    
  } catch (error) {
    ErrorHandler.handleError(error, 'handleAddCustomerSubmit');
  } finally {
    // Reset button state
    const saveBtn = document.getElementById('saveCustomer');
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Simpan Calon Pelanggan';
    saveBtn.disabled = false;
  }
}

function resetAddCustomerForm() {
  try {
    const form = document.getElementById('addCustomerForm');
    if (form) {
      form.reset();
    }
    
    // Reset any validation states
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.classList.remove('error');
    });
    
  } catch (error) {
    ErrorHandler.handleError(error, 'resetAddCustomerForm');
  }
}

// Update the populateSalesDropdown function to be called when sales data is loaded
// Wait for googleSheetsIntegration to be initialized before accessing it
function setupRefreshDataOverride() {
  if (typeof googleSheetsIntegration !== 'undefined' && googleSheetsIntegration.refreshData) {
    const originalRefreshData = googleSheetsIntegration.refreshData;
    googleSheetsIntegration.refreshData = function() {
      originalRefreshData.call(this).then(() => {
        populateSalesDropdown();
      });
    };
  } else {
    // Retry after a short delay
    setTimeout(setupRefreshDataOverride, 100);
  }
}

// Call the setup function when DOM is ready
document.addEventListener('DOMContentLoaded', setupRefreshDataOverride);
