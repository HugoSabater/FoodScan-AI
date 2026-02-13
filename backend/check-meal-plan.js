
const http = require('http');

const payload = JSON.stringify({
    // Test with explicit profile to avoid DB dependency in this specific test logic if possible, 
    // but using userId: 1 is also good integration test. 
    // Let's use profile to match the "or receive it in body" requirement verification.
    profile: {
        diet: 'Keto',
        allergies: ['Gluten', 'Peanuts']
    }
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/users/meal-plan',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

console.log('Sending request to /api/users/meal-plan...');

const req = http.request(options, res => {
    console.log(`Status Code: ${res.statusCode}`);

    let body = '';
    res.on('data', d => {
        body += d;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            console.log('Response Data:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('Raw Response:', body);
        }
    });
});

req.on('error', error => {
    console.error('Error:', error);
});

req.write(payload);
req.end();
