import { useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ApprovedMemory,
  AppScreen,
  ChatMessage,
  CompanionMode,
  JournalEntry,
  Language,
  MemoryProposal,
} from './types/shongi';
import {
  INITIAL_APPROVED_MEMORIES,
  INITIAL_CHAT_MESSAGES,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_MEMORY_PROPOSAL,
} from './data/seedData';
import {
  approveMemoryProposal,
  computeWordRevealDelay,
  deriveAuthSummary,
  detectCompanionLanguage,
  MAX_APPROVED_MEMORIES,
  sanitizeChatHistory,
  splitParagraphsFromText,
} from './utils/shongiLogic';
import {
  clearAllMemoryDocs,
  deleteJournalDoc,
  deleteMemoryDoc,
  ensureUserProfile,
  saveJournalDoc,
  saveMemoryDoc,
  signInAnonymouslyPrivate,
  subscribeAuthUser,
  subscribeUserJournal,
  subscribeUserMemories,
  updateUserConsentPreferences,
} from './firebase';
import { PublicHomepage } from './components/PublicHomepage';
import { DashboardShell } from './components/DashboardShell';
import { AiCompanionView } from './components/AiCompanionView';
import { EncryptedJournalView } from './components/EncryptedJournalView';
import { PeerPilotView } from './components/PeerPilotView';
import { CrisisResourcesView } from './components/CrisisResourcesView';
import { PrivacyMemoryHubView } from './components/PrivacyMemoryHubView';
import { AuthModal } from './components/AuthModal';

const STORAGE_KEYS = {
  memories: 'shongi_approved_memories_v1',
  journal: 'shongi_journal_entries_v1',
  proposal: 'shongi_memory_proposal_v1',
};

const VALID_SCREENS: AppScreen[] = [
  'home',
  'ai-companion',
  'encrypted-journal',
  'peer-pilot',
  'crisis-resources',
  'privacy-memory-hub',
];

function getInitialScreen(): AppScreen {
  const params = new URLSearchParams(window.location.search);
  const screenParam = params.get('screen') as AppScreen | null;
  if (screenParam && VALID_SCREENS.includes(screenParam)) {
    return screenParam;
  }
  if (params.get('autostart') === '1') {
    return 'ai-companion';
  }
  return 'home';
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getModeLabel(mode: CompanionMode): string {
  if (mode === 'reflection') return 'Reflection Mode';
  if (mode === 'action') return 'Action Mode';
  return 'Listening Mode';
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(getInitialScreen);
  const [language, setLanguage] = useState<Language>('en');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [memories, setMemories] = useState<ApprovedMemory[]>(() =>
    loadFromStorage(STORAGE_KEYS.memories, INITIAL_APPROVED_MEMORIES)
  );
  const [proposal, setProposal] = useState<MemoryProposal>(() =>
    loadFromStorage(STORAGE_KEYS.proposal, INITIAL_MEMORY_PROPOSAL)
  );
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadFromStorage(STORAGE_KEYS.journal, INITIAL_JOURNAL_ENTRIES)
  );
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [lastCompletedReply, setLastCompletedReply] = useState<{
    id: string;
    text: string;
    language: 'bangla' | 'banglish' | 'english';
  } | null>(null);

  // Firebase Auth & Cloud Sync State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [proactiveCheckins, setProactiveCheckins] = useState(false);
  const [ephemeralMode, setEphemeralMode] = useState(true);
  const profileReadyUidRef = useRef<string | null>(null);

  const authSummary = useMemo(() => {
    if (!firebaseUser) return null;
    return deriveAuthSummary({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      isAnonymous: firebaseUser.isAnonymous,
      emailVerified: firebaseUser.emailVerified,
      providerData: firebaseUser.providerData,
    });
  }, [firebaseUser]);

  const streamAbortRef = useRef<AbortController | null>(null);
  const wordTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const unsub = subscribeAuthUser((user) => {
      setFirebaseUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !firebaseUser || !authSummary?.canSyncCloud) {
      profileReadyUidRef.current = null;
      return;
    }

    let cancelled = false;
    let unsubMemories: (() => void) | undefined;
    let unsubJournal: (() => void) | undefined;

    void ensureUserProfile(firebaseUser, language)
      .then((prefs) => {
        if (cancelled) return;
        profileReadyUidRef.current = firebaseUser.uid;
        setProactiveCheckins(prefs.proactiveCheckins);
        setEphemeralMode(prefs.ephemeralMode);

        unsubMemories = subscribeUserMemories(firebaseUser.uid, (cloudMemories) => {
          if (cloudMemories.length > 0) {
            setMemories(cloudMemories);
          }
        });
        unsubJournal = subscribeUserJournal(firebaseUser.uid, (cloudEntries) => {
          if (cloudEntries.length > 0) {
            setJournalEntries(cloudEntries);
          }
        });
      })
      .catch((err) => {
        console.error('Failed to initialize sanctuary profile:', err);
      });

    return () => {
      cancelled = true;
      unsubMemories?.();
      unsubJournal?.();
    };
  }, [authReady, firebaseUser, authSummary?.canSyncCloud]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.memories, JSON.stringify(memories));
    } catch {
      // Ignore storage quota errors
    }
  }, [memories]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.proposal, JSON.stringify(proposal));
    } catch {
      // Ignore storage quota errors
    }
  }, [proposal]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.journal, JSON.stringify(journalEntries));
    } catch {
      // Ignore storage quota errors
    }
  }, [journalEntries]);

  useEffect(() => {
    const onPopState = () => {
      setScreen(getInitialScreen());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
      if (wordTimerRef.current !== null) {
        window.clearTimeout(wordTimerRef.current);
      }
    };
  }, []);

  const cancelActiveStream = () => {
    streamAbortRef.current?.abort();
    streamAbortRef.current = null;
    if (wordTimerRef.current !== null) {
      window.clearTimeout(wordTimerRef.current);
      wordTimerRef.current = null;
    }
    setIsStreamingReply(false);
    setMessages((prev) =>
      prev.map((m) =>
        m.isStreaming
          ? {
              ...m,
              isStreaming: false,
              statusLabel: m.paragraphs.length > 0 ? 'Stopped' : m.statusLabel,
            }
          : m
      )
    );
  };

  const navigate = (nextScreen: AppScreen) => {
    setScreen(nextScreen);
    const url = new URL(window.location.href);
    if (nextScreen === 'home') {
      url.searchParams.delete('screen');
      url.searchParams.delete('autostart');
    } else {
      url.searchParams.set('screen', nextScreen);
    }
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleContinueAnonymously = async () => {
    if (firebaseUser) {
      navigate('ai-companion');
      return;
    }
    try {
      await signInAnonymouslyPrivate();
      navigate('ai-companion');
    } catch {
      setAuthModalOpen(true);
    }
  };

  const streamCompanionResponse = async (
    text: string,
    mode: CompanionMode,
    historyPayload: Array<{ role: 'user' | 'model'; text: string }>,
    compId: string,
    detectedLanguage: 'bangla' | 'banglish' | 'english',
    isVoiceTurn = false
  ) => {
    streamAbortRef.current?.abort();
    if (wordTimerRef.current !== null) {
      window.clearTimeout(wordTimerRef.current);
      wordTimerRef.current = null;
    }

    const controller = new AbortController();
    streamAbortRef.current = controller;
    setIsStreamingReply(true);

    const wordQueue: string[] = [];
    let accumulated = '';
    let streamFinished = false;
    let streamErrored = false;
    let activeLang = detectedLanguage;

    const flushWordLoop = () => {
      if (controller.signal.aborted || streamErrored) return;

      if (wordQueue.length > 0) {
        const nextWord = wordQueue.shift()!;
        accumulated += nextWord;
        const paragraphs = splitParagraphsFromText(accumulated);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === compId
              ? {
                  ...m,
                  paragraphs,
                  detectedLanguage: activeLang,
                  isStreaming: true,
                }
              : m
          )
        );

        const delay = computeWordRevealDelay(nextWord);
        wordTimerRef.current = window.setTimeout(flushWordLoop, delay);
        return;
      }

      if (streamFinished) {
        const finalText = accumulated.trim();
        if (!finalText) {
          setIsStreamingReply(false);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === compId
                ? {
                    ...m,
                    isStreaming: false,
                    error: 'SHONGI could not generate a reply right now. Please tap Try Again.',
                    statusLabel: 'Needs attention',
                  }
                : m
            )
          );
          return;
        }

        const finalParagraphs = splitParagraphsFromText(finalText);
        const nowDone = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === compId
              ? {
                  ...m,
                  paragraphs: finalParagraphs,
                  detectedLanguage: activeLang,
                  isStreaming: false,
                  timestamp: nowDone,
                  statusLabel: 'Companion Safe',
                }
              : m
          )
        );
        setIsStreamingReply(false);
        setLastCompletedReply({
          id: compId,
          text: finalText,
          language: activeLang,
        });
        return;
      }

      wordTimerRef.current = window.setTimeout(flushWordLoop, 18);
    };

    wordTimerRef.current = window.setTimeout(flushWordLoop, 20);

    try {
      const response = await fetch('/api/companion/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          mode,
          memories,
          isVoiceTurn,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMsg = `Request failed (${response.status})`;
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          // Use status fallback
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('Streaming response body unavailable.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processEventBlock = (rawEvent: string) => {
        const lines = rawEvent
          .split(/\r?\n/)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim());

        for (const jsonLine of lines) {
          if (!jsonLine) continue;
          const parsed = JSON.parse(jsonLine) as {
            type?: string;
            text?: string;
            language?: 'bangla' | 'banglish' | 'english';
            message?: string;
          };

          if (parsed.type === 'meta' && parsed.language) {
            activeLang = parsed.language;
          } else if (parsed.type === 'chunk' && parsed.text) {
            const tokens = parsed.text.match(/\S+\s*|\s+/g) ?? [parsed.text];
            wordQueue.push(...tokens);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message || 'Unable to generate reply right now.');
          } else if (parsed.type === 'done') {
            if (parsed.language) activeLang = parsed.language;
            streamFinished = true;
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          buffer += decoder.decode();
          if (buffer.trim()) {
            processEventBlock(buffer);
            buffer = '';
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          processEventBlock(rawEvent);
        }
      }

      streamFinished = true;
    } catch (err) {
      if (controller.signal.aborted) return;
      streamErrored = true;
      if (wordTimerRef.current !== null) {
        window.clearTimeout(wordTimerRef.current);
        wordTimerRef.current = null;
      }
      const messageText =
        err instanceof Error ? err.message : 'Unable to connect to SHONGI companion service.';
      setIsStreamingReply(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === compId
            ? {
                ...m,
                isStreaming: false,
                error: messageText,
                statusLabel: 'Needs attention',
              }
            : m
        )
      );
    }
  };

  const handleSendMessage = (
    text: string,
    mode: CompanionMode,
    options?: { isVoiceTurn?: boolean }
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (streamAbortRef.current) {
      cancelActiveStream();
    }

    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const detectedLanguage = detectCompanionLanguage(trimmed);

    const historyPayload = sanitizeChatHistory(
      messages
        .filter((m) => !m.error && m.paragraphs.length > 0)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          text: m.paragraphs.join('\n\n'),
        }))
    );

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      paragraphs: [trimmed],
      timestamp: nowStr,
      statusLabel: options?.isVoiceTurn ? 'Spoken' : 'Delivered',
      detectedLanguage,
    };

    const compId = `comp-${Date.now() + 1}`;
    const companionMsg: ChatMessage = {
      id: compId,
      role: 'companion',
      paragraphs: [],
      timestamp: nowStr,
      modeLabel: getModeLabel(mode),
      detectedLanguage,
      isStreaming: true,
      statusLabel: 'Typing...',
    };

    setMessages((prev) => [...prev, userMsg, companionMsg]);
    void streamCompanionResponse(
      trimmed,
      mode,
      historyPayload,
      compId,
      detectedLanguage,
      Boolean(options?.isVoiceTurn)
    );
  };

  const handleRetryMessage = (failedCompId: string, mode: CompanionMode) => {
    const failedIdx = messages.findIndex((m) => m.id === failedCompId);
    if (failedIdx <= 0) return;

    let precedingUserText = '';
    for (let i = failedIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        precedingUserText = messages[i].paragraphs.join(' ').trim();
        break;
      }
    }
    if (!precedingUserText) return;

    const detectedLanguage = detectCompanionLanguage(precedingUserText);
    const historyPayload = sanitizeChatHistory(
      messages
        .slice(0, Math.max(0, failedIdx - 1))
        .filter((m) => !m.error && m.paragraphs.length > 0)
        .map((m) => ({
          role: m.role === 'user' ? ('user' as const) : ('model' as const),
          text: m.paragraphs.join('\n\n'),
        }))
    );

    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedCompId
          ? {
              ...m,
              paragraphs: [],
              error: undefined,
              isStreaming: true,
              modeLabel: getModeLabel(mode),
              detectedLanguage,
              statusLabel: 'Typing...',
            }
          : m
      )
    );

    void streamCompanionResponse(
      precedingUserText,
      mode,
      historyPayload,
      failedCompId,
      detectedLanguage
    );
  };

  const handleEnterWorkspaceFromHome = (targetScreen: AppScreen, initialThought?: string) => {
    if (initialThought && targetScreen === 'ai-companion') {
      handleSendMessage(initialThought, 'listening');
    }
    navigate(targetScreen);
  };

  const syncMemoryCreateIfReady = (mem: ApprovedMemory) => {
    if (firebaseUser && authSummary?.canSyncCloud && profileReadyUidRef.current === firebaseUser.uid) {
      void saveMemoryDoc(firebaseUser.uid, mem).catch((err) => {
        console.error('Memory sync error:', err);
      });
    }
  };

  const handleApproveProposal = (customText?: string) => {
    const res = approveMemoryProposal(memories, proposal, customText);
    setMemories(res.memories);
    setProposal(res.proposal);
    const latest = res.memories[res.memories.length - 1];
    if (latest) syncMemoryCreateIfReady(latest);
  };

  const handleEditProposalText = (newText: string) => {
    setProposal((prev) => ({ ...prev, text: newText }));
  };

  const handleDismissProposal = () => {
    setProposal((prev) => ({ ...prev, status: 'dismissed' }));
  };

  const handleAddMemory = (text: string) => {
    if (memories.length >= MAX_APPROVED_MEMORIES) return;
    const newMem: ApprovedMemory = {
      id: `mem-${Date.now()}`,
      text,
      meta: 'Added in Privacy Hub • Persistent',
      isNew: true,
    };
    setMemories((prev) => [...prev, newMem]);
    syncMemoryCreateIfReady(newMem);
  };

  const handleRemoveMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    if (firebaseUser && authSummary?.canSyncCloud && profileReadyUidRef.current === firebaseUser.uid) {
      void deleteMemoryDoc(firebaseUser.uid, id).catch((err) => {
        console.error('Memory delete sync error:', err);
      });
    }
  };

  const handleClearAllMemories = () => {
    const ids = memories.map((m) => m.id);
    setMemories([]);
    if (firebaseUser && authSummary?.canSyncCloud && profileReadyUidRef.current === firebaseUser.uid) {
      void clearAllMemoryDocs(firebaseUser.uid, ids).catch((err) => {
        console.error('Memory clear sync error:', err);
      });
    }
  };

  const handleSaveJournalEntry = (entry: JournalEntry) => {
    setJournalEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      if (exists) {
        return prev.map((e) => (e.id === entry.id ? entry : e));
      }
      return [entry, ...prev];
    });
    if (firebaseUser && authSummary?.canSyncCloud && profileReadyUidRef.current === firebaseUser.uid) {
      void saveJournalDoc(firebaseUser.uid, entry).catch((err) => {
        console.error('Journal save sync error:', err);
      });
    }
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((e) => e.id !== id));
    if (firebaseUser && authSummary?.canSyncCloud && profileReadyUidRef.current === firebaseUser.uid) {
      void deleteJournalDoc(firebaseUser.uid, id).catch((err) => {
        console.error('Journal delete sync error:', err);
      });
    }
  };

  const handleUpdateConsent = (patch: { proactiveCheckins?: boolean; ephemeralMode?: boolean }) => {
    if (patch.proactiveCheckins !== undefined) {
      setProactiveCheckins(patch.proactiveCheckins);
    }
    if (patch.ephemeralMode !== undefined) {
      setEphemeralMode(patch.ephemeralMode);
    }
    if (firebaseUser && authSummary?.canSyncCloud && profileReadyUidRef.current === firebaseUser.uid) {
      void updateUserConsentPreferences(firebaseUser.uid, patch).catch((err) => {
        console.error('Consent preference sync error:', err);
      });
    }
  };

  return (
    <>
      {screen === 'home' ? (
        <PublicHomepage
          language={language}
          authSummary={authSummary}
          onToggleLanguage={() => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'))}
          onEnterWorkspace={handleEnterWorkspaceFromHome}
          onOpenAuth={() => setAuthModalOpen(true)}
          onContinueAnonymously={() => void handleContinueAnonymously()}
        />
      ) : (
        <DashboardShell
          activeScreen={screen}
          language={language}
          authSummary={authSummary}
          onNavigate={navigate}
          onSetLanguage={setLanguage}
          onOpenAuth={() => setAuthModalOpen(true)}
        >
          {screen === 'ai-companion' && (
            <AiCompanionView
              language={language}
              messages={messages}
              memories={memories}
              proposal={proposal}
              isStreamingReply={isStreamingReply}
              lastCompletedReply={lastCompletedReply}
              onSendMessage={handleSendMessage}
              onRetryMessage={handleRetryMessage}
              onStopStreaming={cancelActiveStream}
              onPurgeMessages={() => {
                cancelActiveStream();
                setMessages([]);
              }}
              onApproveProposal={handleApproveProposal}
              onEditProposalText={handleEditProposalText}
              onDismissProposal={handleDismissProposal}
              onRemoveMemory={handleRemoveMemory}
              onNavigate={navigate}
            />
          )}

          {screen === 'encrypted-journal' && (
            <EncryptedJournalView
              entries={journalEntries}
              onSaveEntry={handleSaveJournalEntry}
              onDeleteEntry={handleDeleteJournalEntry}
            />
          )}

          {screen === 'peer-pilot' && <PeerPilotView onNavigate={navigate} />}

          {screen === 'crisis-resources' && <CrisisResourcesView onNavigate={navigate} />}

          {screen === 'privacy-memory-hub' && (
            <PrivacyMemoryHubView
              memories={memories}
              authSummary={authSummary}
              proactiveCheckins={proactiveCheckins}
              ephemeralMode={ephemeralMode}
              onUpdateConsent={handleUpdateConsent}
              onOpenAuth={() => setAuthModalOpen(true)}
              onAddMemory={handleAddMemory}
              onRemoveMemory={handleRemoveMemory}
              onClearAllMemories={handleClearAllMemories}
              onNavigate={navigate}
            />
          )}
        </DashboardShell>
      )}

      <AuthModal
        isOpen={authModalOpen}
        authSummary={authSummary}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
