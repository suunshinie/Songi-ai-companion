import test from 'node:test';
import assert from 'node:assert/strict';
import {
  approveMemoryProposal,
  BREATH_PHASES,
  buildCompanionSystemInstruction,
  computeWordRevealDelay,
  createInitialBreathState,
  deriveAuthSummary,
  detectCompanionLanguage,
  filterJournalEntries,
  formatMemoryUsage,
  generateCompanionReply,
  isNoiseOnlyTranscript,
  mapFirebaseAuthError,
  reduceVoiceConversationPhase,
  sanitizeChatHistory,
  sanitizeFirestoreId,
  shouldTriggerSilenceStop,
  stepBreathState,
  stripMarkdownForSpeech,
} from './shongiLogic';
import { ApprovedMemory, JournalEntry, MemoryProposal, VoiceConversationPhase } from '../types/shongi';

const sampleEntries: JournalEntry[] = [
  {
    id: 'j1',
    dateLabel: 'October 24, 2024',
    relativeTimeLabel: 'Today • 11:30 PM',
    title: 'Dealing with family expectations after mock test results',
    body: 'আজকের রেজাল্ট দেখার পর আব্বুর চেহারার দিকে তাকানো যাচ্ছিল না।',
    mood: 'Heavy',
    tags: ['#AdmissionStress', '#FamilyWeight'],
    aiLocked: true,
    updatedAtLabel: 'Saved locally at 11:42 PM',
  },
  {
    id: 'j2',
    dateLabel: 'October 23, 2024',
    relativeTimeLabel: 'Yesterday • 1:15 AM',
    title: 'রাত দুইটায় ঢাকা শহরের বৃষ্টি আর শূন্যতা',
    body: 'সবাই ঘুমাচ্ছে। বারান্দায় দাঁড়িয়ে ভেজা মাটির গন্ধ নিচ্ছিলাম।',
    mood: 'Restless',
    tags: ['#MidnightThoughts'],
    aiLocked: true,
    updatedAtLabel: 'Saved locally at 1:30 AM',
  },
  {
    id: 'j3',
    dateLabel: 'October 21, 2024',
    relativeTimeLabel: 'Oct 21 • 5:40 PM',
    title: 'Dhanmondi Lake walk & finding rhythm',
    body: 'Took a 40-minute walk by the water. No phone, just watching children feeding ducks.',
    mood: 'Calm',
    tags: ['#Grounding', '#Gratitude'],
    aiLocked: true,
    updatedAtLabel: 'Saved locally at 6:05 PM',
  },
];

test('filterJournalEntries filters by tag preset and Bangla/English search', () => {
  assert.equal(filterJournalEntries(sampleEntries, '', 'All').length, 3);
  assert.equal(filterJournalEntries(sampleEntries, '', 'Admission').length, 1);
  assert.equal(filterJournalEntries(sampleEntries, '', 'Midnight').length, 1);
  assert.equal(filterJournalEntries(sampleEntries, '', 'Gratitude').length, 1);
  assert.equal(filterJournalEntries(sampleEntries, 'Dhanmondi', 'All').length, 1);
  assert.equal(filterJournalEntries(sampleEntries, 'বৃষ্টি', 'All').length, 1);
});

test('4-7-8 breathing cycle transitions correctly through Inhale -> Hold -> Exhale -> Inhale', () => {
  let state = createInitialBreathState();
  assert.equal(BREATH_PHASES[state.phaseIndex].label, 'Inhale');
  assert.equal(state.timeRemaining, 4);

  // Step 3 times -> still Inhale with 1s left
  for (let i = 0; i < 3; i++) state = stepBreathState(state);
  assert.equal(BREATH_PHASES[state.phaseIndex].label, 'Inhale');
  assert.equal(state.timeRemaining, 1);

  // Step once more -> Hold with 7s left
  state = stepBreathState(state);
  assert.equal(BREATH_PHASES[state.phaseIndex].label, 'Hold');
  assert.equal(state.timeRemaining, 7);

  // Paused state should not advance
  const paused = stepBreathState({ ...state, isRunning: false });
  assert.equal(paused.timeRemaining, 7);
  assert.equal(paused.phaseIndex, 1);

  // Step 7 times -> Exhale with 8s left
  for (let i = 0; i < 7; i++) state = stepBreathState(state);
  assert.equal(BREATH_PHASES[state.phaseIndex].label, 'Exhale');
  assert.equal(state.timeRemaining, 8);
});

test('approveMemoryProposal appends memory without duplicating and updates proposal status', () => {
  const existing: ApprovedMemory[] = [
    {
      id: 'm1',
      text: 'Prefers gentle, non-authoritarian tone',
      meta: 'Approved 3 days ago • Persistent',
    },
  ];
  const proposal: MemoryProposal = {
    id: 'p1',
    text: 'Feeling anxious about university admission tests.',
    tags: ['#VarsityPrep'],
    status: 'pending',
  };

  const result = approveMemoryProposal(existing, proposal);
  assert.equal(result.memories.length, 2);
  assert.equal(result.proposal.status, 'approved');
  assert.equal(formatMemoryUsage(result.memories.length), '2 of 10 limit used');

  // Re-approving same text should not duplicate
  const dup = approveMemoryProposal(result.memories, proposal);
  assert.equal(dup.memories.length, 2);
});

test('detectCompanionLanguage distinguishes Bangla, Banglish, and English', () => {
  assert.equal(detectCompanionLanguage('আমার আজকে মনটা খুব ভারী লাগছে।'), 'bangla');
  assert.equal(detectCompanionLanguage('BUET এর exam নিয়ে খুব টেনশন হচ্ছে'), 'bangla');
  assert.equal(
    detectCompanionLanguage('Shongi, ami ajke khub exhausted lagchhe, kotha bolte chai.'),
    'banglish'
  );
  assert.equal(detectCompanionLanguage('mon kharap hoye ache'), 'banglish');
  assert.equal(
    detectCompanionLanguage('I feel completely overwhelmed by tomorrow exams.'),
    'english'
  );
  assert.equal(detectCompanionLanguage('I just want a cup of chai and quiet.'), 'english');
  assert.equal(detectCompanionLanguage('Hey Shongi, I feel tired today.'), 'english');
});

test('generateCompanionReply and system instruction match detected language and mode', () => {
  const peerReply = generateCompanionReply('Can I talk to a peer?', 'listening', [], 'en');
  assert.equal(peerReply.detectedLanguage, 'english');
  assert.ok(peerReply.paragraphs[0].includes('Peer Pilot'));
  assert.ok(!/[\u0980-\u09FF]/.test(peerReply.paragraphs[0]));

  const banglishReply = generateCompanionReply(
    'Ami khub tired lagchhe, IBA prep niye bhabchi.',
    'action',
    [],
    'en'
  );
  assert.equal(banglishReply.detectedLanguage, 'banglish');
  assert.ok(!/[\u0980-\u09FF]/.test(banglishReply.paragraphs.join(' ')));

  const banglaReply = generateCompanionReply('আম্মুকে কীভাবে বোঝাবো?', 'listening', [], 'bn');
  assert.equal(banglaReply.detectedLanguage, 'bangla');
  assert.ok(/[\u0980-\u09FF]/.test(banglaReply.paragraphs[0]));

  const sysBanglish = buildCompanionSystemInstruction('listening', [], 'banglish');
  assert.ok(sysBanglish.includes('Banglish'));
  assert.ok(computeWordRevealDelay('hello.') > computeWordRevealDelay('hello'));
});

test('two-way voice conversation state machine transitions cleanly for both-side talking', () => {
  let phase: VoiceConversationPhase = 'idle';
  phase = reduceVoiceConversationPhase(phase, 'START_CALL');
  assert.equal(phase, 'listening');

  phase = reduceVoiceConversationPhase(phase, 'AUDIO_CAPTURED');
  assert.equal(phase, 'transcribing');

  phase = reduceVoiceConversationPhase(phase, 'TRANSCRIPT_READY');
  assert.equal(phase, 'thinking');

  phase = reduceVoiceConversationPhase(phase, 'REPLY_READY');
  assert.equal(phase, 'speaking');

  // Auto-loops back to listening after bot finishes speaking
  phase = reduceVoiceConversationPhase(phase, 'SPEAKING_ENDED');
  assert.equal(phase, 'listening');

  // Supports barge-in / user interrupting bot speech
  phase = reduceVoiceConversationPhase('speaking', 'USER_INTERRUPT');
  assert.equal(phase, 'listening');

  // Pause and resume
  phase = reduceVoiceConversationPhase(phase, 'PAUSE_MIC');
  assert.equal(phase, 'paused');
  phase = reduceVoiceConversationPhase(phase, 'RESUME_MIC');
  assert.equal(phase, 'listening');

  // End call from any phase
  assert.equal(reduceVoiceConversationPhase('speaking', 'END_CALL'), 'idle');
});

test('shouldTriggerSilenceStop waits until speech started and silence threshold elapsed', () => {
  assert.equal(shouldTriggerSilenceStop(false, 1000, 3000, 1400), false);
  assert.equal(shouldTriggerSilenceStop(true, null, 3000, 1400), false);
  assert.equal(shouldTriggerSilenceStop(true, 1000, 2000, 1400), false);
  assert.equal(shouldTriggerSilenceStop(true, 1000, 2400, 1400), true);
});

test('deriveAuthSummary and mapFirebaseAuthError handle anonymous, Google, and verified/unverified email accounts', () => {
  const anon = deriveAuthSummary({ uid: 'anon_1', isAnonymous: true });
  assert.equal(anon.authMethod, 'anonymous');
  assert.equal(anon.needsEmailVerification, false);
  assert.equal(anon.canSyncCloud, true);

  const google = deriveAuthSummary({
    uid: 'g_1',
    email: 'user@gmail.com',
    displayName: 'Nusrat',
    isAnonymous: false,
    emailVerified: true,
    providerData: [{ providerId: 'google.com' }],
  });
  assert.equal(google.authMethod, 'google');
  assert.equal(google.canSyncCloud, true);

  const unverifiedEmail = deriveAuthSummary({
    uid: 'e_1',
    email: 'student@dhaka.edu',
    isAnonymous: false,
    emailVerified: false,
    providerData: [{ providerId: 'password' }],
  });
  assert.equal(unverifiedEmail.authMethod, 'email');
  assert.equal(unverifiedEmail.needsEmailVerification, true);
  assert.equal(unverifiedEmail.canSyncCloud, false);

  const verifiedEmail = deriveAuthSummary({
    uid: 'e_1',
    email: 'student@dhaka.edu',
    isAnonymous: false,
    emailVerified: true,
    providerData: [{ providerId: 'password' }],
  });
  assert.equal(verifiedEmail.needsEmailVerification, false);
  assert.equal(verifiedEmail.canSyncCloud, true);

  assert.equal(sanitizeFirestoreId('mem.1/bad id!'), 'mem_1_bad_id_');
  assert.ok(mapFirebaseAuthError('FirebaseError: (auth/operation-not-allowed)').includes('Firebase Console'));
});

test('sanitizeChatHistory enforces alternating user->model turns and drops orphan turns', () => {
  const result = sanitizeChatHistory([
    { role: 'model', text: 'Leading model greeting should drop' },
    { role: 'user', text: 'Hi' },
    { role: 'user', text: 'Are you there?' },
    { role: 'model', text: 'Yes, listening.' },
    { role: 'user', text: 'Trailing failed turn user text' },
  ]);

  assert.deepEqual(result, [
    { role: 'user', text: 'Hi\n\nAre you there?' },
    { role: 'model', text: 'Yes, listening.' },
  ]);
  assert.deepEqual(sanitizeChatHistory([{ role: 'user', text: 'Only user' }]), []);
});

test('stripMarkdownForSpeech and isNoiseOnlyTranscript clean voice payloads', () => {
  assert.equal(stripMarkdownForSpeech('**Hello**, _friend_! Try `breathing`.'), 'Hello, friend! Try breathing.');
  assert.equal(isNoiseOnlyTranscript(''), true);
  assert.equal(isNoiseOnlyTranscript('[silence]'), true);
  assert.equal(isNoiseOnlyTranscript('(no speech)'), true);
  assert.equal(isNoiseOnlyTranscript('...'), true);
  assert.equal(isNoiseOnlyTranscript('Ami tired lagche'), false);
  assert.equal(reduceVoiceConversationPhase('thinking', 'USER_INTERRUPT'), 'listening');
  assert.equal(reduceVoiceConversationPhase('transcribing', 'USER_INTERRUPT'), 'listening');
});


