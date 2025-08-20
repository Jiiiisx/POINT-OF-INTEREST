/**
 * Google Sheets CRUD Operations - Enhanced Version
 * File ini berisi fungsi-fungsi untuk operasi Create, Read, Update, Delete pada Google Sheets
 */

class GoogleSheetsCRUD {
    constructor() {
        this.spreadsheetId = '15Yu8_PcUFvrQFIL3qy7TfvDJNg4XPSbqPJOU6Wh8Q1A';
        this.apiKey = 'AIzaSyDiLgnSz4yrRr1AW-dHgvEDSyZS6aGFiZY';
        this.sheetName = 'REKAP CALON PELANGGAN BY SPARTA';
        this.clientId = '167078370634-de0ou8c3hikdba9pq6evimmfekbkk9o6.apps.googleusercontent.com';
        
        console.log('🚀 Google Sheets CRUD initialized');
        this.initGoogleAPI();
    }

    async initGoogleAPI() {
        try {
            // Initialize Google API client
            await this.loadGoogleAPI();
            await this.initGapiClient();
            console.log('✅ Google API client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Google API:', error);
        }
    }

    async loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initGapiClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.apiKey,
                        clientId: this.clientId,
                        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
                        scope: 'https://www.googleapis.com/auth/spreadsheets'
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // CREATE - Menambah data baru
    async addCustomer(customerData) {
        try {
            console.log('➕ Adding new customer...', customerData);
            
            const range = `${this.sheetName}!A:I`;
            const values = [[
                customerData.odp_terdekat || '',
                customerData.nama || '',
                customerData.alamat || '',
                customerData.no_telepon || '',
                customerData.nama_sales || '',
                customerData.visit || 'Not Visited',
                customerData.keterangan || '',
                customerData.status || 'Pending',
                customerData.keterangan_tambahan || ''
            ]];

            const request = {
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values
                }
            };

            const response = await gapi.client.sheets.spreadsheets.values.append(request);
            console.log('✅ Customer added successfully:', response.result);
            return response.result;

        } catch (error) {
            console.error('❌ Add customer error:', error);
            throw new Error(`Gagal menambah data: ${error.message}`);
        }
    }

    // READ - Membaca data dari spreadsheet
    async readData() {
        try {
            console.log('📖 Reading data from spreadsheet...');
            
            const range = `${this.sheetName}!A1:I1000`;
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range
            });

            const values = response.result.values || [];
            console.log('✅ Data read successfully:', values.length, 'rows');
            return values;

        } catch (error) {
            console.error('❌ Read data error:', error);
            throw new Error(`Gagal membaca data: ${error.message}`);
        }
    }

    // UPDATE - Mengupdate data yang sudah ada
    async updateCustomer(rowIndex, customerData) {
        try {
            console.log('✏️ Updating customer at row:', rowIndex);
            
            // Row index + 2 karena header di baris 1 dan index 0-based
            const actualRow = rowIndex + 2;
            const range = `${this.sheetName}!A${actualRow}:I${actualRow}`;
            
            const values = [[
                customerData.odp_terdekat || '',
                customerData.nama || '',
                customerData.alamat || '',
                customerData.no_telepon || '',
                customerData.nama_sales || '',
                customerData.visit || 'Not Visited',
                customerData.keterangan || '',
                customerData.status || 'Pending',
                customerData.keterangan_tambahan || ''
            ]];

            const request = {
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values
                }
            };

            const response = await gapi.client.sheets.spreadsheets.values.update(request);
            console.log('✅ Customer updated successfully:', response.result);
            return response.result;

        } catch (error) {
            console.error('❌ Update customer error:', error);
            throw new Error(`Gagal update data: ${error.message}`);
        }
    }

    // DELETE - Menghapus data
    async deleteCustomer(rowIndex) {
        try {
            console.log('🗑️ Deleting customer at row:', rowIndex);
            
            // Row index + 2 karena header di baris 1 dan index 0-based
            const actualRow = rowIndex + 2;
            
            const request = {
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: 0, // Sheet pertama
                                dimension: 'ROWS',
                                startIndex: actualRow - 1, // 0-based index
                                endIndex: actualRow
                            }
                        }
                    }]
                }
            };

            const response = await gapi.client.sheets.spreadsheets.batchUpdate(request);
            console.log('✅ Customer deleted successfully:', response.result);
            return response.result;

        } catch (error) {
            console.error('❌ Delete customer error:', error);
            throw new Error(`Gagal menghapus data: ${error.message}`);
        }
    }

    // Batch operations untuk efisiensi
    async batchUpdate(updates) {
        try {
            console.log('📊 Performing batch update...', updates.length, 'updates');
            
            const requests = updates.map(update => ({
                updateCells: {
                    range: {
                        sheetId: 0,
                        startRowIndex: update.rowIndex + 1, // 0-based
                        endRowIndex: update.rowIndex + 2,
                        startColumnIndex: 0,
                        endColumnIndex: 9
                    },
                    rows: [{
                        values: update.values.map(value => ({
                            userEnteredValue: { stringValue: value }
                        }))
                    }],
                    fields: 'userEnteredValue'
                }
            }));

            const request = {
                spreadsheetId: this.spreadsheetId,
                resource: { requests }
            };

            const response = await gapi.client.sheets.spreadsheets.batchUpdate(request);
            console.log('✅ Batch update completed:', response.result);
            return response.result;

        } catch (error) {
            console.error('❌ Batch update error:', error);
            throw new Error(`Gagal batch update: ${error.message}`);
        }
    }

    // Utility functions
    async getSheetInfo() {
        try {
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            return response.result;
        } catch (error) {
            console.error('❌ Get sheet info error:', error);
            throw error;
        }
    }

    async getSheetIdByName(sheetName) {
        try {
            const sheetInfo = await this.getSheetInfo();
            const sheet = sheetInfo.sheets.find(s => s.properties.title === sheetName);
            return sheet ? sheet.properties.sheetId : null;
        } catch (error) {
            console.error('❌ Get sheet ID error:', error);
            throw error;
        }
    }

    // Error handling
    handleError(error, context) {
        console.error(`❌ Error in ${context}:`, error);
        const errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
        
        // Tampilkan error ke user
        const errorDiv = document.getElementById('errorDisplay');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <div class="alert alert-danger" style="margin: 20px; padding: 15px; border-radius: 5px;">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Error:</strong> ${errorMessage}
                    <button onclick="this.parentElement.parentElement.style.display='none'" 
                            style="float: right; background: none; border: none; font-size: 20px;">
                        &times;
                    </button>
                </div>
            `;
            errorDiv.style.display = 'block';
        }
        
        return errorMessage;
    }

    // Validation functions
    validateCustomerData(data) {
        const required = ['nama', 'no_telepon', 'alamat', 'odp_terdekat', 'nama_sales'];
        const missing = required.filter(field => !data[field] || data[field].trim() === '');
        
        if (missing.length > 0) {
            throw new Error(`Field wajib tidak lengkap: ${missing.join(', ')}`);
        }
        
        // Validasi nomor telepon
        if (!/^[0-9]{10,13}$/.test(data.no_telepon)) {
            throw new Error('Nomor telepon harus 10-13 digit angka');
        }
        
        return true;
    }

    // Helper untuk konversi data
    convertToSheetFormat(data) {
        return [
            data.odp_terdekat || '',
            data.nama || '',
            data.alamat || '',
            data.no_telepon || '',
            data.nama_sales || '',
            data.visit || 'Not Visited',
            data.keterangan || '',
            data.status || 'Pending',
            data.keterangan_tambahan || ''
        ];
    }

    // Test connection
    async testConnection() {
        try {
            console.log('🧪 Testing Google Sheets connection...');
            await this.readData();
            console.log('✅ Connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }
}

// Global instance
let googleSheetsCRUD;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Google Sheets CRUD...');
    googleSheetsCRUD = new GoogleSheetsCRUD();
});

// Global functions untuk digunakan di UI
window.addCustomer = async function(customerData) {
    if (!googleSheetsCRUD) {
        throw new Error('Google Sheets CRUD belum diinisialisasi');
    }
    return await googleSheetsCRUD.addCustomer(customerData);
};

window.updateCustomer = async function(rowIndex, customerData) {
    if (!googleSheetsCRUD) {
        throw new Error('Google Sheets CRUD belum diinisialisasi');
    }
    return await googleSheetsCRUD.updateCustomer(rowIndex, customerData);
};

window.deleteCustomer = async function(rowIndex) {
    if (!googleSheetsCRUD) {
        throw new Error('Google Sheets CRUD belum diinisialisasi');
    }
    return await googleSheetsCRUD.deleteCustomer(rowIndex);
};

window.testSheetsConnection = async function() {
    if (!googleSheetsCRUD) {
        throw new Error('Google Sheets CRUD belum diinisialisasi');
    }
    return await googleSheetsCRUD.testConnection();
};
