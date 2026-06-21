export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night'

export type Frequency =
  | 'every day'
  | 'every other day'
  | 'every 3 days'
  | 'weekly'
  | 'biweekly'

export interface Medication {
  id: string
  user_id: string
  name: string
  dose: string
  times: TimeOfDay[]
  color: string
  instructions: string | null
  created_at: string
}

export interface DailyDose {
  id: string
  medication_id: string
  date: string
  time_of_day: TimeOfDay
  taken: boolean
  taken_at: string | null
}

export interface Schedule {
  id: string
  user_id: string
  medication_name: string
  dose: string
  frequency: Frequency
  start_date: string
  stop_date: string | null
  notes: string | null
  created_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  timezone: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      medications: {
        Row: Medication
        Insert: Omit<Medication, 'id' | 'created_at'>
        Update: Partial<Omit<Medication, 'id' | 'created_at'>>
      }
      daily_doses: {
        Row: DailyDose
        Insert: Omit<DailyDose, 'id'>
        Update: Partial<Omit<DailyDose, 'id'>>
      }
      cycle_log: {
        Row: Schedule
        Insert: Omit<Schedule, 'id' | 'created_at'>
        Update: Partial<Omit<Schedule, 'id' | 'created_at'>>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'id' | 'created_at'>
        Update: Partial<Omit<UserSettings, 'id' | 'created_at'>>
      }
    }
  }
}
