const axios = require('axios');

async function testSignin() {
  try {
    const response = await axios.post('http://localhost:4000/api/auth/signin', {
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      withCredentials: true
    });
    console.log('Signin response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Signin error response:', error.response.data);
    } else {
      console.error('Signin error:', error.message);
    }
  }
}

async function testSignup() {
  try {
    const response = await axios.post('http://localhost:4000/api/auth/signup', {
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User'
    }, {
      withCredentials: true
    });
    console.log('Signup response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Signup error response:', error.response.data);
    } else {
      console.error('Signup error:', error.message);
    }
  }
}

async function runTests() {
  console.log('Testing signup...');
  await testSignup();
  console.log('Testing signin...');
  await testSignin();
}

runTests();
