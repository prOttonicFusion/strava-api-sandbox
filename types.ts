export interface IStravaAccessToken {
    access_token: string;
    expires_at: number;
    token_type: string;
    scope: string;
    refresh_token: string;
    athlete?: {
      id: string;
    };
  }
  
  export interface IStravaRawWorkouts {
      resource_state: number
      athlete: {
          id: number;
          resource_state: number;
      };
      name: string;
      distance: number;
      moving_time: number;
      elapsed_time: number;
      total_elevation_gain: number;
      type: string;
      workout_type: number;
      id: number;
      external_id: string;
      upload_id: number;
      start_date: Date;
      start_date_local: Date;
      timezone: string;
      utc_offset: number;
      start_latlng: Array<number>;
      end_latlng: Array<number>;
      achievement_count: number;
      kudos_count: number;
      comment_count: number;
      athlete_count: number;
      photo_count: number;
      trainer: boolean;
      commute: boolean;
      manual: boolean;
      private: boolean;
      flagged: boolean;
      gear_id: string;
      average_speed: number;
      max_speed: number;
      average_watts: number;
      weighted_average_watts: number;
      device_watts: boolean;
      has_heartrate?: boolean;
      average_heartrate?: number;
      max_heartrate?: number;
      max_watts: number;
      pr_count?: number;
      total_photo_count: number;
      has_kudoed: boolean;
  }