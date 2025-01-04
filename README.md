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

![mysql query](https