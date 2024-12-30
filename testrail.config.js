require('dotenv').config({ path: '.env' });
module.exports = {
    base_url: process.env.TESTRAIL_BASE_URL,
    user: process.env.TESTRAIL_USER,
    pass: process.env.TESTRAIL_PASS,
    project_id: 1,
    suite_id: 1,
    testRailUpdateInterval: 0,
    updateResultAfterEachCase: true,
    use_existing_run: {
        id: 5, //use 0 for activate create_new_run function
    },
    create_new_run: {
        include_all: false,
        run_name: "Test Run",
        milestone_id: 0
    },
    status: {
        passed: 1,
        failed: 5,
        untested: 3,
        skipped: 6
    }
};