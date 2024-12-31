# Self-practice playwright

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
    <summary><b>Click to see how to setup oracle db and make sameple data</b></summary>

![oracle query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/oracle_query.png?raw=true)
![oracle query2](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/sample_data.png?raw=true)
</details>

**How to connect and setup sample data via postgresql db** <br/>
<details>
    <summary><b>Click to see how to setup oracle db and make sameple data</b></summary>

![postgresql setup](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/postgresql_connect.png?raw=true)
![postgresql query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/postgresql_data.png?raw=true)
</details>

**How to setup sample data via mongo db** <br/>
<details>
    <summary><b>Click to see how to setup mongodb sample data</b></summary>

![mongo query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mongo_query.png?raw=true)
</details>

**How to setup sample data via mysql db** <br/>
<details>
    <summary><b>Click to see how to setup mysql sample data</b></summary>

![mysql query](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mysql_query.png?raw=true)
![mysql query2](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mysql_result.png?raw=true)
![mysql query3](https://github.com/Thanasornsawan/Practice_Playwright/blob/main/pictures/mysql_query_result.png?raw=true)
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

## command to run project
```sh
QASE_MODE=testops npx playwright test
```