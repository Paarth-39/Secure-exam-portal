import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { studentAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ProfilePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    document.title = 'Profile — SecureExam';
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await studentAPI.getProfile();
        const profile = response.data.user;
        setUser(profile);
        setValue('fullName', profile.fullName);
      } catch (error) {
        showToast({ message: 'Failed to load user profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setValue, showToast]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const response = await studentAPI.updateProfile({ fullName: data.fullName });
      setUser(response.data.user);
      showToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile';
      showToast({ message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-surface border border-border rounded-xl shadow-sm p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">My Profile</h1>
        <p className="text-text-secondary text-sm">View your account details and update your full name.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          name="fullName"
          placeholder="Your full name"
          register={register('fullName', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' }
          })}
          error={errors.fullName}
        />

        <div className="flex flex-col mb-4">
          <label className="text-sm font-semibold text-text mb-1 block">Email Address</label>
          <input
            type="text"
            disabled
            value={user?.email || ''}
            className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-border rounded-md text-text-secondary cursor-not-allowed outline-none select-all"
          />
        </div>

        <div className="flex flex-col mb-4">
          <label className="text-sm font-semibold text-text mb-1 block">Account Role</label>
          <input
            type="text"
            disabled
            value={user?.role || ''}
            className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-border rounded-md text-text-secondary cursor-not-allowed outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end border-t border-border">
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
