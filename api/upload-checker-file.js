const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:3000',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No valid authorization token provided' })
      };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    if (!decoded.userId) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    if (!user.is_admin && user.role !== 'admin') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin access required' })
      };
    }

    // For Netlify Functions, we'll store file metadata in the database
    // The actual file content would need to be handled differently (e.g., S3, Cloudinary)
    // For now, we'll create a record with the file information
    
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { files } = body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No files provided' })
      };
    }

    if (files.length > 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Maximum 10 files allowed per upload' })
      };
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of files) {
      try {
        // Validate file type
        const allowedExtensions = ['.svb', '.loli', '.anom', '.opk', '.xml', '.lce', '.proj'];
        const fileExtension = file.name ? file.name.toLowerCase().substring(file.name.lastIndexOf('.')) : '';
        
        if (!allowedExtensions.includes(fileExtension)) {
          errors.push(`Invalid file type for ${file.name}: ${fileExtension}`);
          continue;
        }

        // Validate file size (50MB limit)
        if (file.size && file.size > 50 * 1024 * 1024) {
          errors.push(`File too large: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
          continue;
        }

        // Determine file type
        const fileType = getFileType(file.name);
        const metadata = extractFileMetadata(file, fileType);
        
        // Save file info to database
        const { data: savedFile, error: saveError } = await supabase
          .from('checker_files')
          .insert([{
            filename: generateUniqueFilename(file.name),
            original_name: file.name,
            file_type: fileType,
            file_size: file.size || 0,
            metadata: metadata,
            uploaded_by: decoded.userId,
            status: 'pending_configuration'
          }])
          .select()
          .single();

        if (saveError) {
          console.error('Error saving file to database:', saveError);
          errors.push(`Failed to save ${file.name}: ${saveError.message}`);
        } else {
          uploadedFiles.push({
            id: savedFile.id,
            filename: savedFile.filename,
            original_name: savedFile.original_name,
            file_type: savedFile.file_type,
            metadata: savedFile.metadata
          });
        }

      } catch (fileError) {
        console.error('Error processing file:', fileError);
        errors.push(`Failed to process ${file.name || 'unknown file'}: ${fileError.message}`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Successfully processed ${uploadedFiles.length} file(s)`,
        files: uploadedFiles,
        errors: errors,
        total_uploaded: uploadedFiles.length,
        total_errors: errors.length
      })
    };

  } catch (error) {
    console.error('File upload API error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token expired' })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Helper function to determine file type
function getFileType(filename) {
  if (!filename) return 'unknown';
  
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const typeMap = {
    '.svb': 'silverbullet',
    '.loli': 'openbullet',
    '.anom': 'openbullet',
    '.opk': 'openbullet',
    '.xml': 'bas',
    '.lce': 'cookiebullet',
    '.proj': 'bl_tools'
  };
  
  return typeMap[ext] || 'unknown';
}

// Helper function to generate unique filename
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = originalName ? originalName.substring(originalName.lastIndexOf('.')) : '';
  
  return `checker-file-${timestamp}-${random}${extension}`;
}

// Helper function to extract metadata from files
function extractFileMetadata(file, fileType) {
  const metadata = {
    file_type: fileType,
    original_name: file.name || 'Unknown',
    file_size: file.size || 0,
    upload_timestamp: new Date().toISOString()
  };

  // Try to extract additional metadata based on file type
  try {
    switch (fileType) {
      case 'silverbullet':
        metadata.format = 'SilverBullet (.SVB)';
        metadata.description = 'SilverBullet checker configuration file';
        break;
        
      case 'openbullet':
        metadata.format = 'OpenBullet (.Loli/.Anom/.Opk)';
        metadata.description = 'OpenBullet checker configuration file';
        break;
        
      case 'bas':
        metadata.format = 'BAS (.XML)';
        metadata.description = 'BAS (Browser Automation Studio) project file';
        break;
        
      case 'cookiebullet':
        metadata.format = 'CookieBullet (.lce)';
        metadata.description = 'CookieBullet checker configuration file';
        break;
        
      case 'bl_tools':
        metadata.format = 'BL Tools (.proj)';
        metadata.description = 'BL Tools project file';
        break;
        
      default:
        metadata.format = 'Unknown';
        metadata.description = 'Unknown file format';
    }
  } catch (error) {
    console.error('Error extracting metadata:', error);
    metadata.error = 'Failed to extract metadata';
  }

  return metadata;
}
