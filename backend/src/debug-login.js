
async function runTest() {
    try {
        // 1. Login as Admin
        console.log('Attempting Admin Login...');
        const loginRes = await fetch('http://localhost:5000/api/auth/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@college.edu',
                password: 'admin123'
            })
        });

        const loginText = await loginRes.text();
        console.log('Login Status:', loginRes.status);
        console.log('Login Response:', loginText);

        let loginData;
        try {
            loginData = JSON.parse(loginText);
        } catch (e) {
            console.error('Login Response is not JSON');
            return;
        }

        if (!loginRes.ok) {
            console.error('Login Failed');
            return;
        }

        console.log('Login Successful! Token:', loginData.token ? 'Yes' : 'No');
        const token = loginData.token;

        // 2. Create Advisor
        console.log('\nAttempting Create Advisor...');
        const advisorRes = await fetch('http://localhost:5000/api/advisor/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Test Advisor',
                email: 'testadvisor@college.edu',
                advisorId: 'ADV_TEST_001',
                password: 'password123',
                departmentId: '1',
                section: 'A'
            })
        });

        const advisorText = await advisorRes.text();
        console.log('Create Advisor Status:', advisorRes.status);
        console.log('Create Advisor Response:', advisorText);

    } catch (error) {
        console.error('Test Error:', error);
    }
}

runTest();
