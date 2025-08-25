export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success response
    // The client should remove the token from localStorage
    
    console.log('Logout request received');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Logout failed. Please try again.' 
    });
  }
}
