import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

interface AppSettings {
  pricePerKm: number;
  updatedAt: any;
  updatedBy: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    pricePerKm: 0.5,
    updatedAt: null,
    updatedBy: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricePerKm, setPricePerKm] = useState('0.5');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, 'settings', 'app');
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as AppSettings;
        setSettings(data);
        setPricePerKm((data.pricePerKm || 0.5).toString());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const pricePerKmValue = parseFloat(pricePerKm);

    // Validation
    if (isNaN(pricePerKmValue) || pricePerKmValue < 0) {
      alert('Price per km must be a positive number');
      return;
    }

    try {
      setSaving(true);
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');

      const settingsRef = doc(db, 'settings', 'app');
      const updatedSettings: AppSettings = {
        pricePerKm: pricePerKmValue,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser.uid,
      };

      await setDoc(settingsRef, updatedSettings);
      setSettings(updatedSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">App Settings</h1>
        <p className="text-gray-600 mt-2">Configure global application settings</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        {/* Price Per KM Setting */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Per Kilometer ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={pricePerKm}
            onChange={(e) => setPricePerKm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.5"
          />
          <p className="text-sm text-gray-500 mt-2">
            Cost per kilometer for delivery distance calculation (added to weight-based price)
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Example:</strong> If set to $0.50/km, a 10km delivery will add $5 to the weight-based price
            </p>
          </div>
        </div>

        {/* Last Updated Info */}
        {settings.updatedAt && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Last Updated:</strong>{' '}
              {settings.updatedAt.toDate().toLocaleString()}
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠️ Important Notes:
          </h3>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>Changes take effect immediately for all new transactions</li>
            <li>Existing pending transactions use the old rates</li>
            <li>Price per km is applied to pickup-to-destination distance</li>
            <li>Total delivery price = Weight price + (Distance × Price per km)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
