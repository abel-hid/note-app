"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface Note {
  id: string;
  title: string;
  content: string;
  tags_list: string[];
  visibility: 'private' | 'shared' | 'public';
  created_at: string;
  updated_at: string;
  author_username: string;
  public_token?: string;
}

interface SharedNote {
  id: string;
  note: Note;
  shared_with_username?: string;
  shared_by_username?: string;
  shared_at: string;
  can_edit: boolean;
}

interface NoteFormData {
  title: string;
  content: string;
  tags_list: string[];
  visibility: 'private' | 'shared' | 'public';
}

interface Notification {
  message: string;
  type: 'success' | 'error';
}

interface User {
  id: string;
  username: string;
  email: string;
}

const api = {
  getNotes: async (): Promise<Note[]> => {
    const response = await apiClient.get<Note[]>('/notes/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  getSharedNotes: async (): Promise<SharedNote[]> => {
    const response = await apiClient.get<SharedNote[]>('/shared-notes/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  getMySharedNotes: async (): Promise<SharedNote[]> => {
    const response = await apiClient.get<SharedNote[]>('/shared-notes/by_me/', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  createNote: async (noteData: NoteFormData): Promise<Note> => {
    const response = await apiClient.post<Note>('/notes/', noteData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  updateNote: async (noteId: string, noteData: Partial<NoteFormData>): Promise<Note> => {
    const response = await apiClient.put<Note>(`/notes/${noteId}/`, noteData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
    return response.data;
  },

  deleteNote: async (noteId: string): Promise<void> => {
    await apiClient.delete(`/notes/${noteId}/`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
  },

  shareNote: async (noteId: string, username: string): Promise<void> => {
    await apiClient.post(`/notes/${noteId}/share/`, { username }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    });
  }
};

const renderMarkdown = (content: string) => {
  if (!content) return '';
  
  let html = content
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-base font-semibold mt-4 mb-2">$1</h4>')
    .replace(/^##### (.*$)/gm, '<h5 class="text-sm font-semibold mt-4 mb-2">$1</h5>')
    
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded mt-2 mb-2 overflow-x-auto font-mono"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded font-mono">$1</code>')
    
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-400 pl-4 italic my-2">$1</blockquote>')
    
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
    
    .replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank">$1</a>')
    
    .replace(/^---$/gm, '<hr class="my-4 border-gray-300">')
    
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br>');
  
  if (!html.startsWith('<')) {
    html = `<p class="my-2">${html}</p>`;
  } else if (!html.startsWith('<p')) {
    html = `<div>${html}</div>`;
  }
  
  return html;
};

const VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private', color: 'bg-gray-100 text-gray-800', icon: '🔒' },
  { value: 'shared', label: 'Shared', color: 'bg-blue-100 text-blue-800', icon: '👥' },
  { value: 'public', label: 'Public', color: 'bg-green-100 text-green-800', icon: '🌐' },
];

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'shared'>('dashboard');
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedNote[]>([]);
  const [sharedByMe, setSharedByMe] = useState<SharedNote[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'shared' | 'public'>('all');
  const [sharedTab, setSharedTab] = useState<'with-me' | 'by-me'>('with-me');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [shareUsername, setShareUsername] = useState('');
  const [shareNoteId, setShareNoteId] = useState<string | null>(null);
  const [showNoteDetail, setShowNoteDetail] = useState<Note | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  
  const [formData, setFormData] = useState<NoteFormData>({
    title: '',
    content: '',
    tags_list: [],
    visibility: 'private',
  });

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userResponse = await apiClient.get<User>('/current-user/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        setCurrentUser(userResponse.data);
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await apiClient.get<User[]>('/all-users/', {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
        });
        const filteredUsers = response.data.filter(user => user.username !== currentUser?.username);
        setAllUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching all users:', error);
      }
    };
    
    if (currentUser) {
      fetchAllUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [notes, activeTab, searchQuery, selectedTag]);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [notesData, sharedWithMeData, sharedByMeData] = await Promise.all([
        api.getNotes(),
        api.getSharedNotes(),
        api.getMySharedNotes()
      ]);
      setNotes(notesData);
      setSharedWithMe(sharedWithMeData);
      setSharedByMe(sharedByMeData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch data';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = useCallback(() => {
    let filtered = [...notes];

    if (activeTab !== 'all') {
      filtered = filtered.filter(note => note.visibility === activeTab);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(note => {
        const inTitle = note.title.toLowerCase().includes(query);
        const inContent = note.content.toLowerCase().includes(query);
        const inTags = note.tags_list.some(tag => 
          tag.toLowerCase().includes(query)
        );
        return inTitle || inContent || inTags;
      });
    }

    if (selectedTag) {
      filtered = filtered.filter(note => 
        note.tags_list.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    setFilteredNotes(filtered);
  }, [notes, activeTab, searchQuery, selectedTag]);

  const showNotification = (message: string, type: Notification['type'] = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getAllTags = () => {
    const allTags = notes.flatMap(note => note.tags_list);
    return [...new Set(allTags)].sort();
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(successMessage);
    } catch (error) {
      showNotification('Failed to copy to clipboard', 'error');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagsInput(value);
    
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag) {
        setFormData({
          ...formData,
          tags_list: [...formData.tags_list, newTag]
        });
        setTagsInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags_list: formData.tags_list.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showNotification('Please enter a title', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      let newOrUpdatedNote: Note;
      if (editingNote) {
        newOrUpdatedNote = await api.updateNote(editingNote.id, formData);
        showNotification('Note updated successfully!');
        setNotes(prev => prev.map(note => 
          note.id === editingNote.id ? newOrUpdatedNote : note
        ));
      } else {
        newOrUpdatedNote = await api.createNote(formData);
        showNotification('Note created successfully!');
        setNotes(prev => [newOrUpdatedNote, ...prev]);
      }
      
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Operation failed';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags_list: note.tags_list,
      visibility: note.visibility,
    });
    setTagsInput('');
    setShowCreateForm(true);
    setActiveSection('dashboard');
  };

  const handleDelete = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await api.deleteNote(noteId);
        showNotification('Note deleted successfully!');
        setNotes(prev => prev.filter(note => note.id !== noteId));
        if (showNoteDetail?.id === noteId) setShowNoteDetail(null);
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Delete failed';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareNoteId || !shareUsername.trim()) return;
    
    try {
      await api.shareNote(shareNoteId, shareUsername.trim());
      showNotification(`Note shared successfully with ${shareUsername}!`);
      setShareUsername('');
      setShareNoteId(null);
      fetchAllData(); 
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Sharing failed';
      showNotification(errorMessage, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      tags_list: [],
      visibility: 'private',
    });
    setTagsInput('');
    setEditingNote(null);
    setShowCreateForm(false);
  };

  const copyPublicLink = (note: Note) => {
    if (note.public_token) {
      const link = `${window.location.origin}/public/${note.public_token}`;
      copyToClipboard(link, 'Public link copied to clipboard!');
    }
  };

  const canEditNote = (note: Note) => {
    if (currentUser?.username === note.author_username) return true;
    
    const sharedNote = sharedWithMe.find(
      shared => shared.note.id === note.id && shared.can_edit
    );
    
    return !!sharedNote;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Notes App</h1>
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveSection('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📝 Dashboard
                </button>
                <button
                  onClick={() => setActiveSection('shared')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'shared'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  👥 Shared Notes
                </button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {currentUser?.username || 'Guest'}!
              </span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg shadow-sm ${
            notification.type === 'error' 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">📝</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Notes</p>
                    <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🔒</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Private</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {notes.filter(n => n.visibility === 'private').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">👥</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Shared</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {notes.filter(n => n.visibility === 'shared').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🌐</div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Public</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {notes.filter(n => n.visibility === 'public').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Notes</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>➕</span>
                <span>{showCreateForm ? 'Cancel' : 'Create Note'}</span>
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingNote ? '✏️ Edit Note' : '➕ Create New Note'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter note title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content (Markdown supported)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      rows={10}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your note content here... You can use markdown formatting."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags (type and press comma)
                      </label>
                      <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[3rem] bg-white">
                        {formData.tags_list.map(tag => (
                          <div 
                            key={tag} 
                            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            <span>#{tag}</span>
                            <button 
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={tagsInput}
                          onChange={handleTagsChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagsInput.trim()) {
                              setFormData({
                                ...formData,
                                tags_list: [...formData.tags_list, tagsInput.trim()]
                              });
                              setTagsInput('');
                              e.preventDefault();
                            } else if (e.key === 'Backspace' && tagsInput === '') {
                              // Remove last tag when backspace pressed on empty input
                              if (formData.tags_list.length > 0) {
                                removeTag(formData.tags_list[formData.tags_list.length - 1]);
                              }
                            }
                          }}
                          placeholder="Add tags..."
                          className="flex-1 min-w-[100px] p-1 focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Type a tag and press comma or enter to add
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visibility
                      </label>
                      <select
                        value={formData.visibility}
                        onChange={(e) => setFormData({
                          ...formData, 
                          visibility: e.target.value as any
                        })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {VISIBILITY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : (editingNote ? 'Update Note' : 'Create Note')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Search notes by title, content, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value)}
                      className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">All Tags</option>
                      {getAllTags().map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                    
                    {(searchQuery || selectedTag) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTag('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      activeTab === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All ({notes.length})
                  </button>
                  {VISIBILITY_OPTIONS.map(option => {
                    const count = notes.filter(note => note.visibility === option.value).length;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setActiveTab(option.value as 'all' | 'private' | 'shared' | 'public')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeTab === option.value 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {option.icon} {option.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Loading notes...</div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredNotes.map(note => (
                  <div key={note.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600"
                            onClick={() => setShowNoteDetail(note)}>
                          {note.title}
                        </h3>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          VISIBILITY_OPTIONS.find(opt => opt.value === note.visibility)?.color
                        }`}>
                          {VISIBILITY_OPTIONS.find(opt => opt.value === note.visibility)?.icon}
                          {VISIBILITY_OPTIONS.find(opt => opt.value === note.visibility)?.label}
                        </span>
                      </div>
                      
                      {note.content && (
                        <div className="prose prose-sm max-w-none mb-3">
                          <div className="text-gray-600 text-sm line-clamp-3">
                            {note.content.substring(0, 150)}
                            {note.content.length > 150 && '...'}
                          </div>
                        </div>
                      )}
                      
                      {note.tags_list && note.tags_list.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {note.tags_list.slice(0, 3).map(tag => (
                            <span 
                              key={tag} 
                              className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-100"
                              onClick={() => setSelectedTag(tag)}
                            >
                              #{tag}
                            </span>
                          ))}
                          {note.tags_list.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              +{note.tags_list.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mb-4">
                        <div>Created: {new Date(note.created_at).toLocaleDateString()}</div>
                        {note.updated_at !== note.created_at && (
                          <div>Updated: {new Date(note.updated_at).toLocaleDateString()}</div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setShowNoteDetail(note)}
                          className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200 transition-colors"
                        >
                          👁️ View
                        </button>
                        
                        {/* Show edit/delete only to author or users with edit permission */}
                        {canEditNote(note) && (
                          <>
                            <button
                              onClick={() => handleEdit(note)}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
                        
                        {/* Show share button only to author */}
                        {currentUser?.username === note.author_username && (
                          <button
                            onClick={() => setShareNoteId(note.id)}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
                          >
                            📤 Share
                          </button>
                        )}
                        
                    
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredNotes.length === 0 && !isLoading && (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="text-4xl mb-4">📝</div>
                <div className="text-gray-500 text-lg mb-2">
                  {searchQuery || selectedTag ? 'No notes found matching your criteria.' : 'No notes yet.'}
                </div>
                <div className="text-gray-400 text-sm">
                  {searchQuery || selectedTag ? 'Try adjusting your search or filters.' : 'Create your first note to get started!'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'shared' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Shared Notes</h2>
              <p className="text-gray-600">Manage notes shared with you and notes you've shared with others</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setSharedTab('with-me')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    sharedTab === 'with-me'
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📥 Shared With Me ({sharedWithMe.length})
                </button>
                <button
                  onClick={() => setSharedTab('by-me')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    sharedTab === 'by-me'
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📤 Shared By Me ({sharedByMe.length})
                </button>
              </div>

              <div className="p-6">
                {sharedTab === 'with-me' && (
                  <div>
                    {sharedWithMe.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">📥</div>
                        <div className="text-gray-500 text-lg">No notes have been shared with you yet.</div>
                        <div className="text-gray-400 text-sm mt-2">When someone shares a note with you, it will appear here.</div>
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sharedWithMe.map(shared => (
                          <div key={shared.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600"
                                  onClick={() => setShowNoteDetail(shared.note)}>
                                {shared.note.title}
                              </h3>
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {shared.can_edit ? '✏️ Can Edit' : '👁️ Read Only'}
                              </span>
                            </div>
                            
                            {shared.note.content && (
                              <div className="prose prose-sm max-w-none mb-3">
                                <div className="text-gray-600 text-sm line-clamp-3">
                                  {shared.note.content.substring(0, 150)}
                                  {shared.note.content.length > 150 && '...'}
                                </div>
                              </div>
                            )}
                            
                            {shared.note.tags_list && shared.note.tags_list.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {shared.note.tags_list.slice(0, 3).map(tag => (
                                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    #{tag}
                                  </span>
                                ))}
                                {shared.note.tags_list.length > 3 && (
                                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                    +{shared.note.tags_list.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 mb-4">
                              <div>📧 Shared by: {shared.shared_by_username}</div>
                              <div>📅 Shared on: {new Date(shared.shared_at).toLocaleDateString()}</div>
                              <div>📝 Created: {new Date(shared.note.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowNoteDetail(shared.note)}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                              >
                                👁️ View
                              </button>
                              {shared.can_edit && (
                                <button
                                  onClick={() => handleEdit(shared.note)}
                                  className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition-colors"
                                >
                                  ✏️ Edit
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {sharedTab === 'by-me' && (
                  <div>
                    {sharedByMe.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-4">📤</div>
                        <div className="text-gray-500 text-lg">You haven't shared any notes yet.</div>
                        <div className="text-gray-400 text-sm mt-2">Share your notes with others to collaborate and exchange ideas.</div>
                      </div>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {sharedByMe.map(shared => (
                          <div key={shared.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 cursor-pointer hover:text-blue-600"
                                  onClick={() => setShowNoteDetail(shared.note)}>
                                {shared.note.title}
                              </h3>
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                📤 Shared
                              </span>
                            </div>
                            
                            {shared.note.content && (
                              <div className="prose prose-sm max-w-none mb-3">
                                <div className="text-gray-600 text-sm line-clamp-3">
                                  {shared.note.content.substring(0, 150)}
                                  {shared.note.content.length > 150 && '...'}
                                </div>
                              </div>
                            )}
                            
                            {shared.note.tags_list && shared.note.tags_list.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {shared.note.tags_list.slice(0, 3).map(tag => (
                                  <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    #{tag}
                                  </span>
                                ))}
                                {shared.note.tags_list.length > 3 && (
                                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                    +{shared.note.tags_list.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 mb-4">
                              <div>📧 Shared with: {shared.shared_with_username}</div>
                              <div>📅 Shared on: {new Date(shared.shared_at).toLocaleDateString()}</div>
                              <div>📝 Created: {new Date(shared.note.created_at).toLocaleDateString()}</div>
                            </div>
                            
                            <div className="flex gap-2">
                              {currentUser?.username === shared.note.author_username && (
                                <>
                                  <button
                                    onClick={() => handleEdit(shared.note)}
                                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                                  >
                                    ✏️ Edit
                                  </button>
                                  
                            
                                </>
                              )}
                              
                              <button
                                onClick={() => setShowNoteDetail(shared.note)}
                                className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded text-sm hover:bg-indigo-200 transition-colors"
                              >
                                👁️ View
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showNoteDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-gray-900">{showNoteDetail.title}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  VISIBILITY_OPTIONS.find(opt => opt.value === showNoteDetail.visibility)?.color
                }`}>
                  {VISIBILITY_OPTIONS.find(opt => opt.value === showNoteDetail.visibility)?.icon}
                  {VISIBILITY_OPTIONS.find(opt => opt.value === showNoteDetail.visibility)?.label}
                </span>
              </div>
              <button
                onClick={() => setShowNoteDetail(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between text-sm text-gray-500 border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center space-x-4">
                  <span>📧 By: {showNoteDetail.author_username}</span>
                  <span>•</span>
                  <span>📅 Created: {new Date(showNoteDetail.created_at).toLocaleDateString()}</span>
                  {showNoteDetail.updated_at !== showNoteDetail.created_at && (
                    <>
                      <span>•</span>
                      <span>🔄 Updated: {new Date(showNoteDetail.updated_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {canEditNote(showNoteDetail) && (
                    <button
                      onClick={() => {
                        handleEdit(showNoteDetail);
                        setShowNoteDetail(null);
                      }}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  
                  {currentUser?.username === showNoteDetail.author_username && (
                    <button
                      onClick={() => {
                        handleDelete(showNoteDetail.id);
                        setShowNoteDetail(null);
                      }}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  )}
                  
                </div>
              </div>

              {showNoteDetail.tags_list && showNoteDetail.tags_list.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {showNoteDetail.tags_list.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-200"
                      onClick={() => {
                        setSelectedTag(tag);
                        setActiveSection('dashboard');
                        setShowNoteDetail(null);
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Note Content */}
              <div className="prose prose-lg max-w-none">
                {showNoteDetail.content ? (
                  <div 
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(showNoteDetail.content) }}
                  />
                ) : (
                  <div className="text-gray-500 italic text-center py-8">
                    This note has no content.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareNoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📤 Share Note</h3>
              <button
                onClick={() => {
                  setShareNoteId(null);
                  setShareUsername('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleShare}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <div className="relative">
                  <select
                    value={shareUsername}
                    onChange={(e) => setShareUsername(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a user</option>
                    {allUsers.map(user => (
                      <option key={user.id} value={user.username}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  The user will receive access to this note.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Sharing...' : '📤 Share'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShareNoteId(null);
                    setShareUsername('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}