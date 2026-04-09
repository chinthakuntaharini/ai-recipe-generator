'use client';

import { useState, useEffect } from 'react';
import { UserProfile, DietType, SpiceLevel, CookingGoal, Appliance, CookingTime } from '../../types';
import { apiClient } from '../../lib/api-client';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getProfile();
      setProfile(data);
      setEditedProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProfile.displayName?.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const updated = await apiClient.updateProfile(editedProfile);
      setProfile(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
    setError(null);
  };

  const getInitials = (name: string, email: string): string => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar">
            {getInitials(profile.displayName, profile.email)}
          </div>
          <div className="profile-info">
            <h1>{profile.displayName}</h1>
            <p className="email">{profile.email}</p>
          </div>
          {!isEditing && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="profile-content">
          {isEditing ? (
            <div className="profile-form">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={editedProfile.displayName || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, displayName: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Diet Preference</label>
                <select
                  value={editedProfile.dietPreference || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, dietPreference: e.target.value as DietType })}
                >
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>

              <div className="form-group">
                <label>Spice Level</label>
                <select
                  value={editedProfile.spiceLevel || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, spiceLevel: e.target.value as SpiceLevel })}
                >
                  <option value="Mild">Mild</option>
                  <option value="Medium">Medium</option>
                  <option value="Spicy">Spicy</option>
                  <option value="Very Spicy">Very Spicy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cooking Goal</label>
                <select
                  value={editedProfile.cookingGoal || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, cookingGoal: e.target.value as CookingGoal })}
                >
                  <option value="Taste & Indulgence">Taste & Indulgence</option>
                  <option value="Fitness & Health">Fitness & Health</option>
                  <option value="Quick & Easy">Quick & Easy</option>
                  <option value="Balanced">Balanced</option>
                </select>
              </div>

              <div className="form-group">
                <label>Favorite Cuisines</label>
                <input
                  type="text"
                  value={editedProfile.favoriteCuisines?.join(', ') || ''}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile, 
                    favoriteCuisines: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                  })}
                  placeholder="Indian, Chinese, Italian..."
                />
              </div>

              <div className="form-group">
                <label>Available Appliances</label>
                <input
                  type="text"
                  value={editedProfile.availableAppliances?.join(', ') || ''}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile, 
                    availableAppliances: e.target.value.split(',').map(a => a.trim()).filter(a => a) as Appliance[]
                  })}
                  placeholder="Gas stove, Microwave, Air fryer..."
                />
              </div>

              <div className="form-group">
                <label>Dietary Restrictions</label>
                <input
                  type="text"
                  value={editedProfile.dietaryRestrictions?.join(', ') || ''}
                  onChange={(e) => setEditedProfile({ 
                    ...editedProfile, 
                    dietaryRestrictions: e.target.value.split(',').map(r => r.trim()).filter(r => r)
                  })}
                  placeholder="Gluten-free, Nut-free..."
                />
              </div>

              <div className="form-group">
                <label>Usual Cooking Time</label>
                <select
                  value={editedProfile.usualCookingTime || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, usualCookingTime: e.target.value as CookingTime })}
                >
                  <option value="Under 15 min">Under 15 min</option>
                  <option value="15-30 min">15-30 min</option>
                  <option value="30-60 min">30-60 min</option>
                  <option value="Over an hour">Over an hour</option>
                </select>
              </div>

              <div className="form-actions">
                <button 
                  className="save-button" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="cancel-button" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-details">
              <div className="detail-group">
                <label>Diet Preference</label>
                <p>{profile.dietPreference}</p>
              </div>

              <div className="detail-group">
                <label>Spice Level</label>
                <p>{profile.spiceLevel}</p>
              </div>

              <div className="detail-group">
                <label>Cooking Goal</label>
                <p>{profile.cookingGoal}</p>
              </div>

              <div className="detail-group">
                <label>Favorite Cuisines</label>
                <p>{profile.favoriteCuisines?.join(', ') || 'None specified'}</p>
              </div>

              <div className="detail-group">
                <label>Available Appliances</label>
                <p>{profile.availableAppliances?.join(', ') || 'None specified'}</p>
              </div>

              <div className="detail-group">
                <label>Dietary Restrictions</label>
                <p>{profile.dietaryRestrictions?.join(', ') || 'None'}</p>
              </div>

              <div className="detail-group">
                <label>Usual Cooking Time</label>
                <p>{profile.usualCookingTime}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
