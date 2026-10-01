import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardTab } from './components/tabs/DashboardTab';
import { RoomsTab } from './components/tabs/RoomsTab';
import { StudentsTab } from './components/tabs/StudentsTab';
import { TeacherAssignmentsTab } from './components/tabs/TeacherAssignmentsTab';
import { ShiftsTab } from './components/tabs/ShiftsTab';
import { DutyLogsTab } from './components/tabs/DutyLogsTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { AccountsTab } from './components/tabs/AccountsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { TeacherDeskTab } from './components/tabs/TeacherDeskTab';
import { StudentCaptainTab } from './components/tabs/StudentCaptainTab';
import { ImportDataTab } from './components/tabs/ImportDataTab';
import { RoomDetailModal } from './components/modals/RoomDetailModal';
import { QuickLogModal } from './components/modals/QuickLogModal';
import { QuickReportModal } from './components/modals/QuickReportModal';
import { HandoverModal } from './components/modals/HandoverModal';

function AppContent() {
  const { currentUser } = useApp();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modal triggers
  const [detailRoomId, setDetailRoomId] = useState<string | null>(null);
  const [logModalState, setLogModalState] = useState<{ isOpen: boolean; roomId?: string }>({
    isOpen: false,
  });
  const [reportModalState, setReportModalState] = useState<{ isOpen: boolean; roomId?: string }>({
    isOpen: false,
  });
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState<boolean>(false);

  // Set default view on user login or role change
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'bgh') {
      setCurrentTab('dashboard');
    } else if (currentUser.role === 'quan_sinh') {
      setCurrentTab('rooms');
    } else if (currentUser.role === 'giao_vien') {
      setCurrentTab('teacher_desk');
    } else if (currentUser.role === 'truong_phong') {
      setCurrentTab('student_captain');
    }
  }, [currentUser?.id, currentUser?.role]);

  // If not logged in, show dedicated Login screen
  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <AppLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {/* Tab routing based on current tab state */}
      {currentTab === 'dashboard' && (
        <DashboardTab
          onNavigateTab={setCurrentTab}
          onOpenRoomDetail={(roomId) => setDetailRoomId(roomId)}
          onOpenQuickLogModal={(roomId) => setLogModalState({ isOpen: true, roomId })}
          onOpenQuickReportModal={(roomId) => setReportModalState({ isOpen: true, roomId })}
          onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
        />
      )}

      {currentTab === 'rooms' && (
        <RoomsTab
          onOpenRoomDetail={(roomId) => setDetailRoomId(roomId)}
          onOpenQuickLogModal={(roomId) => setLogModalState({ isOpen: true, roomId })}
          onOpenQuickReportModal={(roomId) => setReportModalState({ isOpen: true, roomId })}
        />
      )}

      {currentTab === 'students' && <StudentsTab />}

      {currentTab === 'teachers_assignment' && <TeacherAssignmentsTab />}

      {currentTab === 'shifts' && <ShiftsTab />}

      {currentTab === 'logs' && (
        <DutyLogsTab
          onOpenQuickLogModal={(roomId) => setLogModalState({ isOpen: true, roomId })}
          onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
        />
      )}

      {currentTab === 'reports' && (
        <ReportsTab
          onOpenQuickReportModal={(roomId) => setReportModalState({ isOpen: true, roomId })}
        />
      )}

      {currentTab === 'import_data' && <ImportDataTab />}

      {currentTab === 'accounts' && <AccountsTab />}

      {currentTab === 'settings' && <SettingsTab />}

      {currentTab === 'teacher_desk' && (
        <TeacherDeskTab
          onNavigateTab={setCurrentTab}
          onOpenRoomDetail={(roomId) => setDetailRoomId(roomId)}
          onOpenQuickLogModal={(roomId) => setLogModalState({ isOpen: true, roomId })}
          onOpenQuickReportModal={(roomId) => setReportModalState({ isOpen: true, roomId })}
          onOpenHandoverModal={() => setIsHandoverModalOpen(true)}
        />
      )}

      {currentTab === 'student_captain' && <StudentCaptainTab />}

      {/* Modals */}
      {detailRoomId && (
        <RoomDetailModal
          roomId={detailRoomId}
          onClose={() => setDetailRoomId(null)}
          onOpenQuickLogModal={(rId) => {
            setDetailRoomId(null);
            setLogModalState({ isOpen: true, roomId: rId });
          }}
          onOpenQuickReportModal={(rId) => {
            setDetailRoomId(null);
            setReportModalState({ isOpen: true, roomId: rId });
          }}
        />
      )}

      {logModalState.isOpen && (
        <QuickLogModal
          initialRoomId={logModalState.roomId}
          onClose={() => setLogModalState({ isOpen: false })}
        />
      )}

      {reportModalState.isOpen && (
        <QuickReportModal
          initialRoomId={reportModalState.roomId}
          onClose={() => setReportModalState({ isOpen: false })}
        />
      )}

      {isHandoverModalOpen && (
        <HandoverModal onClose={() => setIsHandoverModalOpen(false)} />
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
