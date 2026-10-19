import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  FileCode, 
  FileJson, 
  File, 
  ArrowLeft, 
  Plus, 
  FolderPlus, 
  Save, 
  X, 
  RefreshCw,
  Edit3,
  Check,
  HardDrive
} from 'lucide-react';
import { api } from '../services/api';

export default function FileManagerView({ initialPath }) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [parentPath, setParentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Editor modal state
  const [editingFile, setEditingFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New file/folder modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isNewFolder, setIsNewFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const loadDirectory = async (targetPath) => {
    try {
      setLoading(true);
      const res = await api.getFiles(targetPath);
      if (res.success) {
        setFiles(res.files);
        setCurrentPath(res.currentPath);
        setParentPath(res.parentPath);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory(initialPath || '');
  }, [initialPath]);

  const handleOpenFile = async (file) => {
    if (file.isDirectory) {
      loadDirectory(file.path);
    } else {
      try {
        const res = await api.getFileContent(file.path);
        if (res.success) {
          setEditingFile(file);
          setEditorContent(res.content);
        }
      } catch (err) {
        alert('Failed to read file: ' + err.message);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    try {
      setSavingFile(true);
      await api.saveFileContent(editingFile.path, editorContent);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSavingFile(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemName) return;
    try {
      await api.createFileOrFolder(currentPath, newItemName, isNewFolder);
      setShowCreateModal(false);
      setNewItemName('');
      loadDirectory(currentPath);
    } catch (err) {
      alert('Create failed: ' + err.message);
    }
  };

  const getFileIcon = (file) => {
    if (file.isDirectory) return <Folder className="w-4 h-4 text-amber-400" />;
    const ext = file.name.split('.').pop().toLowerCase();
    if (['js', 'ts', 'jsx', 'tsx', 'php', 'py', 'sh'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-cyan-400" />;
    }
    if (['json', 'yaml', 'yml'].includes(ext)) {
      return <FileJson className="w-4 h-4 text-emerald-400" />;
    }
    if (['html', 'htm', 'css'].includes(ext)) {
      return <FileText className="w-4 h-4 text-indigo-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-indigo-400" />
            <span>File Explorer & Editor</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse server files, edit code and configuration files directly in the browser.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsNewFolder(false);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New File</span>
          </button>

          <button
            onClick={() => {
              setIsNewFolder(true);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <FolderPlus className="w-4 h-4 text-amber-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => loadDirectory(currentPath)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Breadcrumb Path Bar */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
        <button
          onClick={() => loadDirectory(parentPath)}
          disabled={!parentPath || parentPath === currentPath}
          className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent text-slate-400 hover:text-white"
          title="Go Up One Directory"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-slate-500">Path:</span>
        <span className="text-indigo-400 font-semibold">{currentPath}</span>
      </div>

      {/* Files Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800 font-sans">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Size</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4">Modified</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {files.map((file, idx) => (
                <tr 
                  key={idx}
                  onDoubleClick={() => handleOpenFile(file)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-3.5 text-slate-200">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <span className={`group-hover:text-indigo-400 transition-colors ${file.isDirectory ? 'font-semibold text-slate-100' : ''}`}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400">{file.size}</td>
                  <td className="px-6 py-3.5 text-slate-400">{file.permissions}</td>
                  <td className="px-6 py-3.5 text-slate-400">{file.modified}</td>
                  <td className="px-6 py-3.5 text-right font-sans">
                    <button
                      onClick={() => handleOpenFile(file)}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-xs transition-colors"
                    >
                      {file.isDirectory ? 'Open' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-sans">
                    Folder is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Editor Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-mono text-white font-semibold">{editingFile.name}</span>
                <span className="text-xs font-mono text-slate-500 truncate max-w-sm">({editingFile.path})</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveFile}
                  disabled={savingFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingFile ? 'Saving...' : 'Save File'}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-2 bg-slate-950 font-mono text-xs">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                className="w-full h-full p-4 bg-slate-950 text-indigo-200 resize-none focus:outline-none border-none leading-relaxed tracking-wide font-mono selection:bg-indigo-700"
                spellCheck="false"
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                {isNewFolder ? 'Create New Folder' : 'Create New File'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  placeholder={isNewFolder ? 'e.g. assets' : 'e.g. config.json or app.js'}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
