class LoginPage {
  constructor(page) {
    this.page = page;
    this.usernameInput = this.page.locator("input[name='username']");
    this.passwordInput = this.page.locator("input[name='password']");
    this.loginButton = this.page.locator("button[type='submit']");
  }

  async loginAndSaveState(username, password, statePath) {
    try {
      await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login');
      
      // Wait for the login form to be ready
      await this.usernameInput.waitFor({ state: 'visible', timeout: 10000 });
      
      // Fill in credentials
      await this.usernameInput.fill(username);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
      
      // Wait f