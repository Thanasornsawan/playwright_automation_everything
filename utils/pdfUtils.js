const fs = require('fs/promises');
const pdf = require('pdf-parse');
const path = require('path');

class PDFHelper {
    /**
     * Initialize the download directory path
     * This path is relative to the test file location (tests/e2e/)
     */
    static getDownloadPath() {
        const downloadPath = path.join(__dirname, '../../download');
        return downloadPath;
    }

    /**
     * Ensure the download directory exists
     * Creates the directory if it doesn't exist
     */
    static async ensureDownloadDirectory() {
        const downloadPath = this.getDownloadPath();
        try {
            await fs.access(downloadPath);
        } catch (error) {
            // If directory doesn't exist, create it
            await fs.mkdir(downloadPath, { recursive: true });
        }
    }

    /**
     * Extract text content from a PDF file
     * @param {string} filePath - Path to the PDF file
     * @returns {Promise<string>} Extracted text content
     */
    static async extractText(filePath) {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    }

    /**
     * Save downloaded PDF and verify its contents
     * @param {Object} download - Playwright download object
     * @param {Object} expectedData - Data to verify in the PDF
     * @returns {Promise<void>}
     */
    static async verifyPDFContents(download, expectedData) {
        const downloadPath = this.getDownloadPath();
        const pdfPath = path.join(downloadPath, `${expectedData.invoiceNumber}.pdf`);
        
        try {
            await download.saveAs(pdfPath);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for file system

            // Check if file exists and has size
            const stats = await fs.stat(pdfPath);
            if (stats.size === 0) {
                throw new Error('Downloaded PDF file is empty');
            }

            const pdfText = await this.extractText(pdfPath);
            
            //console.log('Full PDF Text:', pdfText);
            //console.log('Expected Data:', expectedData);

            // Verify each piece of expected data
            for (const [key, value] of Object.entries(expectedData)) {
                if (key === 'date') {
                    // Extract date from PDF (format: YYYY-MM-DD)
                    const datePattern = /\d{4}-\d{2}-\d{2}/;
                    const matchedDate = pdfText.match(datePattern);
                    
                    if (!matchedDate) {
                        throw new Error('Could not find any date matching pattern in PDF');
                    }

                    // Compare dates without time
                    const pdfDate = new Date(matchedDate[0]);
                    const expectedDate = new Date(value);
                    
                    const formatDateOnly = (date) => {
                        return date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                        });
                    };

                    const formattedPdfDate = formatDateOnly(pdfDate);
                    const formattedExpectedDate = formatDateOnly(expectedDate);

                    /*
                    console.log('Date comparison:', {
                        expected: formattedExpectedDate,
                        found: formattedPdfDate
                    });
                    */

                    if (formattedPdfDate !== formattedExpectedDate) {
                        throw new Error(`Date mismatch. Expected: ${formattedExpectedDate}, Found: ${formattedPdfDate}`);
                    }
                } 
                else if (key === 'productInfo') {
                    // Verify quantity and product name
                    const sanitizedProductName = value.name.replace(/\s+/g, '\\s*');
                    const productPattern = new RegExp(`${value.quantity}\\s*${sanitizedProductName}`);
                    //console.log('Product Pattern:', productPattern);
                    if (!productPattern.test(pdfText)) {
                        throw new Error(`Could not find product: ${value.quantity} ${sanitizedProductName}`);
                    }

                    // Verify unit price
                    const unitPricePattern = new RegExp(`\\$${value.unitPrice.toFixed(2)}`);
                    if (!unitPricePattern.test(pdfText)) {
                        throw new Error(`Could not find unit price: $${value.unitPrice.toFixed(2)}`);
                    }

                    // Verify total price
                    const totalPricePattern = new RegExp(`\\$${value.totalPrice.toFixed(2)}`);
                    if (!totalPricePattern.test(pdfText)) {
                        throw new Error(`Could not find total price: $${value.totalPrice.toFixed(2)}`);
                    }
                }
                // Verify invoice total
                else if (key === 'total') {
                    const totalPattern = new RegExp(`Total\\$${value}`);
                    if (!totalPattern.test(pdfText)) {
                        throw new Error(`Could not find total: $${value}`);
                    }
                }
                // For other fields (like invoice number, payment method)
                else if (!pdfText.includes(value.toString())) {
                    throw new Error(`PDF missing expected ${key}: ${value}`);
                }
            }
        } finally {
            try {
                await fs.unlink(pdfPath);
            } catch (error) {
                console.warn(`Warning: Could not delete PDF file at ${pdfPath}:`, error.message);
            }
        }
    }

    /**
     * Clean up any remaining files in the download directory
     * Useful for test cleanup or setup
     */
    static async cleanDownloadDirectory() {
        const downloadPath = this.getDownloadPath();
        try {
            const files = await fs.readdir(downloadPath);
            await Promise.all(
                files.map(file => 
                    fs.unlink(path.join(downloadPath, file))
                        .catch(error => console.warn(`Warning: Could not delete file ${file}:`, error.message))
                )
            );
        } catch (error) {
            console.warn('Warning: Could not clean download directory:', error.message);
        }
    }
}

module.exports = PDFHelper;