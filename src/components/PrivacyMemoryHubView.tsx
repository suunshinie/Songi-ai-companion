import React, { useState } from 'react';
import { ApprovedMemory, AppScreen, AuthAccountSummary } from '../types/shongi';
import { formatMemoryUsage, MAX_APPROVED_MEMORIES } from '../utils/shongiLogic';

interface PrivacyMemoryHubViewProps {
  memories: ApprovedMemory[];
  authSummary: AuthAccountSummary | null;
  proactiveCheckins: boolean;
  ephemeralMode: boolean;
  onUpdateConsent: (patch: { proactiveCheckins?: boolean; ephemeralMode?: boolean }) => void;
  onOpenAuth: () => void;
  onAddMemory: (text: string) => void;
  onRemoveMemory: (id: string) => void;
  onClearAllMemories: () => void;
  onNavigate: (screen: AppScreen) => void;
}

export const PrivacyMemoryHubView: React.FC<PrivacyMemoryHubViewProps> = ({
  memories,
  authSummary,
  proactiveCheckins,
  ephemeralMode,
  onUpdateConsent,
  onOpenAuth,
  onAddMemory,
  onRemoveMemory,
  onClearAllMemories,
  onNavigate,
}) => {
  const [newMemoryText, setNewMemoryText] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemoryText.trim();
    if (!trimmed || memories.length >= MAX_APPROVED_MEMORIES) return;
    onAddMemory(trimmed);
    setNewMemoryText('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="rounded-2xl bg-surface-container-low p-6 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">shield_with_heart</span>
          </div>
          <div>
            <h1 className="text-[24px] font-semibold text-primary">
              Privacy &amp; Memory Consent Hub
            </h1>
            <p className="text-[14px] text-on-surface-variant mt-1 bangla-text">
              গোপনীয়তা ও মেমোরি নিয়ন্ত্রণ • You decide every single fact SHONGI is allowed to
              remember.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('ai-companion')}
          className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors shrink-0 self-start md:self-auto"
        >
          Back to AI Companion
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Approved Memories Inventory (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold text-primary">
                Ratified Context Memories
              </h2>
              <p className="text-[13px] text-on-surface-variant">
                Only approved items are available to the AI Companion. Journal entries remain
                strictly locked.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-surface-container text-[11px] font-semibold text-on-surface-variant tabular-nums">
              {formatMemoryUsage(memories.length, MAX_APPROVED_MEMORIES)}
            </span>
          </div>

          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              placeholder="Add a personal preference (e.g., Speak in gentle Bangla)..."
              aria-label="Add a personal memory preference"
              className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low text-[14px] text-on-surface outline-none focus:bg-surface-container"
            />
            <button
              type="submit"
              disabled={!newMemoryText.trim() || memories.length >= MAX_APPROVED_MEMORIES}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container disabled:opacity-50"
            >
              Add Preference
            </button>
          </form>

          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="p-6 rounded-xl bg-surface-container-low text-center text-[13px] text-on-surface-variant">
                Zero memories stored. Your companion starts completely fresh in every conversation.
              </div>
            ) : (
              memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-xl bg-surface-container-low flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-base text-tertiary-container mt-0.5">
                      verified_user
                    </span>
                    <div>
                      <p className="text-[14px] font-medium text-on-surface">{mem.text}</p>
                      <span className="text-[11px] text-on-surface-variant">{mem.meta}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveMemory(mem.id)}
                    className="px-2.5 py-1 rounded-lg bg-surface text-secondary text-[11px] font-semibold hover:bg-secondary-fixed/50 shrink-0"
                  >
                    Revoke
                  </button>
                </div>
              ))
            )}
          </div>

          {memories.length > 0 && (
            <div className="pt-2 flex justify-end">
              {confirmClear ? (
                <div className="flex items-center gap-2 bg-error-container/40 px-3 py-1.5 rounded-xl">
                  <span className="text-[12px] text-on-error-container font-medium">
                    Revoke all {memories.length} memories?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllMemories();
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-error text-on-error text-[11px] font-semibold"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 rounded-lg bg-surface text-on-surface text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-[12px] font-semibold text-secondary hover:underline"
                >
                  Erase All Stored Memories
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Account & Consent Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[18px] font-semibold text-primary">Account &amp; Sync</h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                {!authSummary
                  ? 'Local Only'
                  : authSummary.needsEmailVerification
                  ? 'Verify Email'
                  : authSummary.isAnonymous
                  ? 'Anonymous'
                  : authSummary.authMethod === 'google'
                  ? 'Google'
                  : 'Verified Email'}
              </span>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              {!authSummary
                ? 'You are currently in offline-first local mode. Sign in anonymously, with Google, or via verified email to persist across sessions.'
                : authSummary.isAnonymous
                ? 'Active anonymous sanctuary session. You can upgrade to Google or verified Email anytime without losing your memories.'
                : authSummary.needsEmailVerification
                ? `Verification pending for ${authSummary.email}. Verify your email link to enable encrypted Firestore sync.`
                : `Signed in as ${authSummary.displayName}. Your memories and journal sync securely under your private UID.`}
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container transition-colors"
            >
              {authSummary ? 'Manage Sign-In & Verification' : 'Sign In (Anonymous / Google / Email)'}
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-[18px] font-semibold text-primary">Consent &amp; Boundaries</h2>

            <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-low cursor-pointer">
              <div>
                <span className="text-[14px] font-medium text-primary block">
                  On-Device Ephemeral Caching
                </span>
                <span className="text-[12px] text-on-surface-variant">
                  Keep active chat drafts locally in browser storage without cloud analytics.
                </span>
              </div>
              <input
                type="checkbox"
                checked={ephemeralMode}
                onChange={(e) => onUpdateConsent({ ephemeralMode: e.target.checked })}
                className="mt-1 w-4 h-4 accent-primary"
              />
            </label>

            <label className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface-container-low cursor-pointer">
              <div>
                <span className="text-[14px] font-medium text-primary block">
                  Gentle Check-In Reminders
                </span>
                <span className="text-[12px] text-on-surface-variant">
                  Allow SHONGI to offer an optional quiet evening reflection prompt.
                </span>
              </div>
              <input
                type="checkbox"
                checked={proactiveCheckins}
                onChange={(e) => onUpdateConsent({ proactiveCheckins: e.target.checked })}
                className="mt-1 w-4 h-4 accent-primary"
              />
            </label>

            <div className="p-4 rounded-xl bg-surface-container text-[12px] text-on-surface-variant leading-relaxed">
              <strong className="text-primary block mb-1">Zero Model Training Guarantee</strong>
              Your personal reflections, journal entries, and peer messages are never used to train
              public AI models.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
