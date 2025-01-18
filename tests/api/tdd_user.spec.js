const { test, expect } = require('@playwright/test');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const Papa = require('papaparse');

// Helper function to read and parse CSV data
async function loadCSVData() {
    const filePath = path.join(__dirname, '..', '..', 'data', 'api', 'users.csv');
    const csvContent = fs.readFileSync(filePath, 'utf-8');
    return new Promise((resolve) => {
        Papa.parse(csvContent, {
            header: true,
            complete: (results) => resolve(results.data)
        });
    });
}

// Helper function to read and parse XML data
function loadXMLData() {
    const filePath = path.join(__dirname, '..', '..', 'data', 'api', 'posts.xml');
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    const posts = xmlDoc.getElementsByTagName('post');
    
    return Array.from(posts).map(post => ({
        userId: parseInt(post.getAttribute('userId')),
        title: post.getElementsByTagName('title')[0].textContent,
        body: post.getElementsByTagName('body')[0].textContent
    }));
}

// Helper function to read and parse Excel data
function loadExcelData() {
    const filePath = path.join(__dirname, '..', '..', 'data', 'api', 'comments.xlsx');
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(worksheet);
}

test.describe('API Testing with Different Data Sources', () => {
    // Test using CSV data for user creation
    test('create users from CSV data', async ({ request }) => {
        const userData = await loadCSVData();
        
        for (const user of userData) {
            // Send POST request to create user
            const response = await request.post('https://jsonplaceholder.typicode.com/users', {
                data: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });

            // Verify the response
            expect(response.ok()).toBeTruthy();
            const responseData = await response.json();
            expect(responseData).toMatchObject({
                name: user.name,
                email: user.email,
                phone: user.phone
            });
        }
    });

    // Test using XML data for post creation
    test('create posts from XML data', async ({ request }) => {
        const postsData = loadXMLData();

        for (const post of postsData) {
            const response = await request.post('https://jsonplaceholder.typicode.com/posts', {
                data: post
            });

            expect(response.ok()).toBeTruthy();
            const responseData = await response.json();
            expect(responseData).toMatchObject({
                title: post.title,
                body: post.body,
                userId: post.userId
            });
        }
    });

    // Test using Excel data for comment verification
    test('verify comments from Excel data', async ({ request }) => {
        const commentsData = loadExcelData();

        for (const comment of commentsData) {
            const response = await request.get(
                `https://jsonplaceholder.typicode.com/comments/${comment.id}`
            );

            expect(response.ok()).toBeTruthy();
            const responseData = await response.json();
            
            // Verify email format
            expect(responseData.email).toMatch(/@.*\./);
            
            // Verify comment length matches expected
            expect(responseData.body.length).toBeGreaterThanOrEqual(
                parseInt(comment.minLength)
            );
        }
    });
});