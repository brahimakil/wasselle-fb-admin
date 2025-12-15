import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useTheme } from '../contexts/ThemeContext';
import { 
  RocketIcon, 
  MobileIcon, 
  ExclamationTriangleIcon, 
  CheckCircledIcon,
  DownloadIcon,
  UploadIcon
} from '@radix-ui/react-icons';

interface VersionConfig {
  android_latest_version: string;
  android_min_version: string;
  android_store_url: string;
  ios_latest_version: string;
  ios_min_version: string;
  ios_store_url: string;
}

interface ApkVersion {
  id: string;
  version: string;
  url: string;
  createdAt: any;
}

const DEFAULT_CONFIG: VersionConfig = {
  android_latest_version: '1.0.0',
  android_min_version: '1.0.0',
  android_store_url: 'https://routee.pro',
  ios_latest_version: '1.0.0',
  ios_min_version: '1.0.0',
  ios_store_url: 'https://apps.apple.com/us/app/routee/id6752538470',
};

const VersionControl = () => {
  const { theme } = useTheme();
  const [config, setConfig] = useState<VersionConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // APK Management State
  const [apkVersions, setApkVersions] = useState<ApkVersion[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadConfig();
    loadApkVersions();
  }, []);

  const loadApkVersions = async () => {
    try {
      const q = query(collection(db, 'apk_releases'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const versions: ApkVersion[] = [];
      querySnapshot.forEach((doc) => {
        versions.push({ id: doc.id, ...doc.data() } as ApkVersion);
      });
      setApkVersions(versions);
    } catch (error) {
      console.error('Error loading APK versions:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !newVersion) return;

    setUploading(true);
    try {
      // 1. Upload to Storage
      const storageRef = ref(storage, `apks/routee_v${newVersion}.apk`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Save to Firestore
      await addDoc(collection(db, 'apk_releases'), {
        version: newVersion,
        url: downloadURL,
        createdAt: new Date()
      });

      // 3. Refresh list and clear form
      await loadApkVersions();
      setNewVersion('');
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'APK uploaded successfully' });
    } catch (error) {
      console.error('Error uploading APK:', error);
      setMessage({ type: 'error', text: 'Failed to upload APK' });
    } finally {
      setUploading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const docRef = doc(db, 'settings', 'version_control');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...docSnap.data() } as VersionConfig);
      }
    } catch (error) {
      console.error('Error loading version config:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, 'settings', 'version_control');
      await setDoc(docRef, config);
      setMessage({ type: 'success', text: 'Version configuration saved successfully' });
    } catch (error) {
      console.error('Error saving version config:', error);
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof VersionConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          App Version Control
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <DownloadIcon className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircledIcon className="w-5 h-5 mr-2" /> : <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
          {message.text}
        </div>
      )}

      {/* APK Upload Section */}
      <div className="p-6 rounded-xl shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <div className={`p-3 rounded-full mr-4 ${
            theme === 'dark' ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'
          }`}>
            <UploadIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upload New APK
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload a new version of the Android app
            </p>
          </div>
        </div>

        <form onSubmit={handleFileUpload} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Version Number
            </label>
            <input
              type="text"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="e.g. 1.3.7"
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              APK File
            </label>
            <input
              type="file"
              accept=".apk"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className={`w-full px-3 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !selectedFile || !newVersion}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
          >
            {uploading ? 'Uploading...' : 'Upload APK'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Android Configuration */}
        <div className="p-6 rounded-xl shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <div className={`p-3 rounded-full mr-4 ${
              theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <MobileIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Android Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage Android app versions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Latest Version
              </label>
              <div className="flex gap-2">
                <select
                  value={config.android_latest_version}
                  onChange={(e) => handleChange('android_latest_version', e.target.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select a version...</option>
                  {apkVersions.map(apk => (
                    <option key={apk.id} value={apk.version}>
                      {apk.version} ({new Date(apk.createdAt.seconds * 1000).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This version will be available for download on your branding site</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Minimum Required Version
              </label>
              <select
                value={config.android_min_version}
                onChange={(e) => handleChange('android_min_version', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="">Select a version...</option>
                {apkVersions.map(apk => (
                  <option key={apk.id} value={apk.version}>
                    {apk.version}
                  </option>
                ))}
              </select>
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">Users below this version will be BLOCKED</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Store URL
              </label>
              <input
                type="text"
                value={config.android_store_url}
                onChange={(e) => handleChange('android_store_url', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* iOS Configuration */}
        <div className="p-6 rounded-xl shadow-sm border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <div className={`p-3 rounded-full mr-4 ${
              theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-100 text-gray-900'
            }`}>
              <MobileIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                iOS Configuration
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage iOS app versions
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Latest Version
              </label>
              <input
                type="text"
                value={config.ios_latest_version}
                onChange={(e) => handleChange('ios_latest_version', e.target.value)}
                placeholder="e.g. 1.3.6"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Users below this version will see "Update Available"</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Minimum Required Version
              </label>
              <input
                type="text"
                value={config.ios_min_version}
                onChange={(e) => handleChange('ios_min_version', e.target.value)}
                placeholder="e.g. 1.3.0"
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">Users below this version will be BLOCKED</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Store URL
              </label>
              <input
                type="text"
                value={config.ios_store_url}
                onChange={(e) => handleChange('ios_store_url', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionControl;
