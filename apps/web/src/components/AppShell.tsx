/**
 * AppShell Component
 * Main navigation shell providing top bar, theme switching, and layout wrapper
 */

import { useState, useCallback } from 'react';
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
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/user-settings.js';
import '@ui5/webcomponents-icons/dist/sys-help.js';
import '@ui5/webcomponents-icons/dist/log.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/weather-proofing.js';
import '@ui5/webcomponents-icons/dist/lightbulb.js';

import { useTheme } from '../hooks/useTheme';
import {
  BRANDING,
  MOCK_USER,
  SEARCH,
  MENU_ITEMS,
  NOTIFICATIONS,
  POPOVER,
  AVATAR,
} from '../constants/appShell';
import styles from '../styles/components/AppShell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const { isDarkTheme, toggleTheme, themeIcon, themeLabel } = useTheme();

  // Popover state management
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false);
  const [profileButtonRef, setProfileButtonRef] = useState<HTMLElement | null>(null);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationButtonRef, setNotificationButtonRef] = useState<HTMLElement | null>(null);

  // Navigation handlers
  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleProfileClick = useCallback(
    (e: CustomEvent) => {
      setProfileButtonRef(e.detail.targetRef);
      setProfilePopoverOpen((prev) => !prev);
      if (notificationPopoverOpen) setNotificationPopoverOpen(false);
    },
    [notificationPopoverOpen]
  );

  const handleNotificationClick = useCallback(
    (e: CustomEvent) => {
      setNotificationButtonRef(e.detail.targetRef);
      setNotificationPopoverOpen((prev) => !prev);
      if (profilePopoverOpen) setProfilePopoverOpen(false);
    },
    [profilePopoverOpen]
  );

  const closeProfilePopover = useCallback(() => {
    setProfilePopoverOpen(false);
  }, []);

  const closeNotificationPopover = useCallback(() => {
    setNotificationPopoverOpen(false);
  }, []);

  // Theme toggle handler - keeps popup open
  const handleThemeToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleTheme();
    },
    [toggleTheme]
  );

  return (
    <div className={styles.container}>
      <ShellBar
        primaryTitle={BRANDING.PRIMARY_TITLE}
        secondaryTitle={BRANDING.SECONDARY_TITLE}
        logo={
          <img
            src="/logo.svg"
            alt={BRANDING.LOGO_ALT}
            className={styles.logo}
            onClick={handleLogoClick}
          />
        }
        searchField={
          <Input placeholder={SEARCH.PLACEHOLDER} showClearIcon className={styles.searchField} />
        }
        showNotifications
        notificationsCount={NOTIFICATIONS.COUNT}
        onNotificationsClick={handleNotificationClick}
        onProfileClick={handleProfileClick}
        profile={
          <Avatar
            size={AVATAR.SIZE_SMALL}
            initials={MOCK_USER.INITIALS}
            colorScheme={MOCK_USER.AVATAR_COLOR}
            className={styles.avatar}
          />
        }
      />

      {/* Profile Popover */}
      <Popover
        open={profilePopoverOpen}
        opener={profileButtonRef!}
        onClose={closeProfilePopover}
        placement={POPOVER.PLACEMENT}
        horizontalAlign={POPOVER.HORIZONTAL_ALIGN}
      >
        <div className={styles.profileHeader}>
          <div className={styles.profileInfo}>
            <Avatar
              size={AVATAR.SIZE_MEDIUM}
              initials={MOCK_USER.INITIALS}
              colorScheme={MOCK_USER.AVATAR_COLOR}
            />
            <div className={styles.profileDetails}>
              <Text className={styles.profileName}>{MOCK_USER.NAME}</Text>
              <Label>{MOCK_USER.EMAIL}</Label>
            </div>
          </div>
        </div>
        <List>
          <ListItemStandard icon={MENU_ITEMS.PROFILE.icon}>
            {MENU_ITEMS.PROFILE.text}
          </ListItemStandard>
          <ListItemStandard icon={MENU_ITEMS.SETTINGS.icon}>
            {MENU_ITEMS.SETTINGS.text}
          </ListItemStandard>
          <ListItemStandard onClick={handleThemeToggle} className={styles.themeToggle}>
            <div className={styles.themeToggleContent}>
              <Icon
                name={themeIcon}
                className={styles.themeIcon}
                style={{
                  transform: isDarkTheme ? 'rotate(360deg) scale(1)' : 'rotate(0deg) scale(1)',
                }}
              />
              <span>{themeLabel}</span>
              <Icon
                name={themeIcon}
                className={styles.themeIcon}
                style={{
                  transform: isDarkTheme ? 'rotate(360deg) scale(1)' : 'rotate(0deg) scale(1)',
                }}
              />
            </div>
          </ListItemStandard>
          <ListItemStandard icon={MENU_ITEMS.HELP.icon}>{MENU_ITEMS.HELP.text}</ListItemStandard>
          <ListItemStandard icon={MENU_ITEMS.SIGN_OUT.icon}>
            {MENU_ITEMS.SIGN_OUT.text}
          </ListItemStandard>
        </List>
      </Popover>

      {/* Notifications Popover */}
      <Popover
        open={notificationPopoverOpen}
        opener={notificationButtonRef!}
        onClose={closeNotificationPopover}
        placement={POPOVER.PLACEMENT}
        horizontalAlign={POPOVER.HORIZONTAL_ALIGN}
      >
        <div className={styles.notificationsContainer}>
          <Title level="H5" className={styles.notificationsTitle}>
            {NOTIFICATIONS.TITLE}
          </Title>
          <List>
            {NOTIFICATIONS.MOCK_ITEMS.map((notification) => (
              <ListItemStandard
                key={notification.id}
                description={notification.description}
                additionalText={notification.additionalText}
              >
                {notification.text}
              </ListItemStandard>
            ))}
          </List>
        </div>
      </Popover>

      {/* Main Content */}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default AppShell;
