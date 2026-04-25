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

export type LogDataType = 'int' | 'decimal' | 'bool' | 'duration' | 'text'

export interface LogDefinition {
    id: string
    user_id: string
    label: string
    data_type: LogDataType
    unit: string | null
    sort_order: number
    created_at: string
}

export interface LogEntry {
    id: string
    user_id: string
    definition_id: string
    logged_at: string
    value_int: number | null
    value_decimal: number | null
    value_bool: boolean | null
    value_text: string | null
    note: string | null
    created_at: string
}
