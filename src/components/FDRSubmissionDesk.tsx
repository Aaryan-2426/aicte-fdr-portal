import React, { useState } from 'react';
import { FDRRecord, InstituteCategory, AICTERegion } from '../types/fdr';
import {
  calculateAPHNormRequiredFDR,
  validateIFSCCode,
  formatINR,
  detectFDRDiscrepancies,
} from '../utils/fdrEngine';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building,
  Landmark,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Scan,
  FileSearch,
  CheckCheck,
} from 'lucide-react';

interface FDRSubmissionDeskProps {
  onSubmitFDR: (newRecord: FDRRecord) => void;
  onCancel?: () => void;
}

export const FDRSubmissionDesk: React.FC<FDRSubmissionDeskProps> = ({ onSubmitFDR, onCancel }) => {
  // Step tracker (1: Institute & Purpose, 2: Instrument & Bank, 3: Documents, 4: Scrutiny Check)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Fields
  const [permanentInstituteId, setPermanentInstituteId] = useState('1-99881023');
  const [aicteApplicationNo, setAicteApplicationNo] = useState('1-4499102834');
  const [instituteName, setInstituteName] = useState('Apex National Institute of Technology & Research');
  const [category, setCategory] = useState<InstituteCategory>('Engineering & Technology');
  const [state, setState] = useState('Maharashtra');
  const [region, setRegion] = useState<AICTERegion>('Western (Mumbai)');
  const [isConcessionCategory, setIsConcessionCategory] = useState(false);
  const [purpose, setPurpose] = useState<
    | 'Establishment of New Technical Institution'
    | 'Introduction of New Course / Program'
    | 'Increase in Approved Intake'
    | 'Change of Site / Location'
    | 'Extension of Approval (EoA) Compliance'
  >('Establishment of New Technical Institution');

  // Instrument
  const [fdrNumber, setFdrNumber] = useState('FDR/SBI/MUM/2026/778901');
  const [bankName, setBankName] = useState('State Bank of India');
  const [branchName, setBranchName] = useState('Fort Commercial Branch, Mumbai');
  const [ifscCode, setIfscCode] = useState('SBIN0000300');
  const [fdrAmount, setFdrAmount] = useState<number>(3500000);
  const [interestRate, setInterestRate] = useState<number>(7.2);
  const [issueDate, setIssueDate] = useState('2026-10-15');
  const [maturityDate, setMaturityDate] = useState('2036-10-15');
  const [lockInYears, setLockInYears] = useState<number>(10);
  const [jointName, setJointName] = useState('Chairman, Apex Trust & Member Secretary, AICTE');
  const [lienMarked, setLienMarked] = useState<boolean>(true);
  const [autoRenewal, setAutoRenewal] = useState<boolean>(true);

  // Uploaded docs simulation
  const [uploadedFDRCert, setUploadedFDRCert] = useState<string>('FDR_SBI_Receipt_778901.pdf');
  const [uploadedLienDoc, setUploadedLienDoc] = useState<string>('SBI_Bank_Lien_Letter_To_AICTE.pdf');
  const [uploadedResolution, setUploadedResolution] = useState<string>('Board_Resolution_Security_Deposit.pdf');

  // Submission result state
  const [submissionComplete, setSubmissionComplete] = useState<boolean>(false);
  const [detectedDiscrepancies, setDetectedDiscrepancies] = useState<string[]>([]);

  // AI OCR Document Scanning State
  const [showOcrScanner, setShowOcrScanner] = useState<boolean>(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrExtractedData, setOcrExtractedData] = useState<{
    fdrNumber: string;
    bankName: string;
    branchName: string;
    ifscCode: string;
    amount: number;
    issueDate: string;
    maturityDate: string;
    lienMarked: boolean;
    jointName: string;
    confidence: number;
    anomalies: string[];
  } | null>(null);

  const handleRunOCR = (presetType?: 'clean_sbi' | 'hdfc_expansion' | 'pnb_short_term') => {
    setIsOcrProcessing(true);
    setTimeout(() => {
      if (presetType === 'hdfc_expansion') {
        setOcrExtractedData({
          fdrNumber: 'FDR/HDFC/2026/882104',
          bankName: 'HDFC Bank',
          branchName: 'Connaught Place Branch, New Delhi',
          ifscCode: 'HDFC0000003',
          amount: 1500000,
          issueDate: '2026-10-10',
          maturityDate: '2036-10-10',
          lienMarked: true,
          jointName: 'Director, XYZ Society & Member Secretary, AICTE',
          confidence: 99.2,
          anomalies: [],
        });
      } else if (presetType === 'pnb_short_term') {
        setOcrExtractedData({
          fdrNumber: 'FDR/PNB/2026/440192',
          bankName: 'Punjab National Bank',
          branchName: 'Sector 17, Chandigarh',
          ifscCode: 'PUNB0017000',
          amount: 800000,
          issueDate: '2026-10-15',
          maturityDate: '2031-10-15',
          lienMarked: false,
          jointName: 'Principal, PQR College only',
          confidence: 97.8,
          anomalies: [
            'Tenure is 5 years; APH requires mandatory 8 to 10 years lock-in period.',
            'Lien not marked in favor of Member Secretary, AICTE.',
            'Single ownership detected; joint mandate with AICTE is mandatory.',
          ],
        });
      } else {
        setOcrExtractedData({
          fdrNumber: 'FDR/SBI/2026/778901',
          bankName: 'State Bank of India',
          branchName: 'Fort Commercial Branch, Mumbai',
          ifscCode: 'SBIN0000300',
          amount: 1000000,
          issueDate: '2026-10-15',
          maturityDate: '2036-10-15',
          lienMarked: true,
          jointName: 'Chairman, ABC Educational Society & Member Secretary, AICTE',
          confidence: 99.6,
          anomalies: [],
        });
      }
      setIsOcrProcessing(false);
    }, 800);
  };

  const handleApplyOCRData = () => {
    if (!ocrExtractedData) return;
    setFdrNumber(ocrExtractedData.fdrNumber);
    setBankName(ocrExtractedData.bankName);
    setBranchName(ocrExtractedData.branchName);
    setIfscCode(ocrExtractedData.ifscCode);
    setFdrAmount(ocrExtractedData.amount);
    setIssueDate(ocrExtractedData.issueDate);
    setMaturityDate(ocrExtractedData.maturityDate);
    setJointName(ocrExtractedData.jointName);
    setLienMarked(ocrExtractedData.lienMarked);
    setShowOcrScanner(false);
  };

  // Computed APH norm
  const aphNorm = calculateAPHNormRequiredFDR(category, purpose, isConcessionCategory);

  const isIfscValid = validateIFSCCode(ifscCode);

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setFdrAmount(aphNorm.requiredAmountINR);
    setLockInYears(aphNorm.lockInYears);
    setCurrentStep(2);
  };

  const handleNextToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isIfscValid) {
      alert('Please enter a valid 11-character RBI IFSC code (e.g. SBIN0000300).');
      return;
    }
    setCurrentStep(3);
  };

  const handleNextToStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-submission discrepancy scrutiny
    const discrepancies = detectFDRDiscrepancies({
      fdrAmount,
      maturityDate,
      lienMarked,
      bankName,
      jointName,
    });
    setDetectedDiscrepancies(discrepancies);
    setCurrentStep(4);
  };

  const handleFinalSubmit = () => {
    const newRecord: FDRRecord = {
      id: `fdr-${Date.now()}`,
      aicteApplicationNo,
      permanentInstituteId,
      instituteName,
      category,
      state,
      region,
      fdrNumber,
      bankName,
      branchName,
      ifscCode: ifscCode.toUpperCase(),
      fdrAmount,
      interestRate,
      issueDate,
      maturityDate,
      tenureMonths: lockInYears * 12,
      lockInPeriodYears: lockInYears,
      jointName,
      lienMarked,
      autoRenewal,
      purpose,
      aphClause: aphNorm.aphReference,
      status: detectedDiscrepancies.length > 0 ? 'discrepant' : 'under_scrutiny',
      verificationSource: detectedDiscrepancies.length > 0 ? 'discrepancy_flagged' : 'institution_submitted',
      discrepancyReasons: detectedDiscrepancies.length > 0 ? detectedDiscrepancies : undefined,
      supportingDocuments: [
        {
          id: `doc-${Date.now()}-1`,
          title: 'Original FDR Fixed Deposit Certificate',
          type: 'fdr_certificate',
          fileName: uploadedFDRCert,
          uploadedAt: '2026-10-30 11:45',
          fileSize: '2.8 MB',
          verified: false,
        },
        {
          id: `doc-${Date.now()}-2`,
          title: 'Bank Lien Endorsement Letter to Member Secretary, AICTE',
          type: 'lien_endorsement',
          fileName: uploadedLienDoc,
          uploadedAt: '2026-10-30 11:46',
          fileSize: '1.4 MB',
          verified: false,
        },
        {
          id: `doc-${Date.now()}-3`,
          title: 'Governing Board Resolution for Joint Deposit',
          type: 'board_resolution',
          fileName: uploadedResolution,
          uploadedAt: '2026-10-30 11:47',
          fileSize: '950 KB',
          verified: false,
        },
      ],
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: '2026-10-30 11:48',
          action: 'Online Digital Deposit Submission',
          userRole: 'Institute Principal',
          userName: 'Authorized Representative',
          details: `Submitted new FDR #${fdrNumber} for ${formatINR(fdrAmount)}. Statutory verification queued.`,
        },
      ],
    };

    onSubmitFDR(newRecord);
    setSubmissionComplete(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Approval Process Handbook (APH) Compliance Filing
        </div>
        <h2 className="text-lg font-bold text-slate-900 mt-1">
          Submission of Institutional Security Deposit / Fixed Deposit Receipt (FDR)
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          In accordance with AICTE Regulations and Approval Process Handbook, institutions must maintain
          prescribed security deposits under joint ownership with lien marked to Member Secretary, AICTE.
        </p>

        {/* Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-2 mt-5 text-xs font-semibold">
          <div
            className={`p-2 rounded-lg border text-center transition-colors ${
              currentStep === 1
                ? 'bg-slate-900 text-white border-slate-900'
                : currentStep > 1
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            1. Institution & Norms
          </div>
          <div
            className={`p-2 rounded-lg border text-center transition-colors ${
              currentStep === 2
                ? 'bg-slate-900 text-white border-slate-900'
                : currentStep > 2
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            2. FDR & Bank Details
          </div>
          <div
            className={`p-2 rounded-lg border text-center transition-colors ${
              currentStep === 3
                ? 'bg-slate-900 text-white border-slate-900'
                : currentStep > 3
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            3. Digital Documents
          </div>
          <div
            className={`p-2 rounded-lg border text-center transition-colors ${
              currentStep === 4
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            4. Review & Scrutiny
          </div>
        </div>
      </div>

      {/* Confirmation State if finished */}
      {submissionComplete ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            FDR Instrument Registered Successfully
          </h3>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Security deposit for <span className="font-semibold text-slate-800">{instituteName}</span>{' '}
            bearing FDR number <span className="font-mono font-bold text-slate-900">{fdrNumber}</span> of amount{' '}
            <span className="font-bold text-slate-900">{formatINR(fdrAmount)}</span> has been securely logged
            into the AICTE Regulation Bureau Central Repository.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-md mx-auto text-xs text-left space-y-1.5 font-mono">
            <div>Acknowledgment Ref: AICTE/APH/FDR-ACK/{Date.now().toString().slice(-6)}</div>
            <div>Custody Jurisdiction: {region}</div>
            <div>APH Norm Clause: {aphNorm.aphReference}</div>
            <div>Core Banking API Verification: Scheduled automated ping dispatched</div>
          </div>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmissionComplete(false);
                setCurrentStep(1);
              }}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Submit Another Deposit
            </button>
          </div>
        </div>
      ) : (
        /* Multi-Step Wizard Forms */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          {/* STEP 1: Institution & Purpose */}
          {currentStep === 1 && (
            <form onSubmit={handleNextToStep2} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 1: Institution & Regulatory Purpose</h3>
                <p className="text-xs text-slate-500">
                  Select discipline and purpose to auto-determine required statutory deposit according to AICTE Approval Process Handbook (APH).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Permanent Institute ID (PID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={permanentInstituteId}
                    onChange={(e) => setPermanentInstituteId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                    placeholder="e.g. 1-10293847"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    AICTE Application Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={aicteApplicationNo}
                    onChange={(e) => setAicteApplicationNo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono"
                    placeholder="e.g. 1-3329182741"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Institution Official Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                    placeholder="Full registered name of technical institute"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Technical Discipline / Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InstituteCategory)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  >
                    <option value="Engineering & Technology">Engineering & Technology</option>
                    <option value="Management (PGDM/MBA)">Management (PGDM/MBA)</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Architecture & Planning">Architecture & Planning</option>
                    <option value="Hotel Management & Catering">Hotel Management & Catering</option>
                    <option value="Applied Arts & Crafts">Applied Arts & Crafts</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    AICTE Regional Office Jurisdiction *
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as AICTERegion)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  >
                    <option value="Northern (Kanpur)">Northern (Kanpur)</option>
                    <option value="North-Western (Chandigarh)">North-Western (Chandigarh)</option>
                    <option value="Central (Bhopal)">Central (Bhopal)</option>
                    <option value="Western (Mumbai)">Western (Mumbai)</option>
                    <option value="South-Western (Bengaluru)">South-Western (Bengaluru)</option>
                    <option value="Southern (Chennai)">Southern (Chennai)</option>
                    <option value="Eastern (Kolkata)">Eastern (Kolkata)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Regulatory Purpose of Deposit *
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800"
                  >
                    <option value="Establishment of New Technical Institution">
                      Establishment of New Technical Institution
                    </option>
                    <option value="Introduction of New Course / Program">
                      Introduction of New Course / Program (Additional Division)
                    </option>
                    <option value="Increase in Approved Intake">
                      Increase in Approved Intake
                    </option>
                    <option value="Change of Site / Location">Change of Site / Location</option>
                    <option value="Extension of Approval (EoA) Compliance">
                      Extension of Approval (EoA) Compliance
                    </option>
                  </select>
                </div>

                {/* Concession check */}
                <div className="md:col-span-2 bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={isConcessionCategory}
                      onChange={(e) => setIsConcessionCategory(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900"
                    />
                    <span>
                      Exclusively for Women / Minority / Divyang Technical Institution (Applies 20% APH Statutory Concession)
                    </span>
                  </label>
                </div>
              </div>

              {/* APH Auto-Calculation Callout */}
              <div className="p-4 bg-slate-900 text-white rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Statutory Deposit Required (APH Norm)</div>
                  <div className="text-xl font-bold tabular-nums">
                    {formatINR(aphNorm.requiredAmountINR)} ({aphNorm.requiredAmountLakhs} Lakhs)
                  </div>
                  <div className="text-[11px] text-amber-400 mt-0.5">{aphNorm.aphReference}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Prescribed Lock-in Period</div>
                  <div className="text-lg font-bold">{aphNorm.lockInYears} Years Mandatory</div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span>Proceed to Instrument Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Instrument & Issuing Bank */}
          {currentStep === 2 && (
            <form onSubmit={handleNextToStep3} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 2: FDR Instrument & Bank Endorsement</h3>
                  <p className="text-xs text-slate-500">
                    Fixed Deposit must be in a Scheduled Commercial Bank with mandatory joint ownership and lien marked to Member Secretary, AICTE.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowOcrScanner(!showOcrScanner);
                    if (!ocrExtractedData) handleRunOCR('clean_sbi');
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>{showOcrScanner ? 'Close AI OCR' : '✨ Scan FDR PDF with AI OCR'}</span>
                </button>
              </div>

              {/* AI OCR Scanner & Anomaly Detector Box */}
              {showOcrScanner && (
                <div className="bg-linear-to-br from-amber-50/90 via-slate-50 to-indigo-50/50 border-2 border-amber-300 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                        <Scan className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>AI OCR Document Extractor & Anomaly Engine</span>
                          <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                            EasyOCR / PaddleOCR Simulation
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Extracts FDR Number, Amount, Bank, IFSC, and verifies AICTE Member Secretary Joint Lien.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OCR Test Sample Selector */}
                  <div className="bg-white border border-amber-200 rounded-lg p-2.5">
                    <div className="text-[11px] font-bold text-slate-700 mb-1.5">
                      Select or Upload FDR PDF / Image to extract:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleRunOCR('clean_sbi')}
                        className="p-2 text-left bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded transition-colors cursor-pointer"
                      >
                        <div className="text-[10px] font-bold text-emerald-700">● Clean Compliant Preset</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">ABC College (SBI ₹10L)</div>
                        <div className="text-[10px] text-slate-500">10-Yr Lock-in · AICTE Lien</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRunOCR('hdfc_expansion')}
                        className="p-2 text-left bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-400 rounded transition-colors cursor-pointer"
                      >
                        <div className="text-[10px] font-bold text-blue-700">● Expansion Deposit</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">XYZ Tech (HDFC ₹15L)</div>
                        <div className="text-[10px] text-slate-500">New Intake Division</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRunOCR('pnb_short_term')}
                        className="p-2 text-left bg-rose-50/60 hover:bg-rose-50 border border-rose-200 hover:border-rose-400 rounded transition-colors cursor-pointer"
                      >
                        <div className="text-[10px] font-bold text-rose-700">⚠️ Anomaly Test Case</div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">PQR College (PNB ₹8L)</div>
                        <div className="text-[10px] text-rose-600">5-Yr Tenure · Missing AICTE Lien</div>
                      </button>
                    </div>
                  </div>

                  {/* OCR Extraction Result */}
                  {isOcrProcessing ? (
                    <div className="py-6 flex flex-col items-center justify-center text-slate-600 space-y-2">
                      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-xs font-medium">Scanning PDF text layer, extracting coordinates & OCR fields...</div>
                    </div>
                  ) : ocrExtractedData ? (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">Extracted Document Data</span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                            {ocrExtractedData.confidence}% Confidence
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleApplyOCRData}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Auto-Fill Form</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">FDR Receipt No:</div>
                          <div className="font-mono font-bold text-slate-900">{ocrExtractedData.fdrNumber}</div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">Deposit Amount:</div>
                          <div className="font-bold text-emerald-700">{formatINR(ocrExtractedData.amount)}</div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">Bank & Branch:</div>
                          <div className="font-bold text-slate-900 truncate">{ocrExtractedData.bankName}</div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                          <div className="text-[10px] text-slate-500">Maturity Date:</div>
                          <div className="font-mono font-bold text-slate-900">{ocrExtractedData.maturityDate}</div>
                        </div>
                      </div>

                      {/* Anomaly Alerts if any */}
                      {ocrExtractedData.anomalies.length > 0 ? (
                        <div className="bg-rose-50 border border-rose-300 rounded p-2.5 text-xs text-rose-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-rose-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>AI Anomaly Detection Flagged Discrepancies:</span>
                          </div>
                          <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5">
                            {ocrExtractedData.anomalies.map((anom, i) => (
                              <li key={i}>{anom}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-900 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Document validation cleared: 10-Year statutory lock-in and joint lien to Member Secretary AICTE verified.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Scheduled Bank Name *
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  >
                    <option value="State Bank of India">State Bank of India</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Canara Bank">Canara Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Indian Bank">Indian Bank</option>
                    <option value="Union Bank of India">Union Bank of India</option>
                    <option value="Axis Bank">Axis Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Issuing Branch *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                    placeholder="e.g. Fort Commercial Branch, Mumbai"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch IFSC Code (RBI Format) *
                  </label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className={`w-full p-2 font-mono uppercase rounded-md border ${
                      isIfscValid
                        ? 'bg-slate-50 border-slate-300'
                        : 'bg-rose-50 border-rose-400 text-rose-900'
                    }`}
                    placeholder="e.g. SBIN0000300"
                  />
                  {!isIfscValid && (
                    <p className="text-[10px] text-rose-600 mt-0.5">
                      Invalid IFSC. Standard format: 4 letters + 0 + 6 alphanumeric digits.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    FDR Instrument Receipt Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={fdrNumber}
                    onChange={(e) => setFdrNumber(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                    placeholder="e.g. FDR/SBI/2026/882190"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deposit Amount (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={fdrAmount}
                    onChange={(e) => setFdrAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-900 tabular-nums"
                  />
                  {fdrAmount < aphNorm.requiredAmountINR && (
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                      Notice: Entered amount is less than APH prescribed {formatINR(aphNorm.requiredAmountINR)}.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Annual Interest Rate (% p.a.) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Maturity Date (Min {lockInYears} Years) *
                  </label>
                  <input
                    type="date"
                    required
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Joint Account Title (Must include AICTE designation) *
                  </label>
                  <input
                    type="text"
                    required
                    value={jointName}
                    onChange={(e) => setJointName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                    placeholder="e.g. Chairman, Society & Member Secretary, AICTE"
                  />
                </div>

                {/* Lien Marking Affirmation */}
                <div className="md:col-span-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-emerald-950 font-semibold">
                    <input
                      type="checkbox"
                      required
                      checked={lienMarked}
                      onChange={(e) => setLienMarked(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-slate-900"
                    />
                    <span>
                      Mandatory Lien Marking: I certify that the FDR instrument has been duly lien marked to
                      "Member Secretary, All India Council for Technical Education, New Delhi" and the bank has confirmed non-encashment without AICTE prior written clearance.
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Back to Step 1
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span>Proceed to Document Upload</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Digital Documents */}
          {currentStep === 3 && (
            <form onSubmit={handleNextToStep4} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 3: Upload Supporting Documents</h3>
                <p className="text-xs text-slate-500">
                  Upload PDF scans of the original FDR, Bank Lien confirmation letter, and Trust Board resolution.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {/* FDR Certificate */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="font-semibold text-slate-900">Original FDR Certificate *</div>
                      <div className="text-[11px] text-slate-500">{uploadedFDRCert} · 2.8 MB</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    Uploaded
                  </span>
                </div>

                {/* Lien Letter */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Bank Lien Endorsement Letter to AICTE *
                      </div>
                      <div className="text-[11px] text-slate-500">{uploadedLienDoc} · 1.4 MB</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    Uploaded
                  </span>
                </div>

                {/* Board Resolution */}
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-600" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Governing Body / Trust Resolution *
                      </div>
                      <div className="text-[11px] text-slate-500">{uploadedResolution} · 950 KB</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    Uploaded
                  </span>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Back to Step 2
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <span>Run Pre-Submission Scrutiny</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Scrutiny Check & Final Submission */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Step 4: Automated Regulatory Scrutiny Check</h3>
                <p className="text-xs text-slate-500">
                  Pre-submission engine verification against Approval Process Handbook compliance checklist.
                </p>
              </div>

              {/* Summary Dossier */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-slate-500">Permanent ID</div>
                  <div className="font-bold font-mono text-slate-900">{permanentInstituteId}</div>
                </div>
                <div>
                  <div className="text-slate-500">Instrument Number</div>
                  <div className="font-bold font-mono text-slate-900">{fdrNumber}</div>
                </div>
                <div>
                  <div className="text-slate-500">Deposit Amount</div>
                  <div className="font-bold text-slate-900 tabular-nums">{formatINR(fdrAmount)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Maturity Date</div>
                  <div className="font-bold text-slate-900">{maturityDate}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-slate-500">Issuing Bank & Branch</div>
                  <div className="font-semibold text-slate-900">
                    {bankName} · {branchName}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-slate-500">Joint Account Title</div>
                  <div className="font-semibold text-slate-900">{jointName}</div>
                </div>
              </div>

              {/* Scrutiny Results */}
              {detectedDiscrepancies.length > 0 ? (
                <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg text-xs space-y-2">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Discrepancies Flagged by Regulatory Engine:</span>
                  </div>
                  <ul className="list-disc pl-5 text-rose-800 space-y-1">
                    {detectedDiscrepancies.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-rose-700 pt-1">
                    You may proceed to submit, but this instrument will be flagged for Regional Scrutiny inquiry.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Compliance Verification Passed:</span>
                  </div>
                  <p className="text-emerald-800">
                    IFSC code valid, joint naming contains AICTE designation, lien endorsement confirmed, and amount meets APH requirement.
                  </p>
                </div>
              )}

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Back to Documents
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-5 py-2.5 text-xs font-bold bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Execute Digital Filing & Seal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
