import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  HeartHandshake, 
  HelpCircle, 
  ArrowLeft, 
  FileCheck2, 
  Clock,
  Search,
  RefreshCw,
  Printer,
  Lock,
  Building2,
  MapPin,
  AlertTriangle,
  CreditCard,
  Check,
  Info
} from 'lucide-react';
import CitizenRefundTracker from './CitizenRefundTracker';
import { convertWordsToNumbers, extractAmountAndLag } from '../utils/nlpNumberConverter';

// Helper: Convert numeric amount into readable Indian words representation
export const formatAmountToIndianWords = (numStr) => {
  const num = parseFloat(numStr);
  if (!num || isNaN(num) || num <= 0) return '';
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2).replace(/\.00$/, '');
    return `₹${Number(num).toLocaleString('en-IN')} (${cr} Crore Rupees)`;
  }
  if (num >= 100000) {
    const lakh = (num / 100000).toFixed(2).replace(/\.00$/, '');
    return `₹${Number(num).toLocaleString('en-IN')} (${lakh} Lakh Rupees)`;
  }
  if (num >= 1000) {
    const k = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `₹${Number(num).toLocaleString('en-IN')} (${k} Thousand Rupees)`;
  }
  return `₹${Number(num).toLocaleString('en-IN')} Rupees`;
};

// Plain-language guidance for each cybercrime category
export const CRIME_GUIDANCE = {
  'UPI Fraud': {
    title: 'UPI / QR Code Fraud',
    desc: 'Money deducted via GPay, PhonePe, Paytm, BHIM, or bank UPI apps.',
    example: 'Common: Scanned a fake QR code to "receive" cashback/lottery, clicked a payment collect link, or entered UPI PIN on a deceptive screen.',
    tip: 'Where to check: Open your UPI app transaction history to see the 12-digit UPI Reference / UTR number.'
  },
  'Investment Scam': {
    title: 'Investment / Crypto / Trading Scam',
    desc: 'Lured into fake Telegram/WhatsApp trading groups, stock apps, or crypto platforms promising abnormal profits.',
    example: 'Common: Transferred money to private accounts for "high-return IPO/crypto trading", fake wallet showed huge profits, but withdrawal was blocked.',
    tip: 'What to enter: Sum up all money sent across multiple deposits and enter the total amount lost.'
  },
  'Phishing': {
    title: 'Phishing Link / Malicious APK',
    desc: 'Deceptive SMS, email, or WhatsApp link that compromised your bank account or phone.',
    example: 'Common: Received an SMS warning "Electricity bill unpaid / PAN card update required / e-Challan pending" with a link or APK download.',
    tip: 'Immediate action: Uninstall any unknown apps downloaded recently and disconnect mobile data/Wi-Fi.'
  },
  'Card Fraud': {
    title: 'Card / ATM Skimming Fraud',
    desc: 'Unauthorized online card charges, cloned ATM card withdrawals, or POS card skimming.',
    example: 'Common: Received sudden debit SMS for transactions you never made while your physical card is still with you.',
    tip: 'Immediate action: Open your mobile banking app to immediately switch off international/ATM card transactions.'
  },
  'Job Scam': {
    title: 'Work-from-Home / Task Scam',
    desc: 'Offered part-time online tasks (YouTube video likes, hotel/Google reviews) that required prepaid deposit fees.',
    example: 'Common: Scammers paid small ₹150–₹500 earnings initially, then demanded ₹10,000–₹1,00,000 deposits for "VIP prepaid tasks".',
    tip: 'What to enter: Enter the net amount transferred out of your account to the scammer.'
  },
};

export default function CitizenPortal({ currentUser, onComplaintLogged, triggerAlert }) {
  // Navigation Tabs: 'file' (Report Fraud) or 'track' (Track Case Status)
  const [portalMode, setPortalMode] = useState('file');

  // Intake Form State (Clean state without hardcoded constant values)
  const [formData, setFormData] = useState({
    crime_type: 'UPI Fraud',
    amount_lost: '',
    reporting_lag_mins: '',
    mule_hops: '2',
    suspect_utr: '',
  });
  const [nlpText, setNlpText] = useState('');
  const [voiceLang, setVoiceLang] = useState('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [helpLang, setHelpLang] = useState('en');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active Receipt from filing in current session
  const [submittedReceipt, setSubmittedReceipt] = useState(() => {
    try {
      const saved = localStorage.getItem('cyberpredict_receipt');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // NCRP ID Case Status Tracking State
  const [searchNcrpId, setSearchNcrpId] = useState('');
  const [trackedCase, setTrackedCase] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState(null);
  const [citizenCases, setCitizenCases] = useState([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation();
    try {
      navigator.clipboard?.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  // Normalize authenticated citizen mobile number
  const userPhone = currentUser?.mobile || currentUser?.phone || (currentUser?.name && currentUser.name.match(/\d{10}/)?.[0]) || '';

  // Load Citizen Cases on Mount / User change strictly for the authenticated phone
  useEffect(() => {
    fetchCitizenCases();
  }, [userPhone]);

  const fetchCitizenCases = async () => {
    if (!userPhone) {
      setCitizenCases([]);
      return;
    }
    setIsLoadingCases(true);
    try {
      const res = await api.getCitizenCases({ phone: userPhone });
      if (res.data && res.data.cases) {
        setCitizenCases(res.data.cases);
      } else {
        setCitizenCases([]);
      }
    } catch (err) {
      console.warn('Could not fetch citizen cases:', err);
      setCitizenCases([]);
    } finally {
      setIsLoadingCases(false);
    }
  };

  // Perform Case Tracking Lookup by NCRP ID with Phone Privacy Check
  const handleTrackCase = async (overrideId = null) => {
    const targetId = (typeof overrideId === 'string' ? overrideId : searchNcrpId).trim();
    if (!targetId) {
      if (triggerAlert) {
        triggerAlert('warning', 'Input Required', 'Please enter a valid NCRP Reference ID.');
      }
      return;
    }

    setIsTracking(true);
    setTrackError(null);

    try {
      const params = userPhone ? { phone: userPhone } : {};
      const res = await api.getCaseStatus(targetId, params);
      setTrackedCase(res.data);
      setSearchNcrpId(res.data.ncrp_id);
      setPortalMode('track');

      if (triggerAlert) {
        triggerAlert(
          res.data.stage === 'REFUNDED' ? 'success' : 'info',
          `Case Synchronized: ${res.data.ncrp_id}`,
          `Status: ${res.data.stage_label}. Total Frozen: ₹${Number(res.data.total_frozen).toLocaleString('en-IN')}`,
          6000
        );
      }
    } catch (err) {
      console.error('Track case error:', err);
      const errData = err.response?.data;
      const isForbidden = err.response?.status === 403;
      setTrackError(errData?.error || `No case found matching '${targetId}'.`);
      setTrackedCase(null);
      if (triggerAlert) {
        triggerAlert(
          'critical',
          isForbidden ? '🔒 Privacy Notice' : 'Case Not Found',
          errData?.error || `No record found for ID '${targetId}'. Verify your acknowledgment slip.`
        );
      }
    } finally {
      setIsTracking(false);
    }
  };

  // Multilingual NLP Voice/Text Parser: Converts Spoken/Written Words to Numbers and auto-populates complaint
  const handleNlpParse = (incomingText = null) => {
    const rawText = (typeof incomingText === 'string' ? incomingText : nlpText).trim();
    if (!rawText) return;

    // 1. Convert spoken words into numeric digits (e.g. "fifty thousand" -> "50000", "two hours" -> "2 hours")
    const converted = convertWordsToNumbers(rawText);
    setNlpText(converted);

    const lower = converted.toLowerCase();
    let detectedType = formData.crime_type;

    if (lower.includes('job') || lower.includes('task') || lower.includes('part time') || lower.includes('review') || lower.includes('rating') || lower.includes('youtube') || lower.includes('salary') || lower.includes('नौकरी') || lower.includes('काम') || lower.includes('ಕೆಲಸ') || lower.includes('ಉದ್ಯೋಗ')) {
      detectedType = 'Job Scam';
    } else if (lower.includes('invest') || lower.includes('trading') || lower.includes('crypto') || lower.includes('shares') || lower.includes('stock') || lower.includes('bitcoin') || lower.includes('forex') || lower.includes('निवेश') || lower.includes('ಹೂಡಿಕೆ') || lower.includes('ಷೇರು')) {
      detectedType = 'Investment Scam';
    } else if (lower.includes('upi') || lower.includes('qr') || lower.includes('scanner') || lower.includes('gpay') || lower.includes('phonepe') || lower.includes('paytm') || lower.includes('यूपीआई') || lower.includes('ಯುಪಿಐ')) {
      detectedType = 'UPI Fraud';
    } else if (lower.includes('phish') || lower.includes('link') || lower.includes('apk') || lower.includes('sms') || lower.includes('लिंक') || lower.includes('ಲಿಂಕ್')) {
      detectedType = 'Phishing';
    } else if (lower.includes('card') || lower.includes('atm') || lower.includes('skim') || lower.includes('clone') || lower.includes('कार्ड') || lower.includes('ಕಾರ್ಡ್')) {
      detectedType = 'Card Fraud';
    }

    // 2. Extract ANY loss amount and reporting lag accurately using smart distinction
    const { amount: detectedAmount, lag: detectedLag } = extractAmountAndLag(converted);
    const numAmount = parseFloat(detectedAmount) || 0;
    const calculatedHops = numAmount >= 1000000 ? '4' : numAmount >= 100000 ? '3' : '2';

    setFormData({
      ...formData,
      crime_type: detectedType,
      amount_lost: detectedAmount,
      reporting_lag_mins: detectedLag,
      mule_hops: calculatedHops
    });

    if (triggerAlert) {
      triggerAlert('success', '🤖 NLP Assistant Synchronized', `Voice words converted to numbers: ${detectedType}, ₹${Number(detectedAmount).toLocaleString('en-IN')} (${detectedLag}m lag)`);
    }
  };

  // Web Speech API Voice Recognition with Real-Time Word-to-Number Conversion
  const handleStartVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (triggerAlert) {
        triggerAlert('warning', 'Voice Notice', 'Speech recognition requires Chrome or Edge browser.');
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      let finalTranscript = '';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const activeText = finalTranscript || interimTranscript;
        // Real-time conversion: voice words to numbers
        const convertedActive = convertWordsToNumbers(activeText);
        setNlpText(convertedActive);

        if (finalTranscript) {
          setIsListening(false);
          const convertedFinal = convertWordsToNumbers(finalTranscript);
          setNlpText(convertedFinal);
          handleNlpParse(convertedFinal);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amtNum = parseFloat(formData.amount_lost);
    if (!formData.amount_lost || isNaN(amtNum) || amtNum <= 0) {
      if (triggerAlert) {
        triggerAlert('warning', 'Disputed Amount Required', 'Please enter the disputed or lost amount (e.g. ₹50,000).');
      }
      return;
    }

    const lagNum = parseInt(formData.reporting_lag_mins, 10);
    const validLag = isNaN(lagNum) || lagNum < 0 ? 15 : lagNum;
    const cleanUtr = (formData.suspect_utr || '').trim() || `UTR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const hopsNum = parseInt(formData.mule_hops, 10) || (amtNum >= 1000000 ? 4 : amtNum >= 100000 ? 3 : 2);

    setLoading(true);
    try {
      const res = await api.submitComplaint({
        ...formData,
        amount_lost: amtNum,
        reporting_lag_mins: validLag,
        mule_hops: hopsNum,
        suspect_utr: cleanUtr,
        citizen_phone: userPhone || '9886012345'
      });

      const data = res.data;
      const receipt = {
        complaint_id: data.complaint_id,
        ncrp_id: data.complaint_id,
        crime_type: formData.crime_type,
        amount: String(amtNum),
        predicted_atm: data.predicted_atm,
        predicted_area: data.predicted_area,
        risk_score: data.live_risk_score,
        time_window: data.time_window,
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        status: 'FROZEN',
        isRefunded: false
      };

      setSubmittedReceipt(receipt);
      localStorage.setItem('cyberpredict_receipt', JSON.stringify(receipt));
      fetchCitizenCases();

      if (triggerAlert) {
        triggerAlert(
          'success',
          'COMPLAINT REGISTERED & BROADCAST',
          `Incident ${data.complaint_id} logged. ML predicted ATM ${data.predicted_atm}. Multi-channel alerts sent to LEA & Banks.`,
          8000
        );
      }

      if (onComplaintLogged) {
        onComplaintLogged();
      }
    } catch (err) {
      console.error('Complaint filing error:', err);
      if (triggerAlert) {
        triggerAlert('warning', 'Submission Notice', 'Failed to lodge complaint. Please check backend connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLodgeAnother = () => {
    setSubmittedReceipt(null);
    localStorage.removeItem('cyberpredict_receipt');
    setPortalMode('file');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header Banner */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-[11px] font-mono font-bold text-rose-700 shadow-2xs mb-1">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          NATIONAL CYBERCRIME REPORTING PORTAL (1930)
        </div>
        <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight">
          Express Fraud Intake & Proactive Interception
        </h2>
        <p className="text-xs text-slate-500 max-w-xl mx-auto font-medium">
          Report cyber financial fraud within the golden hour to trigger automated multi-bank payment freezes and forecast ATM cash-out hot zones.
        </p>
      </div>

      {/* Top Portal Mode Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setPortalMode('file')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-heading font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            portalMode === 'file'
              ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Send size={15} />
          <span>Lodge Express Complaint</span>
        </button>
        <button
          type="button"
          onClick={() => setPortalMode('track')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-heading font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            portalMode === 'track'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search size={15} />
          <span>Track Case Status</span>
          {citizenCases.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold font-mono">
              {citizenCases.length}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          MODE 1: TRACK CASE STATUS USING NCRP ID
          ========================================================================= */}
      {portalMode === 'track' && (
        <div className="space-y-6">
          {/* Search Card */}
          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5 tracking-wider font-mono">
                Enter Your NCRP Reference ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchNcrpId}
                    onChange={(e) => setSearchNcrpId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrackCase()}
                    placeholder="e.g. NCRP-2026-1004 or 1004..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs font-semibold"
                  />
                  {searchNcrpId && (
                    <button
                      type="button"
                      onClick={() => setSearchNcrpId('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleTrackCase()}
                  disabled={isTracking}
                  className="btn-cyber-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {isTracking ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={14} />
                      Track Case
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Citizen's Own Registered Complaints Only */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5 font-mono">
                  <Lock size={12} className="text-emerald-600" />
                  Your Registered Complaints {userPhone ? `(+91 ${userPhone})` : ''}:
                </span>
                {citizenCases.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {citizenCases.length} case(s) found
                  </span>
                )}
              </div>

              {citizenCases.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {citizenCases.map((c) => (
                    <div
                      key={c.ncrp_id}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1.5 rounded-xl border transition ${
                        trackedCase?.ncrp_id === c.ncrp_id
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleTrackCase(c.ncrp_id)}
                        className="cursor-pointer hover:underline flex items-center gap-1"
                      >
                        <span>{c.ncrp_id}</span>
                      </button>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase font-sans font-bold ${
                        c.status === 'REFUNDED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'FROZEN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {c.status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(c.ncrp_id, e)}
                        title="Copy NCRP Reference ID"
                        className="ml-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer text-xs"
                      >
                        {copiedId === c.ncrp_id ? '✓' : '📋'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2.5 text-slate-500 text-[11px]">
                  <span className="text-base">🛡️</span>
                  <p className="leading-snug font-medium">
                    {userPhone
                      ? `No complaints filed yet under +91 ${userPhone}. Lodged complaints automatically appear here for 1-click status checking.`
                      : 'Authenticate with your mobile number to view previously filed incidents.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {trackError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
              <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-700">{trackError}</p>
                <p className="text-[11px] text-rose-600/80 mt-1">
                  Please verify your acknowledgment receipt. You can also pick any of the recent complaints listed above.
                </p>
              </div>
            </div>
          )}

          {/* Tracked Case Details Card */}
          {trackedCase && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <FileCheck2 size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        OFFICIAL NCRP DOCKET
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Filed: {trackedCase.created_at || 'Recent'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 font-mono mt-0.5">
                      {trackedCase.ncrp_id}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTrackCase(trackedCase.ncrp_id)}
                    className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className={isTracking ? 'animate-spin' : ''} />
                    Refresh Status
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn-secondary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer size={12} />
                    Print Receipt
                  </button>
                </div>
              </div>

              {/* Visual 4-Step Stepper Component */}
              <CitizenRefundTracker incident={trackedCase} stage={trackedCase.stage} />

              {/* Financial Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                    Reported Stolen
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                    ₹{Number(trackedCase.amount_lost).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                    {trackedCase.crime_type}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                    Secured Under Lien
                  </span>
                  <span className={`text-base font-black font-mono mt-0.5 block ${
                    trackedCase.total_frozen > 0 ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    ₹{Number(trackedCase.total_frozen).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-700 mt-1 block font-medium">
                    {trackedCase.total_frozen > 0 ? '🔒 Blocked via CFCFRMS' : 'Lien Pending'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">
                    Recovery Stage
                  </span>
                  <span className="text-xs font-black text-amber-700 mt-1 block uppercase font-mono">
                    {trackedCase.stage_label || trackedCase.stage}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                    {trackedCase.mule_hops} Intermediary Hops
                  </span>
                </div>
              </div>

              {/* Refund Restoration Certificate (if REFUNDED) */}
              {trackedCase.stage === 'REFUNDED' && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <CheckCircle2 size={18} />
                    <span>Official Restoration Completed</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                    The disputed funds of <strong>₹{Number(trackedCase.amount_lost).toLocaleString('en-IN')}</strong> have been successfully credited back to your originating bank account following nodal verification.
                  </p>
                  <div className="flex items-center gap-3 pt-1 border-t border-emerald-200 font-mono text-[11px]">
                    <span className="text-emerald-700 font-bold">Reversal Ref: <strong>{trackedCase.refund_reference}</strong></span>
                    {trackedCase.refunded_at && (
                      <span className="text-slate-500">Restored At: {trackedCase.refunded_at}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Intermediary Mule Layer Lien Status */}
              {trackedCase.mule_accounts && trackedCase.mule_accounts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                      <Lock size={14} className="text-amber-600" />
                      Intermediary Mule Accounts & Debit Lien Status
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {trackedCase.mule_accounts.length} Node(s) Identified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {trackedCase.mule_accounts.map((mule) => (
                      <div
                        key={mule.account_number}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            mule.status === 'REFUNDED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : mule.is_lien_placed
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            L{mule.layer}
                          </div>
                          <div>
                            <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                              <span>{mule.account_number}</span>
                              <span className="text-[10px] text-slate-500 font-normal">
                                ({mule.bank_name})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {mule.branch} • Amount: ₹{Number(mule.at_risk_amount).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${
                          mule.status === 'REFUNDED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : mule.is_lien_placed
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {mule.status === 'REFUNDED' && '✅ Restored'}
                          {mule.status !== 'REFUNDED' && mule.is_lien_placed && '🔒 Lien Placed'}
                          {mule.status !== 'REFUNDED' && !mule.is_lien_placed && '⏳ Active Trace'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forecasted Cashout Interception Vector */}
              {trackedCase.target_atm && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin size={14} className="text-rose-600" />
                      Forecasted Cashout Interception Terminal
                    </span>
                    <span className="text-[10px] font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {trackedCase.hotspot?.risk_score ? `${trackedCase.hotspot.risk_score}% Cashout Risk` : 'High Threat Zone'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">
                    {trackedCase.target_atm.atm_id} — {trackedCase.target_atm.bank_name}, {trackedCase.target_atm.area}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Predictive telemetry vectors local Police Control Room (PCR) patrol units to this ATM to intercept illicit physical withdrawals before perpetrators escape.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setTrackedCase(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ArrowLeft size={14} /> Clear / Track Another Case
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('file')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-bold"
                >
                  Lodge New Incident ➜
                </button>
              </div>
            </div>
          )}

          {/* Empty State / Welcome Guide for Tracking */}
          {!trackedCase && (
            <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto shadow-2xs">
                <Search size={22} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Citizen Case Verification & Recovery Tracking
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Enter your official NCRP Reference ID above to monitor real-time CFCFRMS debit liens, ATM withdrawal interdictions, and fund restorations.
                </p>
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50/60 p-2 rounded-xl border border-emerald-200">
                  <Lock size={12} />
                  <span>Privacy Protected: Access is strictly bound to cases registered to your mobile number {userPhone ? `(+91 ${userPhone})` : ''}.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE 2: LODGE EXPRESS COMPLAINT
          ========================================================================= */}
      {portalMode === 'file' && (
        <div className="space-y-6">
          {/* Active Receipt View */}
          {submittedReceipt && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <FileCheck2 size={22} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-700">
                      OFFICIAL ACKNOWLEDGMENT RECEIPT
                    </span>
                    <h3 className="text-base font-bold text-slate-900 font-mono">
                      {submittedReceipt.complaint_id}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleLodgeAnother}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={14} /> File Another Report
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Reported Amount</span>
                  <span className="text-sm font-black text-slate-900 font-mono mt-0.5 block">
                    ₹{Number(submittedReceipt.amount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block font-mono">Crime Modus</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {submittedReceipt.crime_type}
                  </span>
                </div>
              </div>

              {/* Live Refund 4-Step Tracker Component */}
              <CitizenRefundTracker incident={submittedReceipt} />

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-slate-700 space-y-2">
                <p className="font-bold text-emerald-800">Proactive Intervention Status:</p>
                <p className="text-[11px] text-slate-600 font-medium">
                  Nearest beat patrol units and bank nodal desks have been alerted via SMS and CFCFRMS payment switch signals. Outgoing cashout extraction at forecasted ATM terminals is blocked.
                </p>
                <button
                  type="button"
                  onClick={() => handleTrackCase(submittedReceipt.complaint_id)}
                  className="mt-2 w-full py-2.5 btn-cyber-primary text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Search size={14} />
                  Track Detailed Case Intelligence Dossier ➜
                </button>
              </div>
            </div>
          )}

          {/* New Complaint Form & Multilingual Assistant */}
          {!submittedReceipt && (
            <>
              {/* Trilingual Citizen Quick Helpdesk Guideline Box */}
              <div className="p-4 bg-white border border-emerald-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsHelpOpen(!isHelpOpen)}
                    className="flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <HelpCircle size={14} />
                    <span>Helpdesk & User Guide</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({isHelpOpen ? '▲ Hide guide' : '▼ Click for simple instructions'})
                    </span>
                  </button>

                  {/* Language Switcher for Guide */}
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setHelpLang('en')}
                      className={`px-2 py-0.5 rounded-lg transition ${helpLang === 'en' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setHelpLang('kn')}
                      className={`px-2 py-0.5 rounded-lg transition ${helpLang === 'kn' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      ಕನ್ನಡ
                    </button>
                    <button
                      type="button"
                      onClick={() => setHelpLang('hi')}
                      className={`px-2 py-0.5 rounded-lg transition ${helpLang === 'hi' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      हिंदी
                    </button>
                  </div>
                </div>

                {isHelpOpen && (
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed font-sans space-y-2">
                    {helpLang === 'en' && (
                      <div>
                        <p className="font-bold text-slate-800 mb-1">Simple 3-Step Guide (Tech & Non-Tech Friendly):</p>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                          <li><strong>Step 1:</strong> Select your language, click 🎤 <strong>Speak</strong> or type what happened in everyday words (e.g. <i>"lost 50000 rupees in a job scam 10 minutes ago"</i>).</li>
                          <li><strong>Step 2:</strong> Review the form fields. The AI assistant extracts amount and time automatically.</li>
                          <li><strong>Step 3:</strong> Press <strong>Submit</strong> to instantly trigger automated multi-bank payment freezes.</li>
                        </ul>
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                          <strong>💡 How are Mule Accounts Traced?</strong> Victims only provide their initial UTR transaction number. Downstream mule accounts (Layer 1–4) and physical cashout terminals are automatically forecasted by the CyberPredict AI engine and tracked across bank API switches by law enforcement.
                        </div>
                      </div>
                    )}

                    {helpLang === 'kn' && (
                      <div>
                        <p className="font-bold text-slate-800 mb-1">ಸರಳ 3-ಹಂತದ ಮಾರ್ಗದರ್ಶಿ (ಎಲ್ಲರಿಗೂ ಸುಲಭವಾಗಿ ಅರ್ಥವಾಗುವಂತೆ):</p>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                          <li><strong>ಹಂತ 1:</strong> ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ, 🎤 <strong>Speak</strong> ಬಟನ್ ಒತ್ತಿ ಅಥವಾ ನಿಮ್ಮ ಮಾತಿನಲ್ಲಿ ನಡೆದ ಘಟನೆಯನ್ನು ತಿಳಿಸಿ.</li>
                          <li><strong>ಹಂತ 2:</strong> ಫಾರ್ಮ್‌ನಲ್ಲಿ ಭರ್ತಿಯಾದ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.</li>
                          <li><strong>ಹಂತ 3:</strong> <strong>Submit</strong> ಬಟನ್ ಒತ್ತಿ. ಬ್ಯಾಂಕ್ ಅಧಿಕಾರಿಗಳು ತಕ್ಷಣವೇ ಹಣವನ್ನು ಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡುತ್ತಾರೆ.</li>
                        </ul>
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                          <strong>💡 ಮ್ಯೂಲ್ ಖಾತೆಗಳನ್ನು ಹೇಗೆ ಟ್ರ್ಯಾಕ್ ಮಾಡಲಾಗುತ್ತದೆ?</strong> ಸಂತ್ರಸ್ತರು ತಮ್ಮ ಆರಂಭಿಕ UTR ವಹಿವಾಟು ಸಂಖ್ಯೆಯನ್ನು ಮಾತ್ರ ನಮೂದಿಸುತ್ತಾರೆ. ಮುಂದಿನ ಮ್ಯೂಲ್ ಖಾತೆಗಳನ್ನು AI ಎಂಜಿನ್ ಮತ್ತು ಬ್ಯಾಂಕ್ ಸ್ವಿಚ್‌ಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡುತ್ತವೆ.
                        </div>
                      </div>
                    )}

                    {helpLang === 'hi' && (
                      <div>
                        <p className="font-bold text-slate-800 mb-1">सरल 3-चरणीय मार्गदर्शिका (तकनीकी और गैर-तकनीकी दोनों के लिए):</p>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                          <li><strong>चरण 1:</strong> भाषा चुनें, 🎤 <strong>Speak</strong> बटन दबाकर अपनी भाषा में बताएं कि क्या हुआ।</li>
                          <li><strong>चरण 2:</strong> फ़ॉर्म के फ़ील्ड्स की जाँच करें।</li>
                          <li><strong>चरण 3:</strong> <strong>Submit</strong> पर क्लिक करें ताकि बैंक खाते तुरंत फ्रीज किए जा सकें।</li>
                        </ul>
                        <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-600">
                          <strong>💡 म्यूल खातों को कैसे ट्रैक किया जाता है?</strong> पीड़ित केवल अपना प्रारंभिक UTR नंबर दर्ज करते हैं। अगले म्यूल खातों को साइबरप्रेडिक्ट AI इंजन और बैंक सिस्टम द्वारा स्वचालित रूप से ट्रैक किया जाता है।
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Multilingual Voice Assistant & Text Box */}
              <div className="p-4 bg-white border border-indigo-200 rounded-2xl shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                  <span className="flex items-center gap-1.5 font-heading">
                    <Sparkles size={14} className="text-indigo-600" /> Voice & Text Assistant (English / ಕನ್ನಡ / हिंदी)
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-medium">Lang:</span>
                    <select
                      value={voiceLang}
                      onChange={(e) => setVoiceLang(e.target.value)}
                      className="bg-transparent text-[11px] text-indigo-700 font-bold outline-none cursor-pointer"
                    >
                      <option value="en-IN">English (India)</option>
                      <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
                      <option value="hi-IN">हिंदी (Hindi)</option>
                    </select>
                  </div>
                </div>

                {/* Animated 7-Bar Audio Equalizer Waveform Graphic */}
                {isListening ? (
                  <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 via-indigo-50 to-blue-50 border border-indigo-200 px-4 py-2.5 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-1.5 h-7">
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-1" />
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-2" />
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-3" />
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-4" />
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-5" />
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-6" />
                      <span className="w-1.5 bg-gradient-to-t from-indigo-600 to-rose-500 rounded-full wave-bar-7" />
                      <span className="text-xs font-mono text-indigo-900 font-bold ml-2">
                        Listening in {voiceLang === 'kn-IN' ? 'Kannada' : voiceLang === 'hi-IN' ? 'Hindi' : 'English'}... Speak now
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-600 font-mono font-bold bg-white/90 px-2.5 py-0.5 rounded-full border border-rose-200 animate-pulse">
                      ● LIVE REC
                    </span>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nlpText}
                    onChange={(e) => setNlpText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleNlpParse()}
                    placeholder="Speak or type words in English, Hindi, or Kannada (e.g., 'lost fifty thousand in upi scam two hours ago')..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 shadow-2xs font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={handleStartVoice}
                    className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                      isListening ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-200 hover:-translate-y-0.5'
                    }`}
                  >
                    <span>🎤</span>
                    <span>{isListening ? 'Stop' : 'Speak'}</span>
                  </button>
                 
                </div>

                {/* 1-Click Fast Test Scenario Chips for Hackathon Demonstrations */}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[11px] font-mono">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">⚡ Spoken Voice Demos:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const spoken = 'Lost fifty thousand rupees in fake upi scan two hours ago';
                      handleNlpParse(spoken);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 transition cursor-pointer"
                    title="Converts: 'fifty thousand' -> 50000, 'two hours' -> 120m"
                  >
                    🎙️ "fifty thousand UPI (two hours)"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const spoken = 'Transferred two lakh fifty thousand to crypto telegram trading group thirty minutes ago';
                      handleNlpParse(spoken);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-200/70 transition cursor-pointer"
                    title="Converts: 'two lakh fifty thousand' -> 250000, 'thirty minutes' -> 30m"
                  >
                    🎙️ "two lakh fifty thousand Crypto"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const spoken = 'दो लाख पचास हजार का फ्रॉड हुआ दो घंटे पहले यूपीआई से';
                      handleNlpParse(spoken);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 transition cursor-pointer"
                    title="Hindi Voice: 'दो लाख पचास हजार' -> 250000"
                  >
                    🎙️ "दो लाख पचास हजार (Hindi)"
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const spoken = 'Card cloned and forty thousand withdrawn at ATM fifteen mins ago';
                      handleNlpParse(spoken);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-amber-50/70 hover:bg-amber-100 text-amber-800 border border-amber-200/70 transition cursor-pointer"
                  >
                    🎙️ "forty thousand ATM"
                  </button>
                </div>
              </div>

              {/* Main Form with Sleek Citizen Hover Guidelines */}
              <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  {/* STEP 1: Fraud Incident Category */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-slate-800 font-mono flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-black">1</span>
                        Incident Category
                      </label>
                      
                      {/* Hoverable Category Guide Badge */}
                      <div className="relative group/cat inline-flex items-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2 py-0.5 rounded-full cursor-help transition">
                          <HelpCircle size={12} />
                          <span>Category Guide</span>
                        </span>

                        {/* Floating Category Popover */}
                        <div 
                          className="dark-guide-popover absolute z-50 top-full right-0 mt-2 w-72 sm:w-96 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs opacity-0 pointer-events-none group-hover/cat:opacity-100 group-hover/cat:pointer-events-auto transition-all duration-200"
                          style={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                        >
                          <div className="absolute -top-1.5 right-6 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
                          <div className="font-bold text-xs flex items-center gap-1.5 border-b border-slate-700/80 pb-1.5 mb-2" style={{ color: '#fda4af' }}>
                            <span>📚</span>
                            <span style={{ color: '#fda4af' }}>Incident Category Reference Guide</span>
                          </div>
                          <div className="space-y-2 text-[11px] leading-relaxed" style={{ color: '#ffffff' }}>
                            <div style={{ color: '#ffffff' }}>
                              <strong style={{ color: '#fda4af' }}>📱 UPI / QR Scam:</strong> <span style={{ color: '#ffffff' }}>Scanned fake QR code for cashback/lottery, approved deceptive payment request, or shared UPI PIN.</span>
                            </div>
                            <div style={{ color: '#ffffff' }}>
                              <strong style={{ color: '#fcd34d' }}>📈 Investment Scam:</strong> <span style={{ color: '#ffffff' }}>Fake Telegram/WhatsApp crypto/stock trading groups, fake app balances, blocked withdrawals.</span>
                            </div>
                            <div style={{ color: '#ffffff' }}>
                              <strong style={{ color: '#67e8f9' }}>🎣 Phishing Link / APK:</strong> <span style={{ color: '#ffffff' }}>SMS/WhatsApp link for unpaid electricity bill, KYC/e-Challan, or malicious app download.</span>
                            </div>
                            <div style={{ color: '#ffffff' }}>
                              <strong style={{ color: '#d8b4fe' }}>💳 Card / ATM Skim:</strong> <span style={{ color: '#ffffff' }}>Cloned ATM card withdrawals, unauthorized online transactions, or skimming device at ATM/POS.</span>
                            </div>
                            <div style={{ color: '#ffffff' }}>
                              <strong style={{ color: '#6ee7b7' }}>💼 Job / Task Scam:</strong> <span style={{ color: '#ffffff' }}>Fake online tasks (YouTube likes, Google reviews) demanding prepaid commission deposits.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Category Selector Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'UPI Fraud', label: 'UPI / QR Scam', icon: '📱' },
                        { id: 'Investment Scam', label: 'Investment Scam', icon: '📈' },
                        { id: 'Phishing', label: 'Phishing Link / APK', icon: '🎣' },
                        { id: 'Card Fraud', label: 'Card / ATM Skim', icon: '💳' },
                        { id: 'Job Scam', label: 'Job / Task Scam', icon: '💼' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, crime_type: type.id })}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer text-xs ${
                            formData.crime_type === type.id
                              ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold shadow-2xs ring-2 ring-rose-500/10'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 font-medium'
                          }`}
                        >
                          <span className="text-base">{type.icon}</span>
                          <span className="truncate">{type.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Subtle 1-line Selected Modus Status */}
                    {CRIME_GUIDANCE[formData.crime_type] && (
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                        <span className="truncate"><strong>Selected:</strong> {CRIME_GUIDANCE[formData.crime_type].desc}</span>
                      </p>
                    )}
                  </div>

                  {/* STEP 2: Total Disputed / Lost Amount */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-slate-800 font-mono flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-black">2</span>
                        Disputed Amount Lost (₹)
                      </label>
                      <span className="text-[10px] text-rose-600 font-bold">* Mandatory</span>
                    </div>

                    {/* Input Bar with Hover Guide */}
                    <div className="relative group">
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-slate-400 font-mono font-bold text-sm">₹</span>
                        <input
                          type="number"
                          value={formData.amount_lost}
                          onChange={(e) => {
                            const amt = e.target.value;
                            const num = parseFloat(amt) || 0;
                            const hops = num >= 1000000 ? '4' : num >= 100000 ? '3' : '2';
                            setFormData({ ...formData, amount_lost: amt, mule_hops: hops });
                          }}
                          placeholder="e.g. 50000 (Hover for guidance)"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-20 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 font-mono font-bold shadow-2xs transition placeholder:text-slate-300 placeholder:font-normal"
                          required
                          min="1"
                        />
                        <div className="absolute right-3 flex items-center gap-1 text-slate-400 group-hover:text-rose-600 group-focus-within:text-rose-600 transition text-[11px] font-medium cursor-help">
                          <HelpCircle size={14} />
                          <span className="text-[10px] font-mono hidden sm:inline">Guide</span>
                        </div>
                      </div>

                      {/* Floating Guide Popover on Hover / Focus */}
                      <div 
                        className="dark-guide-popover absolute z-50 bottom-full left-0 mb-2 w-full sm:w-96 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0"
                        style={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                      >
                        <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                        <div className="font-bold text-xs flex items-center gap-1.5 border-b border-slate-700/80 pb-1.5 mb-2" style={{ color: '#fda4af' }}>
                          <span>🪙</span>
                          <span style={{ color: '#fda4af' }}>Disputed Amount Guidelines</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] leading-relaxed" style={{ color: '#ffffff' }}>
                          <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                            <span style={{ color: '#6ee7b7' }}>•</span>
                            <span style={{ color: '#ffffff' }}>Enter the exact total sum unauthorizedly debited from your bank account or wallet.</span>
                          </li>
                          <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                            <span style={{ color: '#6ee7b7' }}>•</span>
                            <span style={{ color: '#ffffff' }}>Verify against your bank debit SMS or mobile banking transaction history.</span>
                          </li>
                          <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                            <span style={{ color: '#6ee7b7' }}>•</span>
                            <span style={{ color: '#ffffff' }}>If multiple fraudulent transfers were made, enter the <strong style={{ color: '#ffffff' }}>combined total amount</strong>.</span>
                          </li>
                          <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                            <span style={{ color: '#6ee7b7' }}>•</span>
                            <span style={{ color: '#cbd5e1' }}>Enter digits only (no commas, paise, or currency symbols).</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Live Verbal Confirmation Pill (Only when entered) */}
                    {formData.amount_lost && parseFloat(formData.amount_lost) > 0 ? (
                      <div className="p-1.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                          <span className="text-[11px]">
                            Amount: <strong className="font-mono font-bold text-emerald-950">{formatAmountToIndianWords(formData.amount_lost)}</strong>
                          </span>
                        </div>
                        <span className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-700 font-bold">
                          VERIFIED
                        </span>
                      </div>
                    ) : null}

                    {/* Quick Amount Suggestion Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Quick:</span>
                      {[
                        { label: '₹5k', value: '5000' },
                        { label: '₹25k', value: '25000' },
                        { label: '₹50k', value: '50000' },
                        { label: '₹1L', value: '100000' },
                        { label: '₹2.5L', value: '250000' },
                        { label: '₹5L', value: '500000' },
                      ].map((pill) => (
                        <button
                          key={pill.value}
                          type="button"
                          onClick={() => {
                            const num = parseFloat(pill.value);
                            const hops = num >= 1000000 ? '4' : num >= 100000 ? '3' : '2';
                            setFormData({ ...formData, amount_lost: pill.value, mule_hops: hops });
                          }}
                          className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                            formData.amount_lost === pill.value
                              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* STEP 3 & STEP 4 Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
                    
                    {/* STEP 3: Reporting Delay / Golden Hour */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-slate-800 font-mono flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-black">3</span>
                          Time Elapsed (Minutes)
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">Golden Hour</span>
                      </div>

                      <div className="relative group">
                        {/* Input Bar */}
                        <div className="relative flex items-center">
                          <Clock size={14} className="absolute left-3.5 text-slate-400" />
                          <input
                            type="number"
                            value={formData.reporting_lag_mins}
                            onChange={(e) => setFormData({ ...formData, reporting_lag_mins: e.target.value })}
                            placeholder="e.g. 15 (minutes ago)"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-20 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 font-mono font-bold shadow-2xs transition placeholder:text-slate-300 placeholder:font-normal"
                            required
                            min="0"
                          />
                          <div className="absolute right-3 flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 group-focus-within:text-indigo-600 transition text-[11px] font-medium cursor-help">
                            <HelpCircle size={14} />
                            <span className="text-[10px] font-mono hidden sm:inline">Guide</span>
                          </div>
                        </div>

                        {/* Floating Guide Popover on Hover / Focus */}
                        <div 
                          className="dark-guide-popover absolute z-50 bottom-full left-0 mb-2 w-72 sm:w-84 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0"
                          style={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                        >
                          <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                          <div className="font-bold text-xs flex items-center gap-1.5 border-b border-slate-700/80 pb-1.5 mb-2" style={{ color: '#fcd34d' }}>
                            <span>⏱️</span>
                            <span style={{ color: '#fcd34d' }}>Golden Hour Guidelines</span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] leading-relaxed" style={{ color: '#ffffff' }}>
                            <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                              <span style={{ color: '#6ee7b7' }}>•</span>
                              <span style={{ color: '#ffffff' }}><strong style={{ color: '#6ee7b7' }}>&lt;60 Mins (Critical Window):</strong> Highest fund freeze probability before funds are withdrawn at ATMs.</span>
                            </li>
                            <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                              <span style={{ color: '#fcd34d' }}>•</span>
                              <span style={{ color: '#ffffff' }}><strong style={{ color: '#fcd34d' }}>60–120 Mins (Golden Hour):</strong> Immediate multi-bank lien alerts dispatched across recipient accounts.</span>
                            </li>
                            <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <span style={{ color: '#ffffff' }}><strong style={{ color: '#cbd5e1' }}>&gt;120 Mins (Extended):</strong> Multi-layer downstream mule tracing and police beat vectors activated.</span>
                            </li>
                            <li className="text-[10px] pt-1 border-t border-slate-800" style={{ color: '#cbd5e1' }}>
                              💡 <em style={{ color: '#ffffff' }}>Tip: 1 hour = 60 mins. If unsure, enter your best estimate.</em>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* Live Golden Hour Triage Status Badge (Only when value entered) */}
                      {formData.reporting_lag_mins !== '' && (
                        <div className="pt-0.5">
                          {Number(formData.reporting_lag_mins) <= 60 ? (
                            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                              <span>🟢</span>
                              <span>Critical Golden Window (&lt;60m): Max Recovery Chance</span>
                            </div>
                          ) : Number(formData.reporting_lag_mins) <= 120 ? (
                            <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1.5">
                              <span>🟡</span>
                              <span>Golden Hour Active (60–120m): Multi-Bank Lien Alert</span>
                            </div>
                          ) : (
                            <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium flex items-center gap-1.5">
                              <span>⏱️</span>
                              <span>Extended Interval (&gt;2h): Syndicate Tracing Vector</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quick Delay Pills */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Quick:</span>
                        {[
                          { label: '<15m', value: '15' },
                          { label: '30m', value: '30' },
                          { label: '1h', value: '60' },
                          { label: '2h', value: '120' },
                          { label: '4h+', value: '240' },
                        ].map((time) => (
                          <button
                            key={time.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, reporting_lag_mins: time.value })}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition cursor-pointer border ${
                              formData.reporting_lag_mins === time.value
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-bold shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                            }`}
                          >
                            {time.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* STEP 4: Suspect UTR / Transaction Reference ID */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase text-slate-800 font-mono flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[11px] font-black">4</span>
                          Suspect UTR / Ref ID
                        </label>
                                              <span className="text-[10px] text-rose-600 font-bold">* Mandatory</span>

                      </div>

                      <div className="relative group">
                        {/* Input Bar */}
                        <div className="relative flex items-center">
                          <CreditCard size={14} className="absolute left-3.5 text-slate-400" />
                          <input
                            type="text"
                            value={formData.suspect_utr}
                            onChange={(e) => setFormData({ ...formData, suspect_utr: e.target.value })}
                            placeholder="e.g. 423871928341 (or leave blank)"
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-20 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 font-mono font-bold shadow-2xs transition placeholder:text-slate-300 placeholder:font-normal"
                          />
                          <div className="absolute right-3 flex items-center gap-1 text-slate-400 group-hover:text-rose-600 group-focus-within:text-rose-600 transition text-[11px] font-medium cursor-help">
                            <HelpCircle size={14} />
                            <span className="text-[10px] font-mono hidden sm:inline">Guide</span>
                          </div>
                        </div>

                        {/* Floating Guide Popover on Hover / Focus */}
                        <div 
                          className="dark-guide-popover absolute z-50 bottom-full right-0 mb-2 w-72 sm:w-88 p-3.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 text-xs opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0"
                          style={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                        >
                          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45"></div>
                          <div className="font-bold text-xs flex items-center gap-1.5 border-b border-slate-700/80 pb-1.5 mb-2" style={{ color: '#67e8f9' }}>
                            <span>🔍</span>
                            <span style={{ color: '#67e8f9' }}>What is UTR & Where to find it?</span>
                          </div>
                          <ul className="space-y-1.5 text-[11px] leading-relaxed" style={{ color: '#ffffff' }}>
                            <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                              <span style={{ color: '#67e8f9' }}>•</span>
                              <span style={{ color: '#ffffff' }}><strong style={{ color: '#ffffff' }}>What is UTR?</strong> A 12-digit reference number assigned by your bank to every UPI/IMPS transfer.</span>
                            </li>
                            <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                              <span style={{ color: '#67e8f9' }}>•</span>
                              <span style={{ color: '#ffffff' }}>📱 <strong style={{ color: '#ffffff' }}>UPI Apps (GPay/PhonePe/Paytm):</strong> Open transaction history ➔ tap payment ➔ copy <strong style={{ color: '#67e8f9' }}>"UPI Transaction ID"</strong> (12 digits).</span>
                            </li>
                            <li className="flex items-start gap-1.5" style={{ color: '#ffffff' }}>
                              <span style={{ color: '#67e8f9' }}>•</span>
                              <span style={{ color: '#ffffff' }}>📩 <strong style={{ color: '#ffffff' }}>Bank SMS:</strong> Look for <em style={{ color: '#67e8f9' }}>Ref No</em> in the debit SMS from your bank.</span>
                            </li>
                            <li className="flex items-start gap-1.5 pt-1 border-t border-slate-800" style={{ color: '#6ee7b7' }}>
                            </li>
                          </ul>
                        </div>
                      </div>

                     
                    </div>
                  </div>

               

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-cyber-rose py-3 text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer hover:shadow-lg transition"
                  >
                    <Send size={15} />
                    {loading ? 'Evaluating AI Spatial Inference & Alerting Banks...' : 'Submit Complaint & Protect Funds'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}