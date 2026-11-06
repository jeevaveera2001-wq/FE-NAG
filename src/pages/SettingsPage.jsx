import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import NagulanBanner from '../components/NagulanBanner';
import {
  Settings,
  Upload,
  Save,
  CheckCircle2,
  Building,
  Receipt,
  FileText,
  Shield,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { isSuperAdmin } = useAuth();

  const [settings, setSettings] = useState({
    salonName: 'NAGULAN Unisex Salon',
    tagline: 'Hair | Skin | Beauty | Makeup',
    franchiseEnquiry: '97899 61617',
    phone: '97899 61617',
    email: 'nagulanunisexsalon@gmail.com',
    address: 'Nagulan salon , Indur , Dharmapuri , PIN 636803',
    gstNumber: '',
    isGstEnabled: false,
    defaultGstPercent: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    currencySymbol: '₹',
    receiptFooterMessage: 'Thank you for visiting NAGULAN Unisex Salon',
    receiptSubFooter: 'Visit Again',
    termsAndConditions: 'Goods once sold cannot be returned. Services booked cannot be exchanged.',
    bannerUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error('Only Super Admin is authorized to modify system settings');
      return;
    }

    try {
      setIsSaving(true);
      const res = await api.put('/settings', settings);
      if (res.data.success) {
        setSettings(res.data.settings);
        toast.success('Salon settings updated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can upload new banner assets');
      return;
    }

    try {
      setBannerUploading(true);
      const formData = new FormData();
      formData.append('banner', file);

      const res = await api.post('/settings/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSettings((prev) => ({ ...prev, bannerUrl: res.data.bannerUrl }));
        toast.success('Brand banner updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Banner upload failed');
    } finally {
      setBannerUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
          <Settings className="w-6 h-6 text-gold-500" />
          Salon Profile & Application Settings
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Configure business details, official brand banner, billing preferences, and receipt policy notes
        </p>
      </div>

      {/* Official Brand Banner Preview Box */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Official Brand Banner</h3>
          {isSuperAdmin && (
            <label className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 text-xs font-bold cursor-pointer shadow transition-all">
              <Upload className="w-4 h-4" />
              <span>{bannerUploading ? 'Uploading...' : 'Upload Custom Banner'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={bannerUploading}
                className="hidden"
              />
            </label>
          )}
        </div>

        <NagulanBanner customUrl={settings.bannerUrl} />
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Salon Identity Details */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-charcoal-800 pb-3">
            <Building className="w-4 h-4 text-gold-500" />
            Salon Identity & Contact Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Salon Name *</label>
              <input
                type="text"
                value={settings.salonName}
                onChange={(e) => setSettings({ ...settings, salonName: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Franchise Hotline *</label>
              <input
                type="text"
                value={settings.franchiseEnquiry}
                onChange={(e) => setSettings({ ...settings, franchiseEnquiry: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono font-bold disabled:opacity-60"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Studio Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Billing & Currency Settings */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-charcoal-800 pb-3">
            <Receipt className="w-4 h-4 text-gold-500" />
            Billing & Currency Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={settings.currencySymbol}
                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Printable Receipt Footer & Policy */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-charcoal-800 pb-3">
            <FileText className="w-4 h-4 text-gold-500" />
            Printed Invoice Policy & Footer
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Receipt Footer Note</label>
              <input
                type="text"
                value={settings.receiptFooterMessage}
                onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Sub Footer</label>
              <input
                type="text"
                value={settings.receiptSubFooter}
                onChange={(e) => setSettings({ ...settings, receiptSubFooter: e.target.value })}
                disabled={!isSuperAdmin}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Terms & Conditions</label>
              <textarea
                value={settings.termsAndConditions}
                onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                disabled={!isSuperAdmin}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Save Button (Super Admin) */}
        {isSuperAdmin ? (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-sm shadow-lg transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save System Settings'}</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gray-100 dark:bg-charcoal-800 text-gray-500 text-xs text-center">
            Settings are in view-only mode for non-superadmin users.
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
