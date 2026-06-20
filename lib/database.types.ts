export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night'

export type Frequency = 'daily' | 'every other day' | 'weekly' | 'twice weekly' | 'custom'

export interface Medication {
  id: string
  name: string
  dose: string
  times: TimeOfDay[]
  color: string
  user_email: string
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

export interface CycleLog {
  id: string
  peptide_name: string
  dose: string
  frequency: Frequency
  duration: string
  start_date: string
  notes: string | null
  created_at: string
}

export interface UserSettings {
  id: string
  email: string
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
        Row: CycleLog
        Insert: Omit<CycleLog, 'id' | 'created_at'>
        Update: Partial<Omit<CycleLog, 'id' | 'created_at'>>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'id' | 'created_at'>
        Update: Partial<Omit<UserSettings, 'id' | 'created_at'>>
      }
    }
  }
}
