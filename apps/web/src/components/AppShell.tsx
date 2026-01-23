import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShellBar,
  Avatar,
  Popover,
  List,
  ListItemStandard,
  Input,
  Icon,
  Text,
  Label,
  Title,
} from '@ui5/webcomponents-react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/user-settings.js';
import '@ui5/webcomponents-icons/dist/sys-help.js';
import '@ui5/webcomponents-icons/dist/log.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/weather-proofing.js'; // moon icon
import '@ui5/webcomponents-icons/dist/lightbulb.js'; // sun icon

interface AppShellProps {
  children: React.ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [profileButtonRef, setProfileButtonRef] = useState<HTMLElement | null>(null);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationButtonRef, setNotificationButtonRef] = useState<HTMLElement | null>(null);

  // Theme state - initialize from localStorage
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply theme on mount
  useEffect(() => {
    const theme = isDarkTheme ? 'sap_horizon_dark' : 'sap_horizon';
    setTheme(theme);
  }, [isDarkTheme]);

  // Theme toggle handler - keeps popup open
  const handleThemeToggle = async (e: any) => {
    e.stopPropagation(); // Prevent event bubbling

    const newTheme = !isDarkTheme;
    const theme = newTheme ? 'sap_horizon_dark' : 'sap_horizon';

    // Update state and localStorage
    setIsDarkTheme(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');

    // Apply theme using UI5 web components API
    await setTheme(theme);

    // Keep popup open - don't call setProfilePopoverOpen(false)
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleProfileClick = (e: CustomEvent) => {
    setProfileButtonRef(e.detail.targetRef);
    // Toggle profile popup (close if open, open if closed)
    setProfilePopoverOpen(!profilePopoverOpen);
    // Close notification popup if it's open
    if (notificationPopoverOpen) {
      setNotificationPopoverOpen(false);
    }
  };

  const handleNotificationClick = (e: CustomEvent) => {
    setNotificationButtonRef(e.detail.targetRef);
    // Toggle notification popup (close if open, open if closed)
    setNotificationPopoverOpen(!notificationPopoverOpen);
    // Close profile popup if it's open
    if (profilePopoverOpen) {
      setProfilePopoverOpen(false);
    }
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
            style={{
              width: '300px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          />
        }
        showNotifications
        notificationsCount="3"
        onNotificationsClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
        profile={
          <Avatar size="XS" initials="JD" colorScheme="Accent6" style={{ cursor: 'pointer' }} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <Text style={{ fontWeight: 600 }}>John Doe</Text>
              <Label>john.doe@company.com</Label>
            </div>
          </div>
        </div>
        <List>
          <ListItemStandard icon="employee">My Profile</ListItemStandard>
          <ListItemStandard icon="user-settings">Settings</ListItemStandard>
          <ListItemStandard
            onClick={handleThemeToggle}
            style={{
              transition: 'all 0.3s ease-in-out',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <Icon
                name={isDarkTheme ? 'light-mode' : 'dark-mode'}
                style={{
                  transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  transform: isDarkTheme ? 'rotate(0deg) scale(1)' : 'rotate(360deg) scale(1)',
                  opacity: 1,
                }}
              />
              <span>{isDarkTheme ? 'Light Theme' : 'Dark Theme'}</span>
              <Icon
                name={isDarkTheme ? 'light-mode' : 'dark-mode'}
                style={{
                  transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  transform: isDarkTheme ? 'rotate(0deg) scale(1)' : 'rotate(360deg) scale(1)',
                  opacity: 1,
                }}
              />
            </div>
          </ListItemStandard>
          <ListItemStandard icon="sys-help">Help</ListItemStandard>
          <ListItemStandard icon="log">Sign Out</ListItemStandard>
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
          <Title level="H5" style={{ marginBottom: '0.75rem' }}>
            Notifications
          </Title>
          <List>
            <ListItemStandard description="2 hours ago" additionalText="New">
              Enrichment completed for Project A
            </ListItemStandard>
            <ListItemStandard description="Yesterday">3 new designs generated</ListItemStandard>
            <ListItemStandard description="2 days ago">
              Welcome to Fashion Trend Alchemist!
            </ListItemStandard>
          </List>
        </div>
      </Popover>

      {/* Main Content */}
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export default AppShell;
