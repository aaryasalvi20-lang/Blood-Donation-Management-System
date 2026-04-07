const http = require('http');

const data = JSON.stringify({
    name: "Test Hospital",
    email: "test_api@gmail.com",
    password: "password123",
    location: "Mumbai"
});

const options = {
    hostname: 'localhost',
    port: 5500,
    path: '/api/auth/register/hospital',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Request Error:', error);
});

req.write(data);
req.end();
