const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  try {
    console.log('Debug Token: Request headers:', event.headers);
    
    // Check if Authorization header exists
    const authHeader = event.headers.authorization || event.headers.Authorization;
    console.log('Debug Token: Authorization header:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'No Authorization header',
          message: 'Authorization header is missing',
          headers_received: Object.keys(event.headers)
        })
      };
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid Authorization format',
          message: 'Authorization header must start with "Bearer "',
          received: authHeader.substring(0, 20) + '...'
        })
      };
    }
    
    const token = authHeader.substring(7);
    console.log('Debug Token: Token extracted, length:', token.length);
    console.log('Debug Token: Token starts with:', token.substring(0, 20) + '...');
    
    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    console.log('Debug Token: JWT secret exists:', !!process.env.JWT_SECRET);
    console.log('Debug Token: JWT secret length:', jwtSecret.length);
    
    // Try to verify token
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Debug Token: Token verification successful:', decoded);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: 'Token verification successful',
          token_info: {
            length: token.length,
            starts_with: token.substring(0, 20) + '...',
            expires_at: new Date(decoded.exp * 1000).toISOString(),
            is_expired: Date.now() > decoded.exp * 1000
          },
          decoded: {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username,
            is_admin: decoded.is_admin,
            iat: decoded.iat,
            exp: decoded.exp
          },
          environment: {
            jwt_secret_set: !!process.env.JWT_SECRET,
            jwt_secret_length: jwtSecret.length
          }
        })
      };
      
    } catch (verifyError) {
      console.log('Debug Token: Token verification failed:', verifyError.message);
      
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Token verification failed',
          message: verifyError.message,
          token_info: {
            length: token.length,
            starts_with: token.substring(0, 20) + '...'
          },
          environment: {
            jwt_secret_set: !!process.env.JWT_SECRET,
            jwt_secret_length: jwtSecret.length
          }
        })
      };
    }

  } catch (error) {
    console.error('Debug Token: Unexpected error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Unexpected error',
        message: error.message
      })
    };
  }
};
