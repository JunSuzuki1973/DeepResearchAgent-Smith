import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Code, Eye } from 'lucide-react';

interface GeneratedFile {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'python' | 'json' | 'txt';
  content: string;
  size: number;
  createdAt: Date;
  previewUrl?: string;
}

interface PreviewModalProps {
  file: GeneratedFile | null;
  isOpen: boolean;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ file, isOpen, onClose }) => {
  const [previewMode, setPreviewMode] = useState<'code' | 'preview'>('code');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (file && file.type === 'html') {
      // Create blob URL for HTML preview
      const blob = new Blob([file.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const canShowPreview = file.type === 'html';

  const getLanguage = (type: string) => {
    switch (type) {
      case 'js': return 'javascript';
      case 'py': return 'python';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return 'text';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
            {canShowPreview && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('code')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    previewMode === 'code'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-1" />
                  コード
                </button>
                <button
                  onClick={() => setPreviewMode('preview')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    previewMode === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  プレビュー
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {previewMode === 'preview' && previewUrl && (
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="新しいタブで開く"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {previewMode === 'code' ? (
            <div className="h-full overflow-auto">
              <pre className="p-4 text-sm font-mono bg-gray-50 h-full overflow-auto">
                <code className={`language-${getLanguage(file.type)}`}>
                  {file.content}
                </code>
              </pre>
            </div>
          ) : (
            <div className="h-full">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={`Preview of ${file.name}`}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>このファイルタイプはプレビューできません</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              ファイルタイプ: {file.type.toUpperCase()} • サイズ: {(file.size / 1024).toFixed(2)} KB
            </div>
            <div>
              作成日時: {file.createdAt.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;