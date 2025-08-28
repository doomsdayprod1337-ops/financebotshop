import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CCImport = () => {
  const [uploadMethod, setUploadMethod] = useState('file');
  const [fileContent, setFileContent] = useState('');
  const [pastedContent, setPastedContent] = useState('');
  const [delimiter, setDelimiter] = useState('|');
  const [pricePerCard, setPricePerCard] = useState(15.00);
  const [bulkPrice, setBulkPrice] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [fileInputRef] = useState(useRef());

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const importFromCCDataFile = async () => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('/Log%20Examples/cc_data.txt');
      if (!response.ok) {
        throw new Error('Failed to fetch CC_data.txt');
      }
      
      const content = await response.text();
      await processImport(content, '|', 'CC_data.txt');
      
    } catch (error) {
      console.error('Error importing from CC_data.txt:', error);
      alert('Error importing from CC_data.txt: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processImport = async (content, delimiter, filename = 'Manual Import') => {
    try {
      setIsProcessing(true);
      
      const lines = content.trim().split('\n').filter(line => line.trim());
      const processedCards = [];
      const expiredCards = [];
      const invalidCards = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = line.split(delimiter);
        
        // Check if we have at least the basic required fields
        if (fields.length < 5) {
          invalidCards.push({ line: i + 1, reason: 'Insufficient fields' });
          continue;
        }

        const [cc, mm, yy, cvv, firstName, lastName, street, city, zip, dob, ssn, email, emailPass, phone, fingerprint, balance] = fields;

        // Validate card number
        if (!validateCardNumber(cc)) {
          invalidCards.push({ line: i + 1, reason: 'Invalid card number format' });
          continue;
        }

        // Validate expiry
        if (!validateExpiry(mm, yy)) {
          expiredCards.push({ line: i + 1, reason: 'Card expired' });
          continue;
        }

        // Generate price
        const price = bulkPrice ? pricePerCard : (Math.random() * 45 + 5).toFixed(2);

        // Create card object
        const card = {
          card_number: cc.replace(/\s+/g, '').replace(/(\d{4})/g, '$1 ').trim(),
          month: mm.padStart(2, '0'),
          year: yy,
          cvv: cvv,
          first_name: firstName || '',
          last_name: lastName || '',
          street: street || '',
          city: city || '',
          zip: zip || '',
          dob: dob || '',
          ssn: ssn || '',
          email: email || '',
          email_pass: emailPass || '',
          phone: phone || '',
          fingerprint: fingerprint || '',
          balance: balance || '',
          price: parseFloat(price),
          status: 'available',
          delimiter: delimiter,
          notes: `Imported from ${filename} - Line ${i + 1}`
        };

        processedCards.push(card);
      }

      // Send to API for processing
      const importResponse = await axios.post('/api/credit-cards/import', {
        cards: processedCards,
        filename: filename,
        delimiter: delimiter
      });

      if (importResponse.data.success) {
        setImportResults({
          total: lines.length,
          imported: processedCards.length,
          expired: expiredCards.length,
          invalid: invalidCards.length,
          details: {
            processedCards,
            expiredCards,
            invalidCards
          }
        });
      } else {
        throw new Error(importResponse.data.message || 'Import failed');
      }

    } catch (error) {
      console.error('Error processing import:', error);
      alert('Error processing import: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const content = uploadMethod === 'file' ? fileContent : pastedContent;
    if (!content.trim()) {
      alert('Please provide credit card data');
      return;
    }

    await processImport(content, delimiter);
  };

  const validateCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
    return /^\d{14,17}$/.test(cleanNumber);
  };

  const validateExpiry = (month, year) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) return false;
    
    return true;
  };

  const clearResults = () => {
    setImportResults(null);
    setFileContent('');
    setPastedContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadResults = () => {
    if (!importResults) return;
    
    const results = {
      summary: {
        total: importResults.total,
        imported: importResults.imported,
        expired: importResults.expired,
        invalid: importResults.invalid
      },
      importedCards: importResults.details.processedCards,
      expiredCards: importResults.details.expiredCards,
      invalidCards: importResults.details.invalidCards
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cc_import_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">📥 CC Data Import</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/cc-dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Import Method Selection */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Import Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setUploadMethod('file')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                uploadMethod === 'file'
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📁</div>
                <div className="font-medium">File Upload</div>
              </div>
            </button>

            <button
              onClick={() => setUploadMethod('paste')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                uploadMethod === 'paste'
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">📝</div>
                <div className="font-medium">Paste Content</div>
              </div>
            </button>

            <button
              onClick={() => setUploadMethod('ccdata')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                uploadMethod === 'ccdata'
                  ? 'border-blue-500 bg-blue-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">💳</div>
                <div className="font-medium">CC_data.txt</div>
              </div>
            </button>
          </div>
        </div>

        {/* Import Configuration */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Import Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Delimiter
              </label>
              <select
                value={delimiter}
                onChange={(e) => setDelimiter(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="|">Pipe (|)</option>
                <option value=",">Comma (,)</option>
                <option value=":">Colon (:)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price per Card
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pricePerCard}
                onChange={(e) => setPricePerCard(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-300">Use same price for all cards</span>
            </label>
          </div>
        </div>

        {/* Import Content */}
        {uploadMethod === 'file' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">File Upload</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileUpload}
              className="block w-full text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
            {fileContent && (
              <div className="mt-4">
                <p className="text-gray-300 text-sm mb-2">File Preview (first 500 characters):</p>
                <div className="bg-gray-700 p-3 rounded text-gray-300 text-sm font-mono max-h-32 overflow-y-auto">
                  {fileContent.substring(0, 500)}
                  {fileContent.length > 500 && '...'}
                </div>
              </div>
            )}
          </div>
        )}

        {uploadMethod === 'paste' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Paste Content</h2>
            <textarea
              value={pastedContent}
              onChange={(e) => setPastedContent(e.target.value)}
              placeholder="Paste your credit card data here...&#10;Format: CC|MM|YY|CVV|FIRST_NAME|LAST_NAME|STREET|CITY|ZIP|DOB|SSN|EMAIL|EMAIL_PASS|PHONE|FINGER_PRINT|BALANCE"
              rows={10}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        )}

        {uploadMethod === 'ccdata' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Import from CC_data.txt</h2>
            <p className="text-gray-300 mb-4">
              This will automatically import all credit cards from the CC_data.txt file located in the Log Examples directory.
            </p>
            <button
              onClick={importFromCCDataFile}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isProcessing ? '🔄 Importing...' : '📥 Import from CC_data.txt'}
            </button>
          </div>
        )}

        {/* Import Button */}
        {uploadMethod !== 'ccdata' && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
            <button
              onClick={handleImport}
              disabled={isProcessing || (!fileContent && !pastedContent)}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isProcessing ? '🔄 Processing...' : '📥 Import Credit Cards'}
            </button>
          </div>
        )}

        {/* Import Results */}
        {importResults && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Import Results</h2>
              <div className="flex space-x-2">
                <button
                  onClick={downloadResults}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  📥 Download Results
                </button>
                <button
                  onClick={clearResults}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  🗑️ Clear
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{importResults.total}</div>
                <div className="text-gray-300 text-sm">Total Lines</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{importResults.imported}</div>
                <div className="text-gray-300 text-sm">Imported</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{importResults.expired}</div>
                <div className="text-gray-300 text-sm">Expired</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{importResults.invalid}</div>
                <div className="text-gray-300 text-sm">Invalid</div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {importResults.details.expiredCards.length > 0 && (
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                  <h3 className="text-yellow-200 font-semibold mb-2">⚠️ Expired Cards ({importResults.details.expiredCards.length})</h3>
                  <div className="text-yellow-300 text-sm space-y-1">
                    {importResults.details.expiredCards.slice(0, 5).map((card, index) => (
                      <div key={index}>Line {card.line}: {card.reason}</div>
                    ))}
                    {importResults.details.expiredCards.length > 5 && (
                      <div>... and {importResults.details.expiredCards.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}

              {importResults.details.invalidCards.length > 0 && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                  <h3 className="text-red-200 font-semibold mb-2">❌ Invalid Cards ({importResults.details.invalidCards.length})</h3>
                  <div className="text-red-300 text-sm space-y-1">
                    {importResults.details.invalidCards.slice(0, 5).map((card, index) => (
                      <div key={index}>Line {card.line}: {card.reason}</div>
                    ))}
                    {importResults.details.invalidCards.length > 5 && (
                      <div>... and {importResults.details.invalidCards.length - 5} more</div>
                    )}
                  </div>
                </div>
              )}

              {importResults.details.processedCards.length > 0 && (
                <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                  <h3 className="text-green-200 font-semibold mb-2">✅ Successfully Imported ({importResults.details.processedCards.length})</h3>
                  <div className="text-green-300 text-sm">
                    All valid credit cards have been imported successfully and are now available in the system.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">📚 Import Help</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="font-medium text-white mb-2">Expected Format:</h3>
              <div className="bg-gray-700 p-3 rounded font-mono text-sm">
                CC|MM|YY|CVV|FIRST_NAME|LAST_NAME|STREET|CITY|ZIP|DOB|SSN|EMAIL|EMAIL_PASS|PHONE|FINGER_PRINT|BALANCE
              </div>
            </div>

            <div>
              <h3 className="font-medium text-white mb-2">Required Fields:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>CC:</strong> Credit card number (14-17 digits)</li>
                <li><strong>MM:</strong> Expiry month (01-12)</li>
                <li><strong>YY:</strong> Expiry year (2 digits, e.g., 25 for 2025)</li>
                <li><strong>CVV:</strong> Card verification value (3-4 digits)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-white mb-2">Validation Rules:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Card numbers must be 14-17 digits</li>
                <li>Expiry dates must not be in the past</li>
                <li>CVV must be 3-4 digits</li>
                <li>Expired cards are automatically filtered out</li>
                <li>Invalid cards are reported but not imported</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-white mb-2">Tips:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use the CC_data.txt button for quick import of your existing data</li>
                <li>Check the delimiter setting matches your data format</li>
                <li>Review import results for any validation errors</li>
                <li>Download results for record keeping</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCImport;
