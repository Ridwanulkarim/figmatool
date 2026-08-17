import React, { useState } from 'react';
import { FolderOpen, Plus, Trash2, Edit2, Check, X, Sparkles } from 'lucide-react';

export default function ProjectModal({
  isOpen,
  onClose,
  projectsList,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
}) {
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  const handleRename = (id) => {
    if (editingName.trim()) {
      onRenameProject(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
            <FolderOpen size={18} />
            <span className="text-gray-100 font-bold text-base">Projects Manager</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        {/* Create New Project Form */}
        <form onSubmit={handleCreate} className="p-4 bg-gray-950/60 border-b border-gray-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="New design project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-200 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newProjectName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs px-3.5 py-2 rounded-lg font-medium flex items-center space-x-1.5 transition-colors"
          >
            <Plus size={14} />
            <span>Create</span>
          </button>
        </form>

        {/* Project List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {projectsList.map((p) => {
            const isCurrent = p.id === currentProjectId;
            return (
              <div
                key={p.id}
                className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                    : 'bg-gray-800/40 border-gray-800 text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCurrent ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    <Sparkles size={16} />
                  </div>

                  {editingId === p.id ? (
                    <div className="flex items-center space-x-1 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-gray-950 text-white px-2 py-1 rounded border border-indigo-500 text-xs w-full outline-none"
                        autoFocus
                      />
                      <button onClick={() => handleRename(p.id)} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="truncate cursor-pointer" onClick={() => onSelectProject(p.id)}>
                      <div className="font-semibold text-xs text-gray-200 truncate flex items-center space-x-2">
                        <span>{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30 font-mono">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Updated {new Date(p.updatedAt).toLocaleDateString()} at {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1 pl-2">
                  <button
                    onClick={() => { setEditingId(p.id); setEditingName(p.name); }}
                    className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-gray-700"
                    title="Rename Project"
                  >
                    <Edit2 size={14} />
                  </button>
                  {projectsList.length > 1 && (
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded hover:bg-red-950/40"
                      title="Delete Project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
