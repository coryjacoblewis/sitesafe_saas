import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { TalkRecordsProvider } from './hooks/useTalkRecords';
import { CrewMembersProvider } from './hooks/useCrewMembers';
import { SafetyTopicsProvider } from './hooks/useSafetyTopics';
import { LocationsProvider } from './hooks/useLocations';
import { PendingCrewProvider } from './hooks/usePendingCrew';
import { ToastProvider } from './hooks/useToast';
import ToastContainer from './components/ToastContainer';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OwnerTalkDetailsPage from './pages/OwnerTalkDetailsPage';
import SignupPage from './pages/SignupPage';
import LandingPage from './pages/LandingPage';
import ForemanLoginPage from './pages/foreman/ForemanLoginPage';
import ForemanDashboardPage from './pages/foreman/ForemanDashboardPage';
import TalkSelectionPage from './pages/foreman/TalkSelectionPage';
import SignatureCapturePage from './pages/foreman/SignatureCapturePage';
import ReviewSubmitPage from './pages/foreman/ReviewSubmitPage';
import TalkDetailsPage from './pages/foreman/TalkDetailsPage';
import AmendTalkPage from './pages/foreman/AmendTalkPage';
import MyCrewPage from './pages/foreman/MyCrewPage';
import CrewManagementPage from './pages/admin/CrewManagementPage';
import TopicManagementPage from './pages/admin/TopicManagementPage';
import LocationManagementPage from './pages/admin/LocationManagementPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement; allowedRoles: Array<'owner' | 'foreman'> }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            {/* You can replace this with a more sophisticated spinner component */}
            <div className="text-gray-500">Loading...</div>
        </div>
    );
  }

  if (!user) {
    const redirectPath = allowedRoles.includes('owner') ? '/login' : '/foreman/login';
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If logged in but attempting to access a page for the wrong role, redirect to their correct dashboard
    const redirectPath = user.role === 'owner' ? '/dashboard' : '/foreman/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};


const App: React.FC = () => {
  return (
    <AuthProvider>
      <CrewMembersProvider>
        <SafetyTopicsProvider>
          <LocationsProvider>
            <TalkRecordsProvider>
              <PendingCrewProvider>
                <ToastProvider>
                  <HashRouter>
                    <Routes>
                      {/* Auth & Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/signup" element={<SignupPage />} />
                      <Route path="/foreman/login" element={<ForemanLoginPage />} />

                      {/* Owner Routes */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute allowedRoles={['owner']}>
                            <DashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                       <Route 
                        path="/talk-details/:talkId" 
                        element={
                          <ProtectedRoute allowedRoles={['owner']}>
                            <OwnerTalkDetailsPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/admin/crew-management"
                        element={
                          <ProtectedRoute allowedRoles={['owner']}>
                            <CrewManagementPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route 
                        path="/admin/topic-management"
                        element={
                          <ProtectedRoute allowedRoles={['owner']}>
                            <TopicManagementPage />
                          </ProtectedRoute>
                        }
                      />
                       <Route 
                        path="/admin/location-management"
                        element={
                          <ProtectedRoute allowedRoles={['owner']}>
                            <LocationManagementPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Foreman Routes */}
                      <Route 
                        path="/foreman/dashboard" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <ForemanDashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/foreman/select-talk" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <TalkSelectionPage />
                          </ProtectedRoute>
                        } 
                      />
                       <Route 
                        path="/foreman/capture-signatures" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <SignatureCapturePage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/foreman/review-submit" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <ReviewSubmitPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/foreman/talk-details/:talkId" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <TalkDetailsPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/foreman/amend-talk/:talkId" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <AmendTalkPage />
                          </ProtectedRoute>
                        } 
                      />
                       <Route 
                        path="/foreman/my-crew" 
                        element={
                          <ProtectedRoute allowedRoles={['foreman']}>
                            <MyCrewPage />
                          </ProtectedRoute>
                        } 
                      />

                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </HashRouter>
                  <ToastContainer />
                </ToastProvider>
              </PendingCrewProvider>
            </TalkRecordsProvider>
          </LocationsProvider>
        </SafetyTopicsProvider>
      </CrewMembersProvider>
    </AuthProvider>
  );
};

export default App;