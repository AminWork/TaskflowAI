import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Eye, EyeOff, Save, Loader2, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ResumeData {
  file?: File;
  text: string;
  fileName?: string;
  uploadDate?: string;
  fileUrl?: string;
}

export const Settings: React.FC<SettingsProps> = ({ user: _user }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load existing resume data from backend
  const [resumeData, setResumeData] = useState<ResumeData>({
    file: undefined,
    text: '',
  });
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Load profile data from backend on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const tokenRaw = localStorage.getItem('kanban-token');
        const token = tokenRaw ? JSON.parse(tokenRaw) : null;
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const fileUrl: string | undefined = data.resume_file || undefined;
          const fileName: string | undefined = fileUrl ? (fileUrl.split('/')?.pop() || undefined) : undefined;
          setResumeData(prev => ({ ...prev, text: data.resume || '', fileName, fileUrl }));
          setSkills(data.skills || '');
          setExperience(data.experience || '');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  const handleFileUpload = async (file: File) => {
    const allowedTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]);
    if (!allowedTypes.has(file.type)) {
      alert(t('settings.invalidFileType') || 'Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert(t('settings.fileTooLarge') || 'File size must be less than 5MB');
      return;
    }

    try {
      setSaveStatus('saving');
      const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;
      
      if (!token) {
        setSaveStatus('error');
        alert('Please log in to upload files');
        return;
      }
      
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/profile/upload-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        const newResumeData = {
          ...resumeData,
          file,
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          fileUrl: data.url as string,
        };
        setResumeData(newResumeData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        alert(t('settings.resumeSaved') || 'Resume file uploaded successfully!');
      } else {
        const error = await response.json();
        setSaveStatus('error');
        alert(error.error || 'Failed to upload file');
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleTextChange = (text: string) => {
    const newResumeData = { ...resumeData, text };
    setResumeData(newResumeData);
  };

  const saveResumeData = async (data: ResumeData) => {
    try {
      setSaveStatus('saving');
      const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume: data.text,
          skills: skills,
          experience: experience,
        }),
      });
      
      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        console.error('Failed to save profile');
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving profile:', error);
    }
  };

  const handleSave = async () => {
    await saveResumeData(resumeData);
    setIsEditing(false);
  };

  const handleRemoveFile = async () => {
    try {
      setSaveStatus('saving');
      const tokenRaw = localStorage.getItem('kanban-token');
      const token = tokenRaw ? JSON.parse(tokenRaw) : null;

      if (!token) {
        setSaveStatus('error');
        alert('Please log in to remove files');
        return;
      }

      const resp = await fetch('/api/profile/resume', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({} as any));
        setSaveStatus('error');
        alert(err.error || 'Failed to delete resume');
        return;
      }

      const newResumeData = {
        ...resumeData,
        file: undefined,
        fileName: undefined,
        uploadDate: undefined,
        fileUrl: undefined,
      };
      setResumeData(newResumeData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch (e) {
      console.error('Error deleting resume:', e);
      setSaveStatus('error');
      alert('Failed to delete resume');
    }
  };

  const downloadResume = () => {
    if (resumeData.fileUrl) {
      const a = document.createElement('a');
      a.href = resumeData.fileUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.download = resumeData.fileName || 'resume';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    if (resumeData.file) {
      const url = URL.createObjectURL(resumeData.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = resumeData.fileName || 'resume';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    alert('No resume file available to download');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          {t('settings.title') || 'Settings'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {t('settings.subtitle') || 'Manage your profile and resume information'}
        </p>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
          <span className="ml-2 text-slate-600 dark:text-slate-400">
            {t('settings.loading') || 'Loading profile...'}
          </span>
        </div>
      )}
      
      {/* Resume Section */}
      {!loading && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-500 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                {t('settings.resumeSection') || 'Resume & CV'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('settings.resumeDescription') || 'Upload your resume file or write your CV details'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPreview ? (t('settings.hidePreview') || 'Hide Preview') : (t('settings.showPreview') || 'Show Preview')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
              {t('settings.uploadFile') || 'Upload Resume File'}
            </h3>
            
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-slate-300 dark:border-slate-600 hover:border-teal-400 dark:hover:border-teal-500'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {resumeData.fileName ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-teal-600 dark:text-teal-400">
                    <FileText className="w-8 h-8" />
                    <div className="text-left">
                      <p className="font-medium">{resumeData.fileName}</p>
                      {resumeData.uploadDate && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t('settings.uploaded') || 'Uploaded'}: {new Date(resumeData.uploadDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={downloadResume}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-md hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('settings.download') || 'Download'}</span>
                    </button>
                    <button
                      onClick={handleRemoveFile}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>{t('settings.remove') || 'Remove'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                      {t('settings.dragDropFile') || 'Drag and drop your resume file here, or'}
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {t('settings.browseFiles') || 'Browse Files'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('settings.supportedFormats') || 'Supported formats: PDF, DOC, DOCX, TXT (Max 5MB)'}
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Text Resume Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                {t('settings.writeResume') || 'Write Your Resume'}
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 text-sm font-medium"
              >
                {isEditing ? (t('settings.cancel') || 'Cancel') : (t('settings.edit') || 'Edit')}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={resumeData.text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={t('settings.resumePlaceholder') || 'Write your resume details here...\n\nInclude:\n• Professional summary\n• Work experience\n• Education\n• Skills\n• Achievements'}
                  className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400 resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    {t('settings.cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>
                      {saveStatus === 'saving' ? (t('settings.saving') || 'Saving...') : 
                       saveStatus === 'saved' ? (t('settings.resumeSaved') || 'Saved!') :
                       saveStatus === 'error' ? (t('settings.saveError') || 'Error') :
                       (t('settings.save') || 'Save')}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="min-h-64 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                {resumeData.text ? (
                  <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {resumeData.text}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    <p>{t('settings.noResumeText') || 'No resume text added yet. Click Edit to add your resume details.'}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && (resumeData.text || resumeData.fileName) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">
              {t('settings.resumePreview') || 'Resume Preview'}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 space-y-4">
              {resumeData.fileName && (
                <div className="flex items-center space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <FileText className="w-6 h-6 text-teal-500" />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{resumeData.fileName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('settings.uploaded') || 'Uploaded'}: {resumeData.uploadDate ? new Date(resumeData.uploadDate).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              )}
              {resumeData.text && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {resumeData.text}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
      )}
    </div>
  );
}
