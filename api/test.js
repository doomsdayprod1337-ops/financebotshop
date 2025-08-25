export default async function handler(req, res) {
  return res.status(200).json({ 
    message: 'Test API endpoint working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}
