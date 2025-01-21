const { test, expect } = require('@playwright/test');
const path = require('path');
const RegisterPage = require('../../web/pages/tool_shop/registerPage');
const LoginPage = require('../../web/pages/tool_shop/loginPage');
const NavBarPage = require('../../web/pages/tool_shop/navBarPage');
const CartPage = require('../../web/pages/tool_shop/cartPage');
const MyInvoicesPage = require('../../web/pages/tool_shop/myInvoicesPage');
const InvoicePage = require('../../web/pages/tool_shop/invoiceDetailPage');
const ProductFeature = require('../../web/features/tool_shop/productFeature');
const PDFHelper = require('../../utils/pdfUtils');
const testData = require('../../data/tool_shop/userData.json');

test.describe('E2E Test - Registration to Invoice Download', () => {
    const BASE_URL = 'https://practicesoftwaretesting.com';
    let userEmail, userPassword, invoiceNumber;
    let productDetails = {};
    let orderDate;
    let download;

    // Helper function to generate random string for unique email/password
    const generateRandomString = (length = 8) => {
        return Math.random().toString(36).substring(2, length + 2);
    };

    // Clean up download directory before each test
    test.beforeEach(async () => {
        await PDFHelper.ensureDownloadDirectory();
        await PDFHelper.cleanDownloadDirectory();
    });

    // Clean up download directory after each test
    test.afterEach(async () => {
        await PDFHelper.cleanDownloadDirectory();
    });

    test('complete checkout process and verify invoice', async ({ page }) => {
        // Initialize all page objects
        const registerPage = new RegisterPage(page, BASE_URL);
        const loginPage = new LoginPage(page, BASE_URL);
        const navBarPage = new NavBarPage(page, BASE_URL);
        const myInvoicesPage = new MyInvoicesPage(page, BASE_URL);
        const invoicePage = new InvoicePage(page, BASE_URL);
        const cartPage = new CartPage(page, BASE_URL);
        
        await test.step('Register new account', async () => {
            const randomStr = generateRandomString();
            userEmail = `test_${randomStr}@example.com`;
            userPassword = `Pass${randomStr}123!`;

            // Create date for a person who is 25 years old
            const dateOfBirth = new Date();
            dateOfBirth.setFullYear(dateOfBirth.getFullYear() - 25);

            // Use the test data and add dynamic data
            const registerData = {
                ...testData.userData,
                email: userEmail,
                password: userPassword,
                dateOfBirth: dateOfBirth
            };

            await registerPage.registerUser(registerData);
        });

        await test.step('Login with registered account', async () => {
            await loginPage.login(userEmail, userPassword);

            // Verify user name in nav bar matches registration
            const displayName = await navBarPage.getUserName();
            expect(displayName).toBe(`${testData.userData.firstName} ${testData.userData.lastName}`);
        });

        await test.step('Add product to cart and complete checkout', async () => {
            const productFeature = new ProductFeature(page, BASE_URL);
            const productsToAdd = [testData.productData.defaultProduct];
            const addedProducts = await productFeature.addMultipleProductsToCart(productsToAdd);
            productDetails = addedProducts[0];

            // Store current date for later verification
            orderDate = new Date().toLocaleDateString('en-US');

            // Navigate through checkout process
            await navBarPage.goToCart();
            await cartPage.processToCompleteCheckoutPayment('Cash on Delivery');
        });

        await test.step('Get invoice number from order confirmation', async () => {
            invoiceNumber = await cartPage.getInvoiceNumberFromConfirmation();
            expect(invoiceNumber).toBeTruthy();
            expect(invoiceNumber).toMatch(/INV-\d+/);
            //console.log('Extracted Invoice Number:', invoiceNumber);
        });

        await test.step('Verify invoice in My Invoices page', async () => {
            await navBarPage.goToMyInvoices();
            
            // Get and verify invoice data from the invoices list
            const invoiceData = await myInvoicesPage.getInvoiceData(invoiceNumber);
            expect(new Date(invoiceData.date).toLocaleDateString('en-US')).toBe(orderDate);
            
            const expectedTotal = (productDetails.price * testData.productData.defaultProduct.quantity).toFixed(2);
            expect(parseFloat(invoiceData.total.replace('$', ''))).toBe(parseFloat(expectedTotal));
        });

        await test.step('Verify invoice details page', async () => {
            await myInvoicesPage.viewInvoiceDetails(invoiceNumber);
            
            // Get and verify detailed invoice information
            const invoiceDetails = await invoicePage.getInvoiceDetails();
            expect(invoiceDetails.invoiceNumber).toBe(invoiceNumber);
            expect(new Date(invoiceDetails.date).toLocaleDateString('en-US')).toBe(orderDate);
            expect(invoiceDetails.paymentMethod).toBe('Cash on Delivery');

            // Verify product details in invoice
            const productInfo = await invoicePage.getProductDetails(productDetails.name);
            expect(productInfo.quantity).toBe(testData.productData.defaultProduct.quantity);
            expect(productInfo.unitPrice).toBe(productDetails.price);
            expect(productInfo.totalPrice).toBe(productDetails.price * testData.productData.defaultProduct.quantity);
        });

        await test.step('Download and verify invoice PDF', async () => {
            // Verify PDF filename matches invoice number
            test.setTimeout(120000); // Set 120 seconds timeout for this step
            download = await invoicePage.downloadPDF(90000);
            expect(download.suggestedFilename()).toBe(`${invoiceNumber}.pdf`);

            const productInfo = await invoicePage.getProductDetails(productDetails.name);
    
            await PDFHelper.verifyPDFContents(download, {
                invoiceNumber: invoiceNumber,
                date: orderDate,
                productInfo,
                total: productInfo.totalPrice.toFixed(2),
                paymentMethod: 'cash-on-delivery'
            });
        });
    });
});