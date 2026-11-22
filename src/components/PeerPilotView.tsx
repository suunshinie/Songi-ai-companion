import React, { useState } from 'react';
import { AppScreen, PeerSupporter } from '../types/shongi';
import { PEER_SUPPORTERS } from '../data/seedData';

interface PeerPilotViewProps {
  onNavigate: (screen: AppScreen) => void;
}

const ACADEMIC_TOPICS = [
  {
    id: 'medical',
    title: 'Medical / Dental Admission Pressure',
    banglaTag: 'মেডিকেল',
    description:
      'Overcoming extreme score cutoffs, mock test panic, and competitive dread.',
  },
  {
    id: 'public-private',
    title: 'Public vs. Private University Dilemma',
    banglaTag: 'পাবলিক বনাম প্রাইভেট',
    description: 'Dealing with societal stigma, tuition feasibility, and career clarity.',
  },
  {
    id: 'parental-disappointment',
    title: 'Dealing with Parental Disappointment',
    banglaTag: 'পারিবারিক প্রত্যাশা',
    description: 'Managing heavy domestic pressure, silence, comparisons, and guilt.',
  },
];

export const PeerPilotView: React.FC<PeerPilotViewProps> = ({ onNavigate }) => {
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [selectedSupporter, setSelectedSupporter] = useState<PeerSupporter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('public-private');
  const [reportReason, setReportReason] = useState('unsolicited-contact');
  const [connectionEnded, setConnectionEnded] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'matching' | 'queued'>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleRequestPeer = () => {
    setRequestStatus('matching');
    window.setTimeout(() => {
      setRequestStatus('queued');
      showToast('Peer request submitted! Expected match within 2-4 hours.');
    }, 800);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Top Notice / Boundary Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-6 lg:p-7 shadow-sm">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center shrink-0 text-on-secondary-fixed shadow-sm">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold uppercase tracking-wider">
                    Pilot Phase 01
                  </span>
                  <span className="text-[18px] font-semibold text-primary bangla-text">
                    Vetted Peer Matching • ভর্তি পরীক্ষা ও মানসিক ভারসাম্য
                  </span>
                </div>
                <p className="text-[15px] text-on-surface-variant max-w-3xl leading-relaxed">
                  100% of first-contact messages are human-reviewed before delivery to guarantee
                  emotional safety and mutual respect. Supporters are peers with lived experience,{' '}
                  <strong className="text-on-surface font-medium">
                    not licensed therapists or medical professionals
                  </strong>
                  .
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setGuidelinesOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-surface text-primary text-[14px] font-medium shadow-sm hover:bg-surface-container-high transition-colors flex items-center gap-2 shrink-0"
            >
              <span className="material-symbols-outlined text-lg text-secondary">policy</span>
              <span>Safety Code</span>
            </button>
          </div>
        </div>

        {/* Main Workspace: Asymmetric 2-Column Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Active Match Card (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-widest block">
                  Active Bridge
                </span>
                <h2 className="text-[22px] font-semibold text-primary">Matched Peer Session</h2>
              </div>
              <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-ping" />
                {connectionEnded ? 'Session Closed Safely' : 'Session Encrypted'}
              </span>
            </div>

            {connectionEnded ? (
              <div className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container mx-auto flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">check_circle</span>
                </div>
                <h3 className="text-[18px] font-semibold text-primary">
                  Peer Connection Closed &amp; Purged
                </h3>
                <p className="text-[14px] text-on-surface-variant max-w-md mx-auto">
                  All draft introductions have been cleared from your local screen. You can request a
                  different supporter on the right whenever you feel ready.
                </p>
                <button
                  type="button"
                  onClick={() => setConnectionEnded(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-primary text-[13px] font-semibold hover:bg-surface-container-high"
                >
                  Restore Session Preview
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-8 shadow-sm space-y-6">
                {/* Identity Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 bg-surface-container-low rounded-xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center text-[22px] font-semibold shadow-inner bangla-text">
                        ত
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-xs">
                        <span className="w-3.5 h-3.5 rounded-full bg-tertiary-container" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[18px] font-semibold text-primary">Tanvir</h3>
                        <span className="px-2 py-0.5 rounded-md bg-surface text-on-surface-variant text-[11px] font-semibold">
                          Anonymous Display
                        </span>
                      </div>
                      <p className="text-[13px] text-on-surface-variant">
                        Dhaka University Alumnus • 2nd-Time Admission Survivor
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-on-surface-variant block">
                      Response Time
                    </span>
                    <span className="text-[18px] font-semibold text-secondary tabular-nums">
                      ~2.5 Hours
                    </span>
                  </div>
                </div>

                {/* Lived Experience Story Teaser */}
                <div className="p-4 rounded-xl bg-surface-container-low text-on-surface space-y-2">
                  <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-lg">format_quote</span>
                    <span className="text-[12px] font-semibold text-secondary">
                      Supporter&apos;s Reflection
                    </span>
                  </div>
                  <p className="text-[15px] text-on-surface-variant italic leading-relaxed bangla-text">
                    &ldquo;আমি প্রথমবার বুয়েট আর ঢাবিতে পাইনি। পরিবারের হতাশা, আত্মীয়দের
                    কটাক্ষ—সবই পার করেছি। ১ বছর ড্রপ দিয়ে ঘুরে দাঁড়ানোর পথটা নিঃসঙ্গ ছিল। আপনার
                    অনুভূতি সম্পূর্ণ স্বাভাবিক।&rdquo;
                  </p>
                </div>

                {/* Tags Cloud */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Shared Context &amp; Domain
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-surface-container text-primary text-[12px] font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">
                        school
                      </span>
                      Engineering Prep
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-surface-container text-primary text-[12px] font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">
                        history
                      </span>
                      Gap Year Experience
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-surface-container text-primary text-[12px] font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">
                        location_on
                      </span>
                      Dhaka
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-surface-container text-primary text-[12px] font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-secondary">
                        translate
                      </span>
                      Bangla &amp; English
                    </span>
                  </div>
                </div>

                {/* Status Indicator Pill / Review Pending */}
                <div className="p-5 rounded-2xl bg-secondary-fixed/40 text-on-secondary-fixed space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[18px] font-semibold text-on-secondary-fixed leading-tight">
                        Human Review Pending on Introduction Message
                      </h4>
                      <p className="text-[13px] text-on-secondary-fixed-variant leading-snug">
                        Estimated review time: <strong>~45 mins</strong> (Active moderation team:
                        10:00 AM – 10:00 PM BST). First messages are audited to prevent sharing
                        contact details or non-consensual advice.
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-surface-container-lowest rounded-full h-1.5 overflow-hidden">
                    <div className="bg-secondary h-1.5 rounded-full w-[65%]" />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-semibold text-on-secondary-fixed-variant pt-0.5">
                    <span>Submitted 12 mins ago</span>
                    <span>Audit Queue #4</span>
                  </div>
                </div>

                {/* Message Exchange Preview Box */}
                <div className="p-5 rounded-xl bg-surface-container space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-on-surface-variant font-medium">
                      Draft Introductions
                    </span>
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">lock</span> Read-only
                      until approved
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm space-y-1">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                      <span className="font-medium text-primary">You (Anisur)</span>
                      <span>Today, 3:15 PM</span>
                    </div>
                    <p className="text-[15px] text-on-surface leading-relaxed bangla-text">
                      &ldquo;ভাইয়া, সেকেন্ড টাইম প্রিপারেশন নিচ্ছি। বাড়ির সবাই আশা ছেড়ে দিয়েছে।
                      সারাদিন পড়ার টেবিলে বসে থাকলে দমবন্ধ লাগে। কী করব বুঝতে পারছি না...&rdquo;
                    </p>
                  </div>
                </div>

                {/* Safety & Boundary Protocol */}
                <div className="p-5 rounded-2xl bg-surface-container-low space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-xl text-tertiary-container">
                      shield_with_heart
                    </span>
                    <span className="text-[18px] font-semibold text-primary">
                      Safety &amp; Boundary Protocol
                    </span>
                  </div>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed">
                    Remember:{' '}
                    <strong>
                      Do not share personal phone numbers, bKash/Nagad accounts, or National IDs
                    </strong>
                    . Peer supporters offer empathy and perspective, not professional therapy or
                    financial assistance.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEndModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-surface-container-highest text-secondary text-[12px] font-medium hover:bg-error-container hover:text-on-error-container transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">block</span>
                      Block &amp; End Connection
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant text-[12px] font-medium hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base text-secondary">
                        flag
                      </span>
                      Report Supporter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Inline Visual: Peer Process Micro-Visualization */}
            <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[18px] font-semibold text-primary">
                  Peer Verification Pipeline
                </span>
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  Confidential • Zero Log
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-bold">
                      1
                    </span>
                    <span className="material-symbols-outlined text-sm text-tertiary-container">
                      done
                    </span>
                  </div>
                  <span className="text-[12px] text-primary font-semibold">
                    Matched on Stresses
                  </span>
                  <p className="text-[13px] text-on-surface-variant mt-1">
                    Matched with senior from same track.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary-fixed/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    <span className="material-symbols-outlined text-sm text-secondary animate-pulse">
                      hourglass_top
                    </span>
                  </div>
                  <span className="text-[12px] text-on-secondary-fixed font-semibold">
                    Human Review
                  </span>
                  <p className="text-[13px] text-on-secondary-fixed-variant mt-1">
                    Intro safety screen in progress.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col justify-between opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant text-xs flex items-center justify-center font-bold">
                      3
                    </span>
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">
                      lock_open
                    </span>
                  </div>
                  <span className="text-[12px] text-primary font-semibold">Live Async Chat</span>
                  <p className="text-[13px] text-on-surface-variant mt-1">
                    Direct safe messaging opened.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Request Card, Topics & Peer Directory (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest block">
                  New Request
                </span>
                <h2 className="text-[22px] font-semibold text-primary">Academic Transitions</h2>
              </div>
              <span className="text-[11px] font-semibold text-secondary">Voluntary Network</span>
            </div>

            {/* Request New Peer Match Card */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 lg:p-7 shadow-sm space-y-6">
              <div className="space-y-2">
                <h3 className="text-[18px] font-semibold text-primary">Request a New Supporter</h3>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  Facing distinct challenges? Select your core pressure point to match with a
                  vetted alumnus who experienced the same.
                </p>
              </div>

              <div className="space-y-3">
                <span className="block text-[12px] text-primary font-medium bangla-text">
                  Select Primary Context / সমস্যা নির্বাচন করুন
                </span>

                {ACADEMIC_TOPICS.map((topic) => {
                  const checked = selectedTopic === topic.id;
                  return (
                    <label
                      key={topic.id}
                      className={`flex items-start gap-3.5 p-3.5 rounded-xl cursor-pointer transition-all ${
                        checked
                          ? 'bg-surface-container hover:bg-surface-container-high'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="radio"
                        name="academic-topic"
                        value={topic.id}
                        checked={checked}
                        onChange={() => setSelectedTopic(topic.id)}
                        className="mt-1 accent-tertiary-container"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[14px] text-primary font-semibold">
                            {topic.title}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant bangla-text shrink-0">
                            {topic.banglaTag}
                          </span>
                        </div>
                        <p className="text-[13px] text-on-surface-variant">{topic.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <div className="flex items-center gap-2 text-primary text-[12px] font-semibold">
                  <span className="material-symbols-outlined text-base text-secondary">schedule</span>
                  <span>Expectation Agreement</span>
                </div>
                <p className="text-[13px] text-on-surface-variant leading-relaxed">
                  Supporters volunteer their lived experience asynchronously. Average response time:{' '}
                  <strong>2–4 hours</strong>. There are no 24/7 immediate crisis guarantees.
                </p>
              </div>

              <button
                type="button"
                disabled={requestStatus === 'matching'}
                onClick={handleRequestPeer}
                className="w-full py-3.5 px-4 rounded-xl bg-primary text-on-primary text-[14px] font-semibold hover:bg-primary-container transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-75"
              >
                <span
                  className={`material-symbols-outlined text-lg ${
                    requestStatus === 'matching' ? 'animate-spin' : ''
                  }`}
                >
                  {requestStatus === 'matching'
                    ? 'refresh'
                    : requestStatus === 'queued'
                    ? 'check'
                    : 'person_add'}
                </span>
                <span>
                  {requestStatus === 'matching'
                    ? 'Matching Peer...'
                    : requestStatus === 'queued'
                    ? 'Request In Queue'
                    : 'Request New Peer Supporter'}
                </span>
              </button>
            </div>

            {/* Available Peer Supporters Directory */}
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-semibold text-primary">Vetted Pool Directory</h3>
                <span className="text-[11px] font-semibold text-on-surface-variant">8 Online</span>
              </div>

              <div className="space-y-3">
                {PEER_SUPPORTERS.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bangla-text shrink-0 ${
                          peer.avatarTone === 'secondary'
                            ? 'bg-secondary-fixed text-on-secondary-fixed'
                            : peer.avatarTone === 'primary'
                            ? 'bg-primary-container text-on-primary'
                            : 'bg-surface-container-highest text-primary'
                        }`}
                      >
                        {peer.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] text-primary font-medium">{peer.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{peer.track}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSupporter(peer)}
                      aria-label={`View details for ${peer.name}`}
                      className="px-3 py-1.5 rounded-lg bg-surface text-primary text-[11px] font-semibold shadow-xs hover:bg-surface-container transition-colors shrink-0"
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Crisis Escalation Micro-Card */}
            <div className="p-5 rounded-2xl bg-secondary-fixed/30 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-secondary uppercase">
                  Emergency Alert
                </span>
                <p className="text-[13px] text-on-surface leading-snug">
                  If thoughts of self-harm or panic become intolerable, connect with the trained
                  mental health helpline immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('crisis-resources')}
                className="px-3 py-2 rounded-xl bg-secondary text-on-secondary text-[11px] font-semibold shrink-0 shadow-sm flex items-center gap-1 hover:bg-on-secondary-fixed-variant transition-colors"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                Kaan Pete Roi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Safety & Guidelines Modal */}
      {guidelinesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                  <span className="material-symbols-outlined text-xl">verified_user</span>
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-primary">Safe Haven Guidelines</h3>
                  <span className="text-[11px] text-on-surface-variant">
                    SHONGI Peer Pilot Agreement
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuidelinesOpen(false)}
                aria-label="Close Safe Haven Guidelines"
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 text-[13px] text-on-surface-variant max-h-96 overflow-y-auto pr-1">
              <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1">
                <h4 className="text-[12px] text-primary font-semibold">
                  1. Zero External Contact Sharing
                </h4>
                <p>
                  Do not exchange WhatsApp, phone numbers, Facebook profile links, or financial
                  handles. All dialogues remain on this platform under encrypted pseudonymity.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1">
                <h4 className="text-[12px] text-primary font-semibold">
                  2. Respectful Listening Over Prescriptions
                </h4>
                <p>
                  Supporters are not doctors. They do not recommend pharmaceuticals or offer medical
                  diagnoses. Their role is compassionate shared reflection.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1">
                <h4 className="text-[12px] text-primary font-semibold">
                  3. Voluntary &amp; Zero-Penalty Exit
                </h4>
                <p>
                  You or your peer can disconnect at any point without explanation. Your emotional
                  comfort is unconditionally prioritized.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setGuidelinesOpen(false);
                showToast('Safety guidelines acknowledged.');
              }}
              className="w-full py-3 rounded-xl bg-primary text-on-primary text-[12px] font-semibold hover:bg-primary-container transition-colors"
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Report Supporter Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 lg:p-7 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-2xl">flag</span>
                <h3 className="text-[18px] font-semibold text-primary">Report Peer Supporter</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                aria-label="Close report modal"
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-[13px] text-on-surface-variant">
              Your report is strictly confidential. Tanvir will not be notified of who initiated
              this. What happened?
            </p>

            <div className="space-y-2">
              {[
                {
                  val: 'unsolicited-contact',
                  label: 'Asked for personal contacts or bKash',
                },
                {
                  val: 'judgmental',
                  label: 'Unsupportive or judgmental remarks',
                },
                {
                  val: 'other',
                  label: 'Other boundary violation',
                },
              ].map((item) => (
                <label
                  key={item.val}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container cursor-pointer"
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={item.val}
                    checked={reportReason === item.val}
                    onChange={() => setReportReason(item.val)}
                    className="accent-secondary"
                  />
                  <span className="text-[12px] text-on-surface">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReportModalOpen(false);
                  showToast('Report submitted confidentially to SHONGI moderators.');
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary text-[12px] font-semibold hover:bg-on-secondary-fixed-variant transition-colors"
              >
                Submit Confidential Report
              </button>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-3 rounded-xl bg-surface-container text-on-surface text-[12px] hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Block & End Connection Modal */}
      {endModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 lg:p-7 space-y-5 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">block</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-[18px] font-semibold text-primary">
                End Connection with Tanvir?
              </h3>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">
                This will immediately close this peer bridge and purge pending intro messages. You
                can request another supporter anytime without any penalty.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEndModalOpen(false);
                  setConnectionEnded(true);
                  showToast('Connection ended safely. Messages purged.');
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary text-[12px] font-semibold hover:bg-on-secondary-fixed-variant transition-colors"
              >
                Yes, Disconnect
              </button>
              <button
                type="button"
                onClick={() => setEndModalOpen(false)}
                className="px-4 py-3 rounded-xl bg-surface-container text-on-surface text-[12px] hover:bg-surface-container-high transition-colors"
              >
                Stay Connected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Vetted Supporter Details */}
      {selectedSupporter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-semibold bangla-text">
                  {selectedSupporter.initials}
                </div>
                <div>
                  <h3 className="text-[17px] font-semibold text-primary">
                    {selectedSupporter.name}
                  </h3>
                  <span className="text-[12px] text-on-surface-variant">
                    Avg. response {selectedSupporter.responseTime}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupporter(null)}
                aria-label="Close supporter details"
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-[13px] text-on-surface-variant">{selectedSupporter.summary}</p>
            <div className="p-3.5 rounded-xl bg-surface-container-low text-[13px] italic text-on-surface bangla-text">
              &ldquo;{selectedSupporter.story}&rdquo;
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedSupporter.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-surface-container text-[11px] font-medium text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const name = selectedSupporter.name;
                setSelectedSupporter(null);
                setRequestStatus('queued');
                showToast(`Intro request queued for ${name}.`);
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary text-[13px] font-semibold hover:bg-primary-container"
            >
              Request Introduction
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-primary text-on-primary text-[12px] font-medium shadow-xl flex items-center gap-2 z-50">
          <span className="material-symbols-outlined text-tertiary-fixed text-lg">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
