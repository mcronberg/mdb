export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  content: string
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible' | null
  entry_date: string
  created_at: string
  updated_at: string
}
