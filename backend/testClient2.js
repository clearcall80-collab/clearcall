const axios = require('axios');

async function testSignin() {
  try {
    console.log('Attempting signin...');
    const response = await axios.post('http://localhost:4000/api/auth/signin', {
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      withCredentials: true,
      timeout: 5000
    });
    console.log('Signin response:', response.data);
  } catch (error) {
    console.error('Signin error message:', error.message);
    if (error.response) {
      console.error('Signin error status:', error.response.status);
      console.error('Signin error data:', error.response.data);
    } else if (error.code) {
      console.error('Signin error code:', error.code);
    } else {
      console.error('Signin error details:', error);
    }
  }
}

async function testSignup() {
  try {
    console.log('Attempting signup...');
    const response = await axios.post('http://localhost:4000/api/auth/signup', {
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User'
    }, {
      withCredentials: true,
      timeout: 5000
    });
    console.log('Signup response:', response.data);
  } catch (error) {
    console.error('Signup error message:', error.message);
    if (error.response) {
      console.error('Signup error status:', error.response.status);
      console.error('Signup error data:', error.response.data);
    } else if (error.code) {
      console.error('Signup error code:', error.code);
    } else {
      console.error('Signup error details:', error);
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
