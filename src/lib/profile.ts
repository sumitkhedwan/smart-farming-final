export interface NotificationPreferences {
  weather: boolean;
  market: boolean;
  disease: boolean;
  harvest: boolean;
  email: boolean;
  sms: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  username: string | null;
  bio: string;
  avatar_url: string | null;
  occupation: 'Farmer' | 'Researcher' | 'Gardener' | 'Other' | null;
  notification_preferences: NotificationPreferences;
  created_at: string;
  updated_at: string;
}

export interface FarmSettings {
  id: string;
  farm_name: string;
  area_acres: number | null;
  location: string;
  soil_type: string;
  farming_type: string;
  irrigation_method: string;
}

export const defaultNotificationPreferences: NotificationPreferences = {
  weather: true,
  market: true,
  disease: true,
  harvest: true,
  email: true,
  sms: false,
};

export const emptyFarmSettings = (id: string): FarmSettings => ({
  id,
  farm_name: '',
  area_acres: null,
  location: '',
  soil_type: '',
  farming_type: '',
  irrigation_method: '',
});
