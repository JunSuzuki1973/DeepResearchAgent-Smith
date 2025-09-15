import React, { useState } from 'react';
import { Download, Eye, FileText, Code, Image, Play } from 'lucide-react';

interface GeneratedFile {
  id: string;
  name: string;
  type: 'html' | 'css' | 'js' | 'python' | 'json' | 'txt';
  content: string;
  size: number;
  createdAt: Date;
  previewUrl?: string;
}

interface FileManagerProps {
  files: GeneratedFile[];
  onPreview: (file: GeneratedFile) => void;
  onDownload: (file: GeneratedFile) => void;
}

const FileManager: React.FC<FileManagerProps> = ({ files, onPreview, onDownload }) => {
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);

  const getFileIcon = (type: GeneratedFile['type']) => {
    switch (type) {
      case 'html':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'css':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'js':
        return <Code className="w-5 h-5 text-yellow-600" />;
      case 'python':
        return <Code className="w-5 h-5 text-green-600" />;
      case 'json':
        return <FileText className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canPreview = (type: GeneratedFile['type']) => {
    return ['html', 'css', 'js', 'json', 'txt'].includes(type);
  };

  const canExecute = (type: GeneratedFile['type']) => {
    return ['html', 'python'].includes(type);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">生成されたファイル</h3>
        <p className="text-sm text-gray-600 mt-1">{files.length}個のファイルが生成されました</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {files.map((file) => (
          <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(file.type)}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {file.createdAt.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {canPreview(file.type) && (
                  <button
                    onClick={() => onPreview(file)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="プレビュー"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                
                {canExecute(file.type) && (
                  <button
                    onClick={() => onPreview(file)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="実行"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => onDownload(file)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="ダウンロード"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {files.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>まだファイルが生成されていません</p>
            <p className="text-sm mt-1">コーディングエージェントがファイルを作成すると、ここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;