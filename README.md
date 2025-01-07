# Self-practice playwright

## Re-use login state by login API before jump to any pages
This practice use website https://ecommerce-playground.lambdatest.io/index.php for testing. <br/>
At first, we intercept network and check endpoint for login API and payload and then make API request in ``LambdaTestApiUtils.js`` file <br/>
and then we use ``await page.context().addCookies(apiCookies);`` for add cookie from login API before proceed to any page. <br/>
In the test script ``lambdatest_product_detail.spec.js``, we only test add product to cart, verify toast popup and total qty in cart<br/>

![lambda ui](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/lambda_product_detail_ui.png?raw=true)
![lambda result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/lambda_result.png?raw=true)

## Re-use login state by use local storage file before jump to any pages
This practice use website https://opensource-demo.orangehrmlive.com for testing. <br/>
At first, we use admin account go to PIM menu to create different role accounts (In our case is testerQA1, testerQA2) <br/>

![orangehrm admin](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/orangehrm_admin.png?raw=true)

Then, we try use employee role account to access privilege page that only admin can do. We can see alert message below.

![orangehrm employee](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/orangehrm_employee.png?raw=true)

First step, we run ``npx playwright test tests/orangehrm/save_states.spec.js --reporter=list`` to make all 3 accounts login <br/>
the same time with ``Promise.all()`` and saves all login-related data (cookies, localStorage) to thier state file <br/>
Then, in role_test.spec.js, we use the state file

```javascript
   const adminTest = test.extend({
   storageState: '.auth/state-admin.json'
});
```

**Using adminTest instead of test:** <br/>
``adminTest('Admin can access Employee List', ...)`` looks similar to regular test() but with one key difference<br/>
- Every time you use adminTest, Playwright automatically loads the admin's login state before running the test
- You don't need to manually log in anymore - the state file handles that
- ``test.extend()`` in Playwright, creating a customized version of the test function<br/>
Think of it as saying "I want all tests using this function to have these special settings"<br/>

![orangehrm result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/orangehrm_result.png?raw=true)

## Database setup
**if you use mac M1, you might have problem build docker oracle same me, recommend to use colima start docker**
<br/>

```sh
brew install colima 
colima start --arch x86_64 --memory 4
docker-compose up -d
```

<br/>
Refer blog about [Running Oracle Database on Docker on Apple M1 Chip](https://oralytics.com/2022/09/22/running-oracle-database-on-docker-on-apple-m1-chip/)

Now, you can see postgresql and oracle database running inside Colima like this <br/>

![docker run](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/docker_run.png?raw=true)

**How to connect and setup sample data via oracle db** <br/>

<details>
    <summary>Click to see how to setup oracle db and make sameple data</summary>

![oracle query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/oracle_query.png?raw=true)
![oracle query2](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/sample_data.png?raw=true)
</details>
<br/>

**How to connect and setup sample data via postgresql db** <br/>
<details>
    <summary>Click to see how to setup postgresql db and make sameple data</summary>

![postgresql setup](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/postgresql_connect.png?raw=true)
![postgresql query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/postgresql_data.png?raw=true)
</details>
<br/>

**How to setup sample data via mongo db** <br/>

<details>
    <summary>Click to see how to setup mongodb sample data</summary>

![mongo query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mongo_query.png?raw=true)
</details>
<br/>

**How to setup sample data via mysql db** <br/>
<details>
    <summary>Click to see how to setup mysql sample data</summary>

![mysql query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mysql_query.png?raw=true)
![mysql query2](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mysql_result.png?raw=true)
![mysql query3](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mysql_query_result.png?raw=true)
![mysql query4](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/query_price_condition.png?raw=true)
</details>

## Report integrate with TestRail
using testrail-reporter, see full documentation [testrail-reporter here](https://github.com/zealous-tech/testrail-reporter/tree/main)<br/>

**Result after run test case, result sent to TestRail** <br/>
<details>
    <summary><b>Click to see all TestRail results</b></summary>

![testrail result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/testrail_result.png?raw=true)
![testrail_pass result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/testrail_pass.png?raw=true)
![testrail_fail result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/testrail_fail.png?raw=true)
</details>

## Report integrate with Qase
using qase-playwright, see full documentation [qase playwright here](https://github.com/qase-tms/qase-javascript/tree/main/qase-playwright#configuration)<br/>

**Result after run test case, result sent to Qase** <br/>
<details>
    <summary><b>Click to see all Qase results</b></summary>

![qase_dashboard result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/testrun_dashboard_qase.png?raw=true)
![qase result](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/qase_result.png?raw=true)
</details>

## Report integrate with Allure
<details>
    <summary><b>Click to see all Allure results</b></summary>

```sh
npx allure generate allure-results -o allure-report --clean
npx allure open allure-report
```

![allure open](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/allure_open.png?raw=true)
![allure dashboard](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/allure_dashboard.png?raw=true)
</details>

**Run test oracle db with playwright and allure report**
```sh
npx playwright test tests/database_testcase/oracle_user.spec.js --reporter=allure-playwright
```
![run allure](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/run_test_allure_report.png?raw=true)

## Setup .env configuration
```sh
QASE_TESTOPS_API_TOKEN=**your_playwright_token_app_on_qase**
QASE_TESTOPS_PROJECT=**your_project_code**
TESTRAIL_API_TOKEN=**your_testrail_token***
TESTRAIL_USER=**your_email_account_testrail***
TESTRAIL_BASE_URL=https://**your_testrail_domain**.testrail.io
```

**Get your qase token from app menu here** <br/>
![qase token](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/api_key_qase.png?raw=true)

**Get your TestRail api token from your setting menu here** <br/>
![testrail token](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/api_key_testrail.png?raw=true)

**command to run project with qase report**
```sh
QASE_MODE=testops npx playwright test
```

## Github CICD send notification to slack
**Step 1: Set Up Slack Incoming Webhook**
1. Go to your Slack workspace.
2. Navigate to Apps → Search for "Incoming Webhooks."
3. Set up a new webhook for the channel you want to send notifications to.
4. Copy the webhook URL.

**Step 2: Store Slack Webhook URL as a GitHub Secret**
1. Go to your GitHub repository.
2. Navigate to Settings → Secrets and variables → Actions → New repository secret.
3. Add a secret:
- Name: SLACK_WEBHOOK_URL
- Value: Paste the Slack webhook URL.

![github secret](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/github_secret.png?raw=true)
![github cicd](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/github_cicd.png?raw=true)
![slack not](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/slack_noti.png?raw=true)

## Playwright API testing

<details>
    <summary><b>Click to see API testing detail</b></summary>

**Setup .env configuration**
```sh
DB_USER=**your_db_user_same_like_docker_setup**
DB_PASSWORD=**your_db_password_same_like_docker_setup**
DB_NAME=ecommerce
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=**your_API_SECRET_KEY**
API_SERVER_PORT=3000
DATABASE_URL=postgres://your_db_user:your_db_password@localhost:5432/ecommerce
```

After postgresql db on docker running, we can create more database and grant privilege on that database like this <br/>
** if you noticed my ``docker-compose.yml`` file, the postgresql db was setup with ``db_name: testdb`` for database testing.

```sh
CREATE DATABASE ecommerce;
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO testuser;
```

Install all dependencies need for run API server (Nodejs express) with permanent database sequelize
```sh
npm install express sequelize pg pg-hstore jsonwebtoken bcrypt express-validator express-rate-limit helmet dotenv
```

This file structue is use for API server only

```
project-root/
├── models/
│   ├── index.js
│   ├── user.js
│   ├── profile.js
│   ├── product.js
│   ├── order.js
│   ├── orderItem.js
│   └── review.js
├── .env
└── server.js
```

each models file refer to table name in postgresql, it is database schema for setup via sequelize nodejs <br/>
and server.js is file that contains all API endpoint for testing. You can run by this command: <br/>

```sh
node server.js
```

You can also test API manually via Postman before make the test script

![server run](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/server_run.png?raw=true)
![postman](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/postman.png?raw=true)

I keep API testing script that use with this Nodejs server 2 versions for review later between POM structure and no POM <br/>
The API testing contains all methods GET,POST,PUT,PATCH,DELTE and all API need JWT authentication token for perform any activities.

![api page](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/api_page.png?raw=true)

</details>