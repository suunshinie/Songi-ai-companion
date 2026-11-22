import {
  ApprovedMemory,
  AuthAccountSummary,
  AuthMethod,
  CompanionLanguage,
  CompanionMode,
  JournalEntry,
  Language,
  MemoryProposal,
  VoiceConversationEvent,
  VoiceConversationPhase,
} from '../types/shongi.ts';

export const MAX_APPROVED_MEMORIES = 10;

export interface BreathPhase {
  label: 'Inhale' | 'Hold' | 'Exhale';
  banglaLabel: string;
  duration: number;
}

export const BREATH_PHASES: BreathPhase[] = [
  { label: 'Inhale', banglaLabel: 'শ্বাস নিন', duration: 4 },
  { label: 'Hold', banglaLabel: 'ধরে রাখুন', duration: 7 },
  { label: 'Exhale', banglaLabel: 'শ্বাস ছাড়ুন', duration: 8 },
];

export interface BreathState {
  phaseIndex: number;
  timeRemaining: number;
  isRunning: boolean;
}

export function createInitialBreathState(): BreathState {
  return {
    phaseIndex: 0,
    timeRemaining: BREATH_PHASES[0].duration,
    isRunning: true,
  };
}

export function stepBreathState(state: BreathState): BreathState {
  if (!state.isRunning) {
    return state;
  }
  const nextRemaining = state.timeRemaining - 1;
  if (nextRemaining > 0) {
    return {
      ...state,
      timeRemaining: nextRemaining,
    };
  }
  const nextIndex = (state.phaseIndex + 1) % BREATH_PHASES.length;
  return {
    ...state,
    phaseIndex: nextIndex,
    timeRemaining: BREATH_PHASES[nextIndex].duration,
  };
}

export function filterJournalEntries(
  entries: JournalEntry[],
  searchQuery: string,
  activeFilter: string
): JournalEntry[] {
  const q = searchQuery.trim().toLowerCase();

  return entries.filter((entry) => {
    const matchesFilter = (() => {
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Admission') {
        return entry.tags.some(
          (t) =>
            t.toLowerCase().includes('admission') ||
            t.toLowerCase().includes('familyweight')
        );
      }
      if (activeFilter === 'Midnight') {
        return (
          entry.tags.some((t) => t.toLowerCase().includes('midnight')) ||
          entry.relativeTimeLabel.toLowerCase().includes('am')
        );
      }
      if (activeFilter === 'Gratitude') {
        return entry.tags.some(
          (t) =>
            t.toLowerCase().includes('gratitude') ||
            t.toLowerCase().includes('grounding') ||
            t.toLowerCase().includes('support')
        );
      }
      return true;
    })();

    if (!matchesFilter) return false;
    if (!q) return true;

    const haystack = [
      entry.title,
      entry.body,
      entry.mood,
      entry.relativeTimeLabel,
      ...entry.tags,
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function approveMemoryProposal(
  memories: ApprovedMemory[],
  proposal: MemoryProposal,
  customText?: string
): { memories: ApprovedMemory[]; proposal: MemoryProposal } {
  const finalText = (customText ?? proposal.text).trim().replace(/^"|"$/g, '');
  if (!finalText) {
    return { memories, proposal };
  }

  const alreadyExists = memories.some(
    (m) => m.text.toLowerCase() === finalText.toLowerCase()
  );

  const nextMemories = alreadyExists
    ? memories
    : [
        ...memories,
        {
          id: `mem-${Date.now()}`,
          text: finalText,
          meta: 'Approved just now • Session memory',
          isNew: true,
        },
      ];

  return {
    memories: nextMemories.slice(0, MAX_APPROVED_MEMORIES),
    proposal: {
      ...proposal,
      text: finalText,
      status: 'approved',
    },
  };
}

export function formatMemoryUsage(count: number, max = MAX_APPROVED_MEMORIES): string {
  return `${count} of ${max} limit used`;
}

const STRONG_BANGLISH_WORDS = new Set([
  'ami',
  'tumi',
  'apni',
  'amar',
  'tomar',
  'apnar',
  'amake',
  'tomake',
  'apnake',
  'amader',
  'tomader',
  'kemon',
  'bhalo',
  'valo',
  'korchi',
  'korchhi',
  'kortesi',
  'korbo',
  'korechi',
  'korechhi',
  'lagche',
  'lagchhe',
  'lagte',
  'laglo',
  'parchi',
  'parchhi',
  'parchina',
  'parina',
  'parbo',
  'hocche',
  'hochhe',
  'chhilo',
  'chilo',
  'ache',
  'achhe',
  'thakbo',
  'thaki',
  'thakte',
  'kichu',
  'shobai',
  'sobai',
  'kotha',
  'kharap',
  'ekhon',
  'akhon',
  'bolbo',
  'bolte',
  'bolchi',
  'bolchhi',
  'bolen',
  'kivabe',
  'kibhabe',
  'kintu',
  'shotti',
  'sotti',
  'bujhte',
  'bujhi',
  'bujhina',
  'abbu',
  'ammu',
  'bhaiya',
  'vaiya',
  'vai',
  'apu',
  'pora',
  'porikkha',
  'chinta',
  'ekta',
  'ektu',
  'khub',
  'beshi',
  'tarpor',
  'keno',
  'kothay',
  'jodi',
  'hobe',
  'hoye',
  'hote',
  'janina',
  'shuncho',
  'shuno',
  'ajke',
  'bhabchi',
  'bhabchhi',
  'bhabchilam',
  'geche',
  'gechhe',
  'ashole',
  'asole',
  'ekdom',
  'ekbare',
  'shomoy',
  'somoy',
  'jibon',
  'dorkar',
  'tahole',
  'ebong',
  'karon',
  'tobe',
  'shuru',
  'houar',
  'por',
  'theke',
  'matha',
  'kaj',
  'kore',
  'kora',
  'eta',
  'ota',
  'sheta',
  'mane',
  'moner',
  'kache',
  'kachhe',
  'sathe',
  'shathe',
  'niye',
  'diye',
  'thake',
  'hoyeche',
  'hoyechhe',
  'paichi',
  'pabo',
  'chaichi',
  'chay',
  'dekhi',
  'dekhbo',
  'ekbar',
  'onk',
  'onek',
]);

const WEAK_BANGLISH_WORDS = new Set([
  'mon',
  'mone',
  'hoy',
  'nai',
  'chai',
  'jani',
  'bolo',
  'shob',
  'sob',
  'ar',
  'ta',
  'toh',
  'ki',
  'na',
  'ei',
  'oi',
  'er',
  'ba',
  'kal',
  'raat',
  'ghum',
]);

export function detectCompanionLanguage(text: string): CompanionLanguage {
  const trimmed = text.trim();
  if (!trimmed) return 'english';

  // If the message uses Bengali Unicode script, treat it as Bangla
  if (/[\u0980-\u09FF]/.test(trimmed)) {
    return 'bangla';
  }

  const tokens = trimmed.toLowerCase().match(/[a-z']+/g) ?? [];
  let strongHits = 0;
  let weakHits = 0;

  for (const raw of tokens) {
    const token = raw.replace(/'/g, '');
    if (STRONG_BANGLISH_WORDS.has(token)) {
      strongHits += 1;
    } else if (WEAK_BANGLISH_WORDS.has(token)) {
      weakHits += 1;
    }
  }

  if (strongHits >= 1 || weakHits >= 2) {
    return 'banglish';
  }

  return 'english';
}

export function formatDetectedLanguageLabel(lang: CompanionLanguage): string {
  if (lang === 'bangla') return 'বাংলা';
  if (lang === 'banglish') return 'Banglish';
  return 'English';
}

export function buildCompanionSystemInstruction(
  mode: CompanionMode,
  memories: ApprovedMemory[],
  targetLanguage: CompanionLanguage,
  isVoiceTurn = false
): string {
  const modeDirection =
    mode === 'listening'
      ? 'Mode: Close Friend Listening. Stay present and real—do not jump straight into problem-solving or generic counseling clichés.'
      : mode === 'reflection'
      ? 'Mode: Honest Reflection. Gently help them see the knot more clearly like a thoughtful older friend over tea—warm, candid, never clinical.'
      : 'Mode: Gentle Action. Offer 1 or 2 realistic, tiny things they could actually do tonight without turning it into a robotic checklist.';

  const memoryBlock =
    memories.length > 0
      ? `Things you remember about them (weave in only when it genuinely fits, never recite like a database):\n${memories
          .map((m) => `- ${m.text}`)
          .join('\n')}`
      : 'No saved personal memories yet.';

  const languageRule =
    targetLanguage === 'bangla'
      ? `LANGUAGE RULE (CRITICAL): The user wrote in Bangla script (বাংলা). Reply strictly in warm, natural everyday Bangla (বাংলা লিপি) the way a close friend in Dhaka talks—never stiff textbook Bangla, and do NOT switch to English or Banglish.`
      : targetLanguage === 'banglish'
      ? `LANGUAGE RULE (CRITICAL): The user wrote in Banglish (Bengali in Latin letters). Reply strictly in natural, warm Dhaka Banglish (e.g., "Areh, shon... ajke ki khub beshi chap jacche naki?"). NEVER output Bengali Unicode script (ক-হ), and NEVER slip into formal English paragraphs.`
      : `LANGUAGE RULE (CRITICAL): The user wrote in English. Reply strictly in warm, natural conversational English—like a real human friend texting or talking, never stiff or clinical.`;

  const voiceRule = isVoiceTurn
    ? 'Voice Turn Rule: You are speaking aloud in a live two-way voice conversation. Keep it natural, conversational, easy on the ear (usually 1–4 spoken sentences unless they asked for a deeper talk), with zero markdown symbols or bullet lists.'
    : 'Response Length Rule: Read the room carefully. If the user sends something short, tired, casual, or heavy ("hmm", "mon kharap", "tired"), talk LESS—just 1 to 3 human sentences so they do not feel bombarded. If they share a longer story, ask deep questions, or want perspective, talk MORE—up to 2 natural, flowing short paragraphs.';

  return [
    'You are SHONGI (সঙ্গী), a grounded, caring human-sounding companion for young adults and students in Bangladesh. You are NOT a therapist or doctor (never diagnose; if someone hints at imminent self-harm or crisis, gently share Kaan Pete Roi 09612-119911 or 999).',
    'HOW TO SOUND HUMAN: Never talk like an AI assistant. Avoid robotic openers like "I hear you and your feelings are completely valid" or "That sounds really challenging" or bullet-pointed advice unless asked. Use natural contractions, gentle pauses, warmth, and real presence.',
    'TAKE INITIATIVE NATURALLY: Do not just passively echo what they said or end every reply with a generic question. Like a real friend, sometimes check on the small human basics ("Wait, have you eaten anything today?", "Ek cup cha ba pani kheye bosho to ektu"), sometimes offer a gentle shift or honest thought, and sometimes just sit with them warmly without forcing a question.',
    voiceRule,
    modeDirection,
    memoryBlock,
    'IMPORTANT: Even if earlier messages in the conversation used a different language, ALWAYS reply strictly in the language of the user’s LATEST message.',
    languageRule,
  ].join('\n\n');
}

export function computeWordRevealDelay(token: string): number {
  const trimmed = token.trim();
  if (!trimmed) return 8;
  if (/[.!?।]$/.test(trimmed)) return 38;
  if (/[,;:—–-]$/.test(trimmed)) return 22;
  if (trimmed.length >= 9) return 18;
  return 13;
}

export function splitParagraphsFromText(text: string): string[] {
  const cleaned = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : [text.trim()].filter(Boolean);
}

export function generateCompanionReply(
  userText: string,
  mode: CompanionMode,
  memories: ApprovedMemory[],
  _lang: Language
): { paragraphs: string[]; italicPrompt?: string; detectedLanguage: CompanionLanguage } {
  const detectedLanguage = detectCompanionLanguage(userText);
  const normalized = userText.toLowerCase();
  const hasAdmissionContext =
    normalized.includes('admission') ||
    normalized.includes('buet') ||
    normalized.includes('iba') ||
    normalized.includes('parent') ||
    normalized.includes('আব্বু') ||
    normalized.includes('আম্মু') ||
    normalized.includes('ইঞ্জিনিয়ারিং') ||
    memories.some((m) => m.text.toLowerCase().includes('admission'));

  const wantsPeer =
    normalized.includes('peer') ||
    normalized.includes('someone') ||
    normalized.includes('অন্য কারো') ||
    normalized.includes('karo shathe') ||
    normalized.includes('karo sathe');

  if (detectedLanguage === 'banglish') {
    if (wantsPeer) {
      return {
        detectedLanguage,
        paragraphs: [
          'Obosshoi. Tumi chaile ekhon-i Peer Pilot-e giye emon karo shathe kotha bolte paro jini nijeo ei admission ar family pressure par kore eshechen.',
        ],
        italicPrompt:
          'Dan pasher "Explore Peer Pilot" button theke nischinte shekhane jete paro, kono tarahuro nei.',
      };
    }

    if (mode === 'action') {
      return {
        detectedLanguage,
        paragraphs: [
          hasAdmissionContext
            ? 'Eksathe puro bhobisshot thik korar chaap neyar dorkar nei. Ajke rat-er jonno shudhu ekta chhoto, shohoj step neya jak:'
            : 'Cholo bishoyta chhoto ar shohoj duita step-e bhag kori, jate mathar opor theke chaap ta ektu kome:',
          '1. Ajke shondhay matro 15 minute alada kore likhe felo tomar nijersho icche ba bhalo lagar jayga gulo ki. 2. Poribarer shathe kotha bolar age nijer moner kotha gulo guchiye nao.',
        ],
        italicPrompt: 'Kon chhoto step ta tomar kache ekhon shobcheye shohoj mone hocche?',
      };
    }

    if (mode === 'reflection') {
      return {
        detectedLanguage,
        paragraphs: [
          hasAdmissionContext
            ? 'Tumi je bishoyta niye bhabcho ta holo nijer ashol agroho ar poribarer prottyashar moddhe balance khoja. Ei dwidha ta tomar durbolota na, borong nijeke chenar ongsho.'
            : 'Tomar kothar moddhe ekta gobhir klanti ar nijeke proman korar tagid ter pawa jacche. Ektu theme bhebe dekha jak—ei bhoy ta ashole kothay theke ashche?',
        ],
        italicPrompt:
          'Jodi tomar kono ghonishtho bondhu thik ei obosthay thakto, tumi take ki bole shantona dite?',
      };
    }

    return {
      detectedLanguage,
      paragraphs: [
        'Ami tomar kotha ta mon diye shunchi. Tumi ja onubhob korcho ta shompurno shabhabik.',
        hasAdmissionContext
          ? 'Admission test-er chaap ar poribarer asha—duito eksathe shamlano shotti onek bhari hote pare. Ekhane kono tara nei, tumi tomar nijer gotite bolo.'
          : 'Tumi ki chao amra kono shomadhan khojar chaap charai ekhon ektu shanto hoye boshi ar tomar moner kotha gulo shuni?',
      ],
    };
  }

  if (detectedLanguage === 'english') {
    if (wantsPeer) {
      return {
        detectedLanguage,
        paragraphs: [
          'Of course. Whenever you feel ready, you can step into Peer Pilot to talk anonymously with vetted alumni who have walked through this exact pressure.',
        ],
        italicPrompt:
          'You can use the "Explore Peer Pilot" button on the right whenever you want—there is zero rush.',
      };
    }

    if (mode === 'action') {
      return {
        detectedLanguage,
        paragraphs: [
          hasAdmissionContext
            ? 'You do not have to solve your entire future tonight. Let us pick one small, realistic step just for this evening:'
            : 'Let us break this down into two gentle, manageable steps so your mind gets a little breathing room:',
          '1. Take 15 quiet minutes to jot down what genuinely interests you without judging it. 2. Put your thoughts into two calm sentences before deciding when to talk with your family.',
        ],
        italicPrompt: 'Which small step feels lightest to start with right now?',
      };
    }

    if (mode === 'reflection') {
      return {
        detectedLanguage,
        paragraphs: [
          hasAdmissionContext
            ? 'What you are carrying right now is the tension between honoring your own strengths and carrying your family’s hopes. Questioning that path is not weakness—it is self-awareness.'
            : 'There is a real heaviness in what you shared, along with a lot of pressure to keep holding everything together. Gently, where do you feel that worry sitting most right now?',
        ],
        italicPrompt:
          'If a close friend came to you feeling this exact weight, what would you tell them?',
      };
    }

    return {
      detectedLanguage,
      paragraphs: [
        'I am here and listening closely. Everything you are feeling right now makes complete sense.',
        hasAdmissionContext
          ? 'Carrying exam stress alongside family expectations at the same time can feel exhausting. Take your time—there is no pressure here.'
          : 'Would you like to just let things out at your own pace without needing to fix anything right away?',
      ],
    };
  }

  // Bangla script branch
  if (wantsPeer) {
    return {
      detectedLanguage,
      paragraphs: [
        'অবশ্যই। আপনি চাইলে এখনই Peer Pilot-এ গিয়ে এমন কারো সাথে কথা বলতে পারেন যিনি নিজেও এই ভর্তি পরীক্ষার চাপ পার হয়ে এসেছেন।',
      ],
      italicPrompt:
        'আপনি চাইলে ডান পাশের "Explore Peer Pilot" বাটন থেকে নিরাপদ সার্কেলে যেতে পারেন, কোনো তাড়াহুড়ো নেই।',
    };
  }

  if (mode === 'action') {
    return {
      detectedLanguage,
      paragraphs: [
        hasAdmissionContext
          ? 'একসাথে পুরো ভবিষ্যৎ ঠিক করার চাপ নেওয়ার দরকার নেই। আজ রাতের জন্য শুধু একটি ছোট, বাস্তবসম্মত পদক্ষেপ বেছে নেওয়া যাক:'
          : 'চলুন বিষয়টাকে একদম ছোট ও সহজ ধাপে ভাগ করি, যাতে আপনার মাথার ওপর থেকে ভারটা একটু কমে:',
        '১. আজ সন্ধ্যায় মাত্র ২০ মিনিট আলাদা করে কাগজে লিখুন আপনার নিজের আগ্রহের জায়গাগুলো কী। ২. পরিবারের সাথে কথা বলার আগে নিজের মনের কথাগুলো গুছিয়ে নিন।',
      ],
      italicPrompt: 'কোন ছোট ধাপটা আপনার কাছে এখন সবচেয়ে সহজ মনে হচ্ছে?',
    };
  }

  if (mode === 'reflection') {
    return {
      detectedLanguage,
      paragraphs: [
        hasAdmissionContext
          ? 'আপনি যে বিষয়টি নিয়ে ভাবছেন তা হলো নিজের প্রকৃত আগ্রহ আর পরিবারের প্রত্যাশার মধ্যে ভারসাম্য খোঁজা। এই দ্বন্দ্বটা আপনার দুর্বলতা নয়, বরং নিজের পথ চেনার অংশ।'
          : 'আপনার কথাগুলোর ভেতরে একটা গভীর ক্লান্তি আর নিজেকে প্রমাণ করার তাগিদ টের পাওয়া যাচ্ছে। একটু থেমে ভাবা যাক—এই ভয়টা আসলে কোথা থেকে আসছে?',
      ],
      italicPrompt:
        'যদি আপনার কোনো ঘনিষ্ঠ বন্ধু ঠিক এই অবস্থায় থাকত, আপনি তাকে কী বলে সান্ত্বনা দিতেন?',
    };
  }

  return {
    detectedLanguage,
    paragraphs: [
      'আমি আপনার কথাটি মন দিয়ে শুনছি। আপনি যা অনুভব করছেন তা সম্পূর্ণ অর্থপূর্ণ এবং স্বাভাবিক।',
      hasAdmissionContext
        ? 'ভর্তি পরীক্ষার চাপ আর পরিবারের আশা—দুটো একসাথে সামলানো সত্যিই অনেক ভারী হতে পারে। এখানে কোনো তাড়া নেই; আপনি নিজের গতিতে বলুন।'
        : 'আপনি কি চান আমরা কোনো সমাধান খোঁজার চাপ ছাড়াই এখন একটু শান্ত হয়ে বসি এবং আপনার মনের কথাগুলো শুনি?',
    ],
  };
}

export function reduceVoiceConversationPhase(
  current: VoiceConversationPhase,
  event: VoiceConversationEvent
): VoiceConversationPhase {
  if (event === 'END_CALL') return 'idle';
  if (event === 'START_CALL') return 'listening';

  switch (current) {
    case 'idle':
      return 'idle';
    case 'listening':
      if (event === 'AUDIO_CAPTURED') return 'transcribing';
      if (event === 'PAUSE_MIC') return 'paused';
      return 'listening';
    case 'transcribing':
      if (event === 'TRANSCRIPT_READY') return 'thinking';
      if (event === 'EMPTY_AUDIO' || event === 'USER_INTERRUPT') return 'listening';
      if (event === 'PAUSE_MIC') return 'paused';
      return 'transcribing';
    case 'thinking':
      if (event === 'REPLY_READY') return 'speaking';
      if (event === 'EMPTY_AUDIO' || event === 'USER_INTERRUPT') return 'listening';
      if (event === 'PAUSE_MIC') return 'paused';
      return 'thinking';
    case 'speaking':
      if (event === 'SPEAKING_ENDED' || event === 'USER_INTERRUPT') return 'listening';
      if (event === 'PAUSE_MIC') return 'paused';
      return 'speaking';
    case 'paused':
      if (event === 'RESUME_MIC') return 'listening';
      return 'paused';
  }
}

export interface ChatHistoryTurn {
  role: 'user' | 'model';
  text: string;
}

/**
 * Ensures history passed to Gemini chat starts with 'user', strictly alternates
 * 'user' <-> 'model', merges consecutive same-role turns, and ends on 'model'
 * before the next user message is sent via chat.sendMessageStream().
 */
export function sanitizeChatHistory(turns: ChatHistoryTurn[]): ChatHistoryTurn[] {
  const cleaned: ChatHistoryTurn[] = [];

  for (const item of turns) {
    const text = typeof item?.text === 'string' ? item.text.trim() : '';
    if (!text) continue;
    const role: 'user' | 'model' = item.role === 'model' ? 'model' : 'user';

    if (cleaned.length === 0) {
      if (role !== 'user') continue;
      cleaned.push({ role, text });
      continue;
    }

    const last = cleaned[cleaned.length - 1];
    if (last.role === role) {
      last.text = `${last.text}\n\n${text}`;
    } else {
      cleaned.push({ role, text });
    }
  }

  if (cleaned.length > 0 && cleaned[cleaned.length - 1].role === 'user') {
    cleaned.pop();
  }

  return cleaned;
}

export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/(^|\s)[#>]+/g, ' ')
    .replace(/[*_`~]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isNoiseOnlyTranscript(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const normalized = trimmed
    .toLowerCase()
    .replace(/[.\s!?…'"()[\]{}-]+/g, '');
  if (!normalized) return true;
  return new Set([
    'silence',
    'nospeech',
    'inaudible',
    'unintelligible',
    'blankaudio',
    'backgroundnoise',
    'noise',
    'music',
    'applause',
  ]).has(normalized);
}

export function shouldTriggerSilenceStop(
  hasHeardSpeech: boolean,
  silentSinceMs: number | null,
  nowMs: number,
  silenceThresholdMs = 1400
): boolean {
  if (!hasHeardSpeech || silentSinceMs === null) return false;
  return nowMs - silentSinceMs >= silenceThresholdMs;
}

export function sanitizeFirestoreId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned || `doc_${Date.now()}`;
}

export interface RawFirebaseUserInput {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
  emailVerified?: boolean;
  providerData?: Array<{ providerId?: string | null }>;
}

export function deriveAuthSummary(user: RawFirebaseUserInput): AuthAccountSummary {
  const providerIds = (user.providerData ?? []).map((p) => p.providerId ?? '');
  let authMethod: AuthMethod = 'anonymous';
  if (!user.isAnonymous) {
    if (providerIds.includes('google.com')) {
      authMethod = 'google';
    } else if (providerIds.includes('password') || user.email) {
      authMethod = 'email';
    }
  }

  const emailVerified = Boolean(user.emailVerified || authMethod === 'google');
  const needsEmailVerification = authMethod === 'email' && !user.isAnonymous && !emailVerified;
  const fallbackName =
    authMethod === 'anonymous'
      ? 'Anonymous Guest'
      : user.email?.split('@')[0] || 'Sanctuary Member';

  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName?.trim() || fallbackName,
    isAnonymous: Boolean(user.isAnonymous),
    emailVerified,
    authMethod,
    needsEmailVerification,
    canSyncCloud: !needsEmailVerification,
  };
}

export function mapFirebaseAuthError(rawError: unknown): string {
  const raw = rawError instanceof Error ? rawError.message : String(rawError);
  if (raw.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is not enabled yet in your Firebase Console (Authentication > Sign-in method). Please enable Anonymous and Email/Password providers there, or sign in with Google.';
  }
  if (raw.includes('auth/popup-blocked')) {
    return 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
  }
  if (raw.includes('auth/popup-closed-by-user') || raw.includes('auth/cancelled-popup-request')) {
    return 'Sign-in popup was closed before completing.';
  }
  if (raw.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (raw.includes('auth/weak-password')) {
    return 'Please choose a stronger password (at least 6 characters).';
  }
  if (raw.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/wrong-password') ||
    raw.includes('auth/user-not-found')
  ) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (raw.includes('auth/too-many-requests')) {
    return 'Too many attempts right now. Please wait a few moments before trying again.';
  }
  if (raw.includes('auth/credential-already-in-use')) {
    return 'This Google or email account is already linked to another sanctuary profile. Try signing into it directly.';
  }
  return raw || 'Unable to complete authentication right now.';
}

