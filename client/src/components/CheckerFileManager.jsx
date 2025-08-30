import React, { useState, useEffect, useRef } from 'react';
import api from '../config/axios';

const CheckerFileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    proxies_required: false,
    proxy_type: '',
    capture_example: '',
    cpm_range: 'Med',
    data_required: 'USER:PASS'
  });
  
  const fileInputRef = useRef(null);

  // CPM Range options
  const cpmOptions = ['Low', 'Med', 'High', 'Extreme'];
  
  // Data Required options
  const dataOptions = [
    'USER:PASS',
    'EMAIL:PASS', 
    'LOGIN:PASS',
    'Cookie Text',
    'Email List',
    'CC Combo'
  ];

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/checker-file-config');
      
      if (response.data.success) {
        setFiles(response.data.files);
      } else {
        setError('Failed to load files');
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    if (selectedFiles.length === 0) return;

    // Validate file types
    const allowedExtensions = ['.svb', '.loli', '.anom', '.opk', '.xml', '.lce', '.proj'];
    const invalidFiles = selectedFiles.filter(file => {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      return !allowedExtensions.includes(extension);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = selectedFiles.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`File(s) too large: ${oversizedFiles.map(f => `${f.name} (${Math.round(f.size / 1024 / 1024)}MB)`).join(', ')}`);
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Prepare file data for the API
      const filesData = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      const response = await api.post('/api/upload-checker-file', {
        files: filesData
      });

      if (response.data.success) {
        setSuccess(`Successfully processed ${response.data.total_uploaded} file(s)`);
        if (response.data.errors.length > 0) {
          setError(`Some files failed to process: ${response.data.errors.join(', ')}`);
        }
        loadFiles(); // Refresh the file list
      } else {
        setError(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const openConfigModal = (file) => {
    setSelectedFile(file);
    if (file.configuration) {
      setConfigForm(file.configuration);
    } else {
      setConfigForm({
        proxies_required: false,
        proxy_type: '',
        capture_example: '',
        cpm_range: 'Med',
        data_required: 'USER:PASS'
      });
    }
    setShowConfigModal(true);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await api.post('/api/checker-file-config', {
        file_id: selectedFile.id,
        configuration: configForm
      });

      if (response.data.success) {
        setSuccess('Configuration saved successfully');
        setShowConfigModal(false);
        loadFiles(); // Refresh the file list
      } else {
        setError(response.data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setError(error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field, value) => {
    setConfigForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const deleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/api/checker-file-config?file_id=${fileId}`);
      
      if (response.data.success) {
        setSuccess('File deleted successfully');
        loadFiles(); // Refresh the file list
      } else {
        setError(response.data.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(error.response?.data?.error || 'Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeIcon = (fileType) => {
    const icons = {
      'silverbullet': '🔫',
      'openbullet': '🚀',
      'bas': '🤖',
      'cookiebullet': '🍪',
      'bl_tools': '🛠️'
    };
    return icons[fileType] || '📄';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending_configuration': 'bg-yellow-500',
      'configured': 'bg-green-500',
      'active': 'bg-blue-500',
      'inactive': 'bg-gray-500',
      'deleted': 'bg-red-500'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${badges[status] || 'bg-gray-500'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🗃️ Checker File Management</h2>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".svb,.loli,.anom,.opk,.xml,.lce,.proj"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span>📁</span>
                <span>Upload Files</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* File Type Information */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">📋 Supported File Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🔫</span>
            <div>
              <div className="text-white font-medium">SilverBullet</div>
              <div className="text-gray-400 text-sm">.SVB files</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚀</span>
            <div>
              <div className="text-white font-medium">OpenBullet</div>
              <div className="text-gray-400 text-sm">.Loli, .Anom, .Opk files</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🤖</span>
            <div>
              <div className="text-white font-medium">BAS</div>
              <div className="text-gray-400 text-sm">.XML files</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🍪</span>
            <div>
              <div className="text-white font-medium">CookieBullet</div>
              <div className="text-gray-400 text-sm">.lce files</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛠️</span>
            <div>
              <div className="text-white font-medium">BL Tools</div>
              <div className="text-gray-400 text-sm">.proj files</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-600 text-white p-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      {/* Files List */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">📁 Uploaded Files</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No files uploaded yet</p>
            <p className="text-gray-500 text-sm">Upload your first checker tool file to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{getFileTypeIcon(file.file_type)}</span>
                    <div>
                      <div className="text-white font-medium">{file.original_name}</div>
                      <div className="text-gray-400 text-sm">
                        {file.metadata?.format || file.file_type} • {formatFileSize(file.file_size)}
                      </div>
                      <div className="text-gray-500 text-sm">
                        Uploaded: {new Date(file.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(file.status)}
                    
                    {file.status === 'pending_configuration' && (
                      <button
                        onClick={() => openConfigModal(file)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Configure
                      </button>
                    )}
                    
                    {file.status === 'configured' && (
                      <button
                        onClick={() => openConfigModal(file)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Edit Config
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {file.configuration && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Proxies:</span>
                        <span className="text-white ml-2">
                          {file.configuration.proxies_required ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                      {file.configuration.proxies_required && (
                        <div>
                          <span className="text-gray-400">Type:</span>
                          <span className="text-white ml-2">{file.configuration.proxy_type}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">CPM:</span>
                        <span className="text-white ml-2">{file.configuration.cpm_range}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Data:</span>
                        <span className="text-white ml-2">{file.configuration.data_required}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Configure {selectedFile.original_name}
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfigSubmit} className="space-y-6">
              {/* Proxies Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">🌐 Proxy Configuration</h4>
                
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="proxies_required"
                    checked={configForm.proxies_required}
                    onChange={(e) => handleConfigChange('proxies_required', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-600 border-gray-500 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="proxies_required" className="text-white">
                    Proxies are required for this checker
                  </label>
                </div>
                
                {configForm.proxies_required && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Proxy Type
                    </label>
                    <input
                      type="text"
                      value={configForm.proxy_type}
                      onChange={(e) => handleConfigChange('proxy_type', e.target.value)}
                      placeholder="e.g., HTTP, SOCKS4, SOCKS5, Residential"
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Capture Example */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">📸 Capture Example</h4>
                <label className="block text-white text-sm font-medium mb-2">
                  Provide an example of what this checker captures
                </label>
                <textarea
                  value={configForm.capture_example}
                  onChange={(e) => handleConfigChange('capture_example', e.target.value)}
                  placeholder="e.g., Captures login credentials, cookies, or other data..."
                  rows="3"
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              {/* CPM Range */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">⚡ CPM Range (Captures Per Minute)</h4>
                <label className="block text-white text-sm font-medium mb-2">
                  Expected performance range
                </label>
                <select
                  value={configForm.cpm_range}
                  onChange={(e) => handleConfigChange('cpm_range', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  {cpmOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="mt-2 text-sm text-gray-400">
                  <div>Low: 1-10 CPM</div>
                  <div>Med: 11-50 CPM</div>
                  <div>High: 51-200 CPM</div>
                  <div>Extreme: 200+ CPM</div>
                </div>
              </div>

              {/* Data Required */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">📊 Data Requirements</h4>
                <label className="block text-white text-sm font-medium mb-2">
                  Type of data required to run this checker
                </label>
                <select
                  value={configForm.data_required}
                  onChange={(e) => handleConfigChange('data_required', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  required
                >
                  {dataOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckerFileManager;
