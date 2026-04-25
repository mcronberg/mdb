import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/context/AuthContext'
import { VaultProvider } from '@/context/VaultContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppShell from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import NotesPage from '@/pages/NotesPage'
import DiaryPage from '@/pages/DiaryPage'
import LogPage from '@/pages/LogPage'
import AiPage from '@/pages/AiPage'
import SecretNotesPage from '@/pages/SecretNotesPage'

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <VaultProvider>
                <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        <Route path="/" element={<Navigate to="/ai" replace />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <AppShell />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/notes" element={<NotesPage />} />
                            <Route path="/diary" element={<DiaryPage />} />
                            <Route path="/log" element={<LogPage />} />
                            <Route path="/ai" element={<AiPage />} />
                            <Route path="/secret" element={<SecretNotesPage />} />
                        </Route>
                    </Routes>
                </HashRouter>
                </VaultProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}
