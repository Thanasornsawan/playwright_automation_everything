// File: utils/LambdaTestApiUtils.js
class LambdaTestApiUtils {
    constructor(apiContext, loginPayload) {
        this.apiContext = apiContext;
        this.loginPayload = loginPayload;
        this.baseUrl = 'https://ecommerce-playground.lambdatest.io';
    }

    async login() {
        try {
            const response = await this.apiContext.post(`${this.baseUrl}/index.php?route=account/login`, {
                form: {
                    email: this.loginPayload.email,
                    password: this.loginPayload.password
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // Check response status
            if (response.status() === 429) {
                throw new Error('Login attempts exceeded. Please wait before trying again.');
            }

            // Get response body to check for login success/failure
            const responseBody = await response.text();
            
            // Check for common error indicators in the response
            if (responseBody.includes('Warning: No match for E-Mail Address and/or Password') ||
                responseBody.includes('Warning: Your account has exceeded allowed number of login attempts')) {
                throw new Error('Login failed: Invalid credentials or account locked');
            }

            // Verify successful login by checking for successful redirect or account page indicators
            if (!responseBody.includes('My Account') || response.url().includes('route=account/login')) {
                throw new Error('Login failed: Unable to access account');
            }

            // Get cookies from response headers
            const cookiesHeader = response.headers()['set-cookie'];
            if (!cookiesHeader) {
                throw new Error('Login failed: No session cookies received');
            }

            // Parse cookies
            const parsedCookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];
            const formattedCookies = parsedCookies.map(cookieStr => {
                const [nameValue] = cookieStr.split(';');
                const [name, value] = nameValue.split('=');
                return {
                    name: name.trim(),
                    value: value.trim(),
                    domain: 'ecommerce-playground.lambdatest.io',
                    path: '/'
                };
            });

            console.log("Login successful, cookies parsed:", formattedCookies.length);
            return formattedCookies;

        } catch (error) {
            console.error('Login error:', error.message);
            throw error; // Re-throw to be handled by test
        }
    }

    async verifyLoginStatus() {
        try {
            const response = await this.apiContext.get(
                `${this.baseUrl}/index.php?route=account/account`,
                {
                    headers: {
                        'Cookie': this.cookies?.map(c => `${c.name}=${c.value}`).join('; ')
                    }
                }
            );

            const responseBody = await response.text();
            return {
                isLoggedIn: responseBody.includes('My Account') && !responseBody.includes('Login'),
                accountStatus: response.status()
            };
        } catch (error) {
            console.error('Login status verification failed:', error.message);
            return {
                isLoggedIn: false,
                accountStatus: error.status || 500
            };
        }
    }
}

module.exports = LambdaTestApiUtils;