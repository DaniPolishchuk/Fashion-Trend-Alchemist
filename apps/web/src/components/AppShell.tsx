import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShellBar,
  Avatar,
  Popover,
  List,
  ListItemStandard,
  Input,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/user-settings.js';
import '@ui5/webcomponents-icons/dist/sys-help.js';
import '@ui5/webcomponents-icons/dist/log.js';
import '@ui5/webcomponents-icons/dist/employee.js';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [profileButtonRef, setProfileButtonRef] = useState<HTMLElement | null>(null);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationButtonRef, setNotificationButtonRef] = useState<HTMLElement | null>(null);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleProfileClick = (e: CustomEvent) => {
    setProfileButtonRef(e.detail.targetRef);
    setProfilePopoverOpen(true);
  };

  const handleNotificationClick = (e: CustomEvent) => {
    setNotificationButtonRef(e.detail.targetRef);
    setNotificationPopoverOpen(true);
  };

  const handleProfileMenuClick = (action: string) => {
    console.log('Profile action clicked:', action);
    setProfilePopoverOpen(false);
    // All actions are dummy - just log and close
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ShellBar
        primaryTitle="Fashion Trend Alchemist"
        secondaryTitle="AI Design Studio"
        logo={
          <img
            src="/logo.svg"
            alt="Logo"
            style={{
              height: '32px',
              width: 'auto',
              cursor: 'pointer',
            }}
            onClick={handleLogoClick}
          />
        }
        searchField={
          <Input
            placeholder="Search..."
            showClearIcon
            icon={<Icon name="search" />}
            style={{ width: '300px' }}
          />
        }
        showNotifications
        notificationsCount="3"
        onNotificationsClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
        profile={
          <Avatar
            size="XS"
            initials="JD"
            colorScheme="Accent6"
            style={{ cursor: 'pointer' }}
          />
        }
      />

      {/* Profile Popover */}
      <Popover
        open={profilePopoverOpen}
        opener={profileButtonRef!}
        onClose={() => setProfilePopoverOpen(false)}
        placement="Bottom"
        horizontalAlign="End"
      >
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--sapList_BorderColor)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar size="M" initials="JD" colorScheme="Accent6" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>John Doe</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--sapContent_LabelColor)' }}>
                john.doe@company.com
              </div>
            </div>
          </div>
        </div>
        <List>
          <ListItemStandard
            icon="employee"
            onClick={() => handleProfileMenuClick('profile')}
          >
            My Profile
          </ListItemStandard>
          <ListItemStandard
            icon="user-settings"
            onClick={() => handleProfileMenuClick('settings')}
          >
            Settings
          </ListItemStandard>
          <ListItemStandard
            icon="sys-help"
            onClick={() => handleProfileMenuClick('help')}
          >
            Help
          </ListItemStandard>
          <ListItemStandard
            icon="log"
            onClick={() => handleProfileMenuClick('logout')}
          >
            Sign Out
          </ListItemStandard>
        </List>
      </Popover>

      {/* Notifications Popover */}
      <Popover
        open={notificationPopoverOpen}
        opener={notificationButtonRef!}
        onClose={() => setNotificationPopoverOpen(false)}
        placement="Bottom"
        horizontalAlign="End"
      >
        <div style={{ padding: '1rem', minWidth: '300px' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Notifications</div>
          <List>
            <ListItemStandard
              description="2 hours ago"
              additionalText="New"
            >
              Enrichment completed for Project A
            </ListItemStandard>
            <ListItemStandard
              description="Yesterday"
            >
              3 new designs generated
            </ListItemStandard>
            <ListItemStandard
              description="2 days ago"
            >
              Welcome to Fashion Trend Alchemist!
            </ListItemStandard>
          </List>
        </div>
      </Popover>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export default AppShell;
