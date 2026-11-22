import React, { useState } from 'react';
import { AppScreen, AuthAccountSummary, Language } from '../types/shongi';
import { SHONGI_IMAGES } from '../data/seedData';
import { ResilientImage } from './ResilientImage';

interface DashboardShellProps {
  activeScreen: Exclude<AppScreen, 'home'>;
  language: Language;
  authSummary: AuthAccountSummary | null;
  onNavigate: (screen: AppScreen) => void;
  onSetLanguage: (lang: Language) => void;
  onOpenAuth: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: Exclude<AppScreen, 'home'>;
  title: string;
  banglaSubtitle: string;
  icon: string;
  iconClass?: string;
  badge?: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  activeScreen,
  language,
  authSummary,
  onNavigate,
  onSetLanguage,
  onOpenAuth,
  children,
}) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      id: 'ai-companion',
      title: 'AI Companion',
      banglaSubtitle: 'কথোপকথন',
      icon: 'smart_toy',
      badge: <span className="w-2 h-2 rounded-full bg-secondary-container" />,
    },
    {
      id: 'encrypted-journal',
      title: 'Encrypted Journal',
      banglaSubtitle: 'ব্যক্তিগত ডায়েরি',
      icon: 'menu_book',
      badge: (
        <span className="material-symbols-outlined text-sm text-tertiary-container">
          lock
        </span>
      ),
    },
    {
      id: 'peer-pilot',
      title: 'Peer Pilot',
      banglaSubtitle: 'সহমর্মী সার্কেল',
      icon: 'group',
      badge: (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
          Peer
        </span>
      ),
    },
    {
      id: 'crisis-resources',
      title: 'Crisis Resources',
      banglaSubtitle: 'জরুরি সহায়তা',
      icon: 'emergency',
      iconClass: 'text-secondary',
      badge: (
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">
          BD 24/7
        </span>
      ),
    },
    {
      id: 'privacy-memory-hub',
      title: 'Privacy & Memory',
      banglaSubtitle: 'গোপনীয়তা ও মেমোরি',
      icon: 'shield_with_heart',
      badge: (
        <span className="material-symbols-outlined text-sm text-on-surface-variant">
          verified_user
        </span>
      ),
    },
  ];

  const handleNavClick = (screen: AppScreen) => {
    setMobileDrawerOpen(false);
    onNavigate(screen);
  };

  const sidebarContent = (
    <>
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="h-16 flex items-center px-6 gap-3 bg-surface-container-low text-left hover:bg-surface-container transition-colors"
          title="Return to SHONGI Public Homepage"
        >
          <ResilientImage
            src={SHONGI_IMAGES.logo}
            alt="SHONGI Logo"
            fallbackLabel="SHONGI"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <span className="text-[18px] font-semibold text-primary leading-none">
              SHONGI
            </span>
            <span className="text-[11px] text-on-surface-variant font-normal tracking-wide bangla-text">
              সঙ্গী • Safe Haven
            </span>
          </div>
        </button>

        <div className="px-6 py-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
            <span className="text-[11px] font-semibold tracking-[0.04em] text-on-surface-variant">
              Padma Dusk Sanctuary
            </span>
          </div>
        </div>

        <nav className="flex flex-col px-3 mt-4 space-y-1" aria-label="Sanctuary Navigation">
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl transition-all text-left w-full ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-xl ${
                      isActive
                        ? 'text-on-primary'
                        : item.iconClass ?? 'text-primary'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="flex flex-col">
                    <span
                      className={`text-[14px] font-medium ${
                        isActive ? 'text-on-primary' : ''
                      }`}
                    >
                      {item.title}
                    </span>
                    <span
                      className={`text-[11px] bangla-text ${
                        isActive
                          ? 'text-on-primary-container'
                          : 'text-on-surface-variant opacity-80'
                      }`}
                    >
                      {item.banglaSubtitle}
                    </span>
                  </div>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container text-on-surface">
          <p className="text-[13px] text-on-surface-variant italic leading-snug">
            &ldquo;AI is the bridge. Human connection is the solution.&rdquo;
          </p>
          <span className="text-[11px] text-on-surface-variant block mt-1 bangla-text">
            অকৃত্রিম সহমর্মিতা
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleNavClick('crisis-resources')}
          className="flex items-center justify-between p-3 rounded-xl bg-secondary text-on-secondary shadow-[0_2px_8px_rgba(30,58,76,0.08)] hover:bg-on-secondary-fixed-variant transition-colors text-left w-full"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl">call</span>
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-on-secondary">
                Urgent Support
              </span>
              <span className="text-[11px] text-secondary-fixed">
                Kaan Pete Roi • 999
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-low flex-col justify-between z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-primary/40 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-surface-container-low flex flex-col justify-between z-10 shadow-2xl overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
          <div className="h-16 w-full px-4 sm:px-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open navigation menu"
                className="lg:hidden p-2 rounded-lg text-primary hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low text-tertiary truncate">
                <span className="w-2 h-2 rounded-full bg-tertiary-container shrink-0" />
                <span className="text-[11px] font-medium text-on-surface-variant truncate">
                  Cloud Synced • On-Device Encrypted
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant hidden xl:inline bangla-text">
                অফলাইন ও সম্পূর্ণ নিরাপদ
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                <span>Public Home</span>
              </button>

              <div className="flex items-center bg-surface-container rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onSetLanguage('en')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    language === 'en'
                      ? 'bg-surface text-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onSetLanguage('bn')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold bangla-text transition-colors ${
                    language === 'bn'
                      ? 'bg-surface text-primary shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  বাংলা
                </button>
              </div>

              <button
                type="button"
                data-testid="shell-auth-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-2.5 pl-1 sm:pl-3 py-1 px-2.5 rounded-xl hover:bg-surface-container transition-colors text-left"
                title="Account, Anonymous Mode, Google & Email Verification"
              >
                <div className="text-right hidden sm:flex flex-col">
                  <span className="text-[12px] text-on-surface font-medium max-w-[140px] truncate">
                    {authSummary ? authSummary.displayName : 'Local Private Mode'}
                  </span>
                  <span
                    className={`text-[11px] ${
                      authSummary?.needsEmailVerification
                        ? 'text-secondary font-semibold'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {!authSummary
                      ? 'Sign In / Anon'
                      : authSummary.needsEmailVerification
                      ? 'Verify Email Pending'
                      : authSummary.isAnonymous
                      ? 'Anonymous • Private'
                      : authSummary.authMethod === 'google'
                      ? 'Google Verified'
                      : 'Email Verified'}
                  </span>
                </div>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px] font-bold">
                    {authSummary
                      ? authSummary.isAnonymous
                        ? 'AN'
                        : authSummary.displayName.slice(0, 2).toUpperCase()
                      : 'PV'}
                  </div>
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface ${
                      authSummary?.needsEmailVerification
                        ? 'bg-secondary'
                        : authSummary
                        ? 'bg-tertiary-container'
                        : 'bg-outline-variant'
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="w-full pt-16 bg-surface min-h-screen">
          {authSummary?.needsEmailVerification && (
            <div className="bg-secondary-fixed/60 border-b border-secondary/20 px-4 sm:px-8 py-2.5">
              <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[12px] text-on-secondary-fixed">
                <span>
                  Verification email sent to <strong>{authSummary.email}</strong>. Verify your
                  inbox link to unlock private Firebase cloud sync.
                </span>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-3 py-1 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary-container transition-colors shrink-0"
                >
                  Check Verification Status
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
