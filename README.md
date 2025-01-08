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

**Result after run test case, result sent to TestRai