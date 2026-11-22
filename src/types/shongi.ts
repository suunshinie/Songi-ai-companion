export type AppScreen =
  | 'home'
  | 'ai-companion'
  | 'encrypted-journal'
  | 'peer-pilot'
  | 'crisis-resources'
  | 'privacy-memory-hub';

export type Language = 'en' | 'bn';

export type CompanionLanguage = 'bangla' | 'banglish' | 'english';

export type CompanionMode = 'listening' | 'reflection' | 'action';

export type JournalMood = 'Calm' | 'Heavy' | 'Hopeful' | 'Restless';

export interface ApprovedMemory {
  id: string;
  text: string;
  meta: string;
  isNew?: boolean;
}

export interface MemoryProposal {
  id: string;
  text: string;
  tags: string[];
  status: 'pending' | 'approved' | 'dismissed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'companion';
  paragraphs: string[];
  italicPrompt?: string;
  timestamp: string;
  statusLabel?: string;
  modeLabel?: string;
  includesProposal?: boolean;
  detectedLanguage?: CompanionLanguage;
  isStreaming?: boolean;
  error?: string;
}

export interface JournalEntry {
  id: string;
  dateLabel: string;
  banglaDateLabel?: string;
  relativeTimeLabel: string;
  title: string;
  body: string;
  mood: JournalMood;
  tags: string[];
  aiLocked: boolean;
  updatedAtLabel: string;
}

export interface PeerSupporter {
  id: string;
  initials: string;
  name: string;
  track: string;
  summary: string;
  story: string;
  responseTime: string;
  tags: string[];
  avatarTone: 'secondary' | 'primary' | 'neutral';
}

export type VoiceConversationPhase =
  | 'idle'
  | 'listening'
  | 'transcribing'
  | 'thinking'
  | 'speaking'
  | 'paused';

export type VoiceConversationEvent =
  | 'START_CALL'
  | 'AUDIO_CAPTURED'
  | 'EMPTY_AUDIO'
  | 'TRANSCRIPT_READY'
  | 'REPLY_READY'
  | 'SPEAKING_ENDED'
  | 'USER_INTERRUPT'
  | 'PAUSE_MIC'
  | 'RESUME_MIC'
  | 'END_CALL';

export type AuthMethod = 'anonymous' | 'google' | 'email';

export interface AuthAccountSummary {
  uid: string;
  email: string | null;
  displayName: string;
  isAnonymous: boolean;
  emailVerified: boolean;
  authMethod: AuthMethod;
  needsEmailVerification: boolean;
  canSyncCloud: boolean;
}

