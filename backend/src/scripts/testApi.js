const testLogin = async () => {
    try {
        console.log('Testing admin login...');
        const response = await fetch('http://localhost:5000/api/auth/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@college.edu',
                password: 'admin88'
            })
        });
        const data = await response.json();
        console.log('Login Status:', response.status);
        console.log('Login Data:', data);
    } catch (error) {
        console.error('Login error:', error.message);
    }
};

testLogin();
