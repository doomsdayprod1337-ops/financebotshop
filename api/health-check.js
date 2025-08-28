exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  // Log the request for debugging
  console.log('Health check request:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    body: event.body
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      environment: process.env.NODE_ENV || 'development',
      netlify: true
    })
  };
};
