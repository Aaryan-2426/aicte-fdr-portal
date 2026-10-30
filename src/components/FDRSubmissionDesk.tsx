import React, { useState, useEffect } from 'react';
import { FDRRecord, InstituteCategory, AICTERegion } from '../types/fdr';
import {
  calculateAPHNormRequiredFDR,
  validateIFSCCode,
  formatINR,
  detectFDRDiscrepancies,
  validateMaturityPeriod,
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
  Eye,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  X,
  FileCheck,
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

  // Real Uploaded Supporting Documents State - All initially null (Not Uploaded)
  const [documents, setDocuments] = useState<Record<string, {
    id: string;
    type: 'fdr_certificate' | 'lien_endorsement' | 'board_resolution';
    title: string;
    fileName: string;
    storedFileName?: string;
    fileSize: string;
    fileSizeBytes: number;
    uploadedAt: string;
    storageUrl: string;
    dataBase64?: string;
  } | null>>(() => {
    try {
      const saved = sessionStorage.getItem('aicte_draft_documents');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      fdr_certificate: null,
      lien_endorsement: null,
      board_resolution: null,
    };
  });

  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string | null>>({});
  const [scrutinyError, setScrutinyError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    fileName: string;
    fileSize: string;
    storageUrl: string;
    dataBase64?: string;
  } | null>(null);

  // Sync to sessionStorage for persistent draft state across refreshes
  useEffect(() => {
    try {
      sessionStorage.setItem('aicte_draft_documents', JSON.stringify(documents));
    } catch {
      // safe fallback
    }
  }, [documents]);

  // Real Document Upload Handler with strict validation (PDF only, max 10MB, non-empty)
  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'fdr_certificate' | 'lien_endorsement' | 'board_resolution'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // Reset input to allow re-selection

    if (!file) return;

    // 1. Validate file format: PDF only
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setUploadErrors((prev) => ({
        ...prev,
        [docType]: 'Invalid file format: Only PDF documents (.pdf) are permitted under AICTE APH regulations.',
      }));
      return;
    }

    // 2. Validate empty file
    if (file.size === 0) {
      setUploadErrors((prev) => ({
        ...prev,
        [docType]: 'Invalid file: Selected document is empty (0 bytes).',
      }));
      return;
    }

    // 3. Validate maximum size (10 MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadErrors((prev) => ({
        ...prev,
        [docType]: `File exceeds maximum allowed size of 10 MB (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
      }));
      return;
    }

    // Clear errors and start upload
    setUploadErrors((prev) => ({ ...prev, [docType]: null }));
    setScrutinyError(null);
    setUploadingDocType(docType);
    setUploadProgress((prev) => ({ ...prev, [docType]: 20 }));

    try {
      // Read file into Base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress((prev) => ({ ...prev, [docType]: 65 }));

      // Send to backend storage API
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          fileName: file.name,
          fileData,
          applicationId: aicteApplicationNo,
          fdrNumber,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server rejected file upload');
      }

      const result = await res.json();
      setUploadProgress((prev) => ({ ...prev, [docType]: 100 }));

      // Save real document record
      setDocuments((prev) => ({
        ...prev,
        [docType]: {
          ...result.document,
          dataBase64: fileData,
        },
      }));
    } catch (err: any) {
      console.error('Document upload error:', err);
      setUploadErrors((prev) => ({
        ...prev,
        [docType]: err.message || 'Upload failed. Please try again.',
      }));
    } finally {
      setUploadingDocType(null);
    }
  };

  // Remove document handler
  const handleRemoveDocument = async (docType: string) => {
    const docToRemove = documents[docType];
    if (docToRemove?.storedFileName) {
      try {
        await fetch('/api/documents/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storedFileName: docToRemove.storedFileName }),
        });
      } catch {
        // safe fallback
      }
    }
    setDocuments((prev) => ({ ...prev, [docType]: null }));
    setUploadErrors((prev) => ({ ...prev, [docType]: null }));
    setScrutinyError(null);
  };

  // Helper: Generate real valid sample PDF in-memory for testing if user has no local PDF
  const handleGenerateSamplePdf = async (docType: 'fdr_certificate' | 'lien_endorsement' | 'board_resolution') => {
    const titles: Record<string, string> = {
      fdr_certificate: `${instituteName.slice(0, 15).replace(/\s+/g, '_')}_Original_FDR.pdf`,
      lien_endorsement: `${bankName.slice(0, 3).toUpperCase()}_Lien_Letter_AICTE.pdf`,
      board_resolution: `Trust_Board_Resolution_${new Date().getFullYear()}.pdf`,
    };
    const sampleFileName = titles[docType];
    const pdfRaw = `%PDF-1.4\n1 0 obj\n<< /Title (${sampleFileName}) /Author (AICTE Regulation Bureau) /Creator (AICTE Security Deposit Portal) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 14 Tf\n50 720 Td\n(AICTE Regulation Bureau - Mandatory Security Deposit Document: ${docType}) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000130 00000 n\n0000000177 00000 n\n0000000234 00000 n\n0000000319 00000 n\ntrailer\n<< /Size 6 /Root 2 0 R >>\nstartxref\n490\n%%EOF`;
    const blob = new Blob([pdfRaw], { type: 'application/pdf' });
    const file = new File([blob], sampleFileName, { type: 'application/pdf' });

    // Mock an event to pass to handleFileSelect
    const fakeEvent = {
      target: {
        files: [file],
        value: '',
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await handleFileSelect(fakeEvent, docType);
  };

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
    const matValidation = validateMaturityPeriod(issueDate, maturityDate, lockInYears);
    if (!matValidation.isValid) {
      alert(matValidation.error || `Maturity date violates AICTE ${lockInYears}-year lock-in requirement.`);
      return;
    }
    setCurrentStep(3);
  };

  const handleNextToStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    setScrutinyError(null);

    // Strictly enforce maturity period before scrutiny
    const matValidation = validateMaturityPeriod(issueDate, maturityDate, lockInYears);
    if (!matValidation.isValid) {
      setScrutinyError(`Scrutiny Blocked: ${matValidation.error}`);
      return;
    }

    // Strictly enforce all 3 mandatory statutory documents
    const missing: string[] = [];
    if (!documents.fdr_certificate) {
      missing.push('1. Original FDR Fixed Deposit Certificate');
    }
    if (!documents.lien_endorsement) {
      missing.push('2. Bank Lien Endorsement Letter to AICTE');
    }
    if (!documents.board_resolution) {
      missing.push('3. Governing Body / Trust Board Resolution');
    }

    if (missing.length > 0) {
      setScrutinyError(
        `Pre-Submission Scrutiny Blocked: All 3 mandatory statutory documents must be uploaded and verified before proceeding to Step 4.\n\nMissing documents:\n• ${missing.join('\n• ')}`
      );
      return;
    }

    // Pre-submission discrepancy scrutiny
    const discrepancies = detectFDRDiscrepancies({
      fdrAmount,
      issueDate,
      maturityDate,
      lockInYears,
      lienMarked,
      bankName,
      jointName,
    });
    setDetectedDiscrepancies(discrepancies);
    setCurrentStep(4);
  };

  const handleFinalSubmit = () => {
    const realSupportingDocs = [
      documents.fdr_certificate,
      documents.lien_endorsement,
      documents.board_resolution,
    ]
      .filter(Boolean)
      .map((doc) => ({
        id: doc!.id,
        title: doc!.title,
        type: doc!.type,
        fileName: doc!.fileName,
        uploadedAt: doc!.uploadedAt,
        fileSize: doc!.fileSize,
        verified: false,
        docUrl: doc!.storageUrl,
      }));

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
      supportingDocuments: realSupportingDocs,
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'Online Digital Deposit Submission',
          userRole: 'Institute Principal',
          userName: 'Authorized Representative',
          details: `Submitted new FDR #${fdrNumber} for ${formatINR(fdrAmount)} with ${realSupportingDocs.length} verified PDF documents.`,
        },
      ],
    };

    try {
      sessionStorage.removeItem('aicte_draft_documents');
    } catch {
      // safe fallback
    }

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

          {/* STEP 3: Real Digital Documents Upload */}
          {currentStep === 3 && (
            <form onSubmit={handleNextToStep4} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Step 3: Upload Supporting Documents</h3>
                  <p className="text-xs text-slate-500">
                    All 3 statutory documents below are mandatory under AICTE APH regulations. Only PDF files up to 10 MB are accepted.
                  </p>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
                  <span>Upload Status: </span>
                  <span className={Object.values(documents).filter(Boolean).length === 3 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {Object.values(documents).filter(Boolean).length} / 3 Completed
                  </span>
                </div>
              </div>

              {/* Scrutiny Blocking Error Banner */}
              {scrutinyError && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs text-rose-900 space-y-1 animate-in fade-in duration-200">
                  <div className="font-bold flex items-center gap-1.5 text-rose-950 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Pre-Submission Scrutiny Blocked</span>
                  </div>
                  <p className="whitespace-pre-line text-rose-800 text-xs pl-5.5">
                    {scrutinyError}
                  </p>
                </div>
              )}

              {/* Document Slots */}
              <div className="space-y-3.5 text-xs">
                {[
                  {
                    key: 'fdr_certificate' as const,
                    title: '1. Original FDR Fixed Deposit Certificate *',
                    desc: 'Original deposit certificate scan from Scheduled Commercial Bank certifying principal & joint name.',
                    icon: <FileText className="w-5 h-5 text-amber-600" />,
                  },
                  {
                    key: 'lien_endorsement' as const,
                    title: '2. Bank Lien Endorsement Letter to Member Secretary, AICTE *',
                    desc: 'Official bank undertaking certifying exclusive lien marked to AICTE with non-encashment clause.',
                    icon: <Landmark className="w-5 h-5 text-blue-600" />,
                  },
                  {
                    key: 'board_resolution' as const,
                    title: '3. Governing Body / Trust Board Resolution *',
                    desc: 'Certified resolution of the sponsoring Trust/Society approving FDR creation for AICTE approval.',
                    icon: <Building className="w-5 h-5 text-purple-600" />,
                  },
                ].map((docConfig) => {
                  const doc = documents[docConfig.key];
                  const isUploading = uploadingDocType === docConfig.key;
                  const docError = uploadErrors[docConfig.key];

                  return (
                    <div
                      key={docConfig.key}
                      className={`p-3.5 border rounded-xl transition-all ${
                        doc
                          ? 'border-emerald-300 bg-emerald-50/40 shadow-2xs'
                          : docError
                          ? 'border-rose-300 bg-rose-50/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Document Info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${doc ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100'}`}>
                            {doc ? <FileCheck className="w-5 h-5 text-emerald-700" /> : docConfig.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>{docConfig.title}</span>
                              {doc ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✓ Uploaded & Stored
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  Not Uploaded
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {docConfig.desc}
                            </p>

                            {/* Uploaded File Metadata */}
                            {doc && (
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-700 bg-white/80 p-1.5 px-2.5 rounded border border-emerald-200 w-fit">
                                <span className="font-semibold text-slate-900 flex items-center gap-1">
                                  📄 {doc.fileName}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="font-mono text-slate-600">{doc.fileSize}</span>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-500 text-[10px]">Saved: {doc.uploadedAt}</span>
                              </div>
                            )}

                            {/* Error message */}
                            {docError && (
                              <div className="mt-2 text-rose-700 flex items-center gap-1.5 text-[11px] font-medium">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                <span>{docError}</span>
                              </div>
                            )}

                            {/* Upload Progress Bar */}
                            {isUploading && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                                  <span>Validating & Storing PDF...</span>
                                  <span>{uploadProgress[docConfig.key] || 45}%</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-blue-600 h-full transition-all duration-300"
                                    style={{ width: `${uploadProgress[docConfig.key] || 45}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
                          {doc ? (
                            <>
                              {/* Preview Button */}
                              <button
                                type="button"
                                onClick={() => setPreviewDoc(doc)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Preview Uploaded PDF"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Preview</span>
                              </button>

                              {/* Download Button */}
                              <a
                                href={doc.storageUrl || doc.dataBase64}
                                download={doc.fileName}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Download</span>
                              </a>

                              {/* Replace Button */}
                              <label
                                htmlFor={`file-replace-${docConfig.key}`}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Replace with another PDF"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                                <span>Replace</span>
                              </label>
                              <input
                                type="file"
                                id={`file-replace-${docConfig.key}`}
                                accept="application/pdf"
                                onChange={(e) => handleFileSelect(e, docConfig.key)}
                                className="hidden"
                              />

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => handleRemoveDocument(docConfig.key)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                title="Remove Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Select PDF Input */}
                              <label
                                htmlFor={`file-upload-${docConfig.key}`}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${
                                  isUploading
                                    ? 'bg-slate-400 text-white cursor-not-allowed'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5 text-amber-400" />
                                <span>{isUploading ? 'Uploading...' : 'Select PDF File'}</span>
                              </label>
                              <input
                                type="file"
                                id={`file-upload-${docConfig.key}`}
                                accept="application/pdf"
                                disabled={isUploading}
                                onChange={(e) => handleFileSelect(e, docConfig.key)}
                                className="hidden"
                              />

                              {/* Quick Sample PDF generator for easy instant test on devices without local files */}
                              <button
                                type="button"
                                onClick={() => handleGenerateSamplePdf(docConfig.key)}
                                disabled={isUploading}
                                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                                title="Generates a valid AICTE test PDF and uploads it"
                              >
                                <span>Sample PDF</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Back to Step 2
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
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

      {/* PDF Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-800 rounded-lg text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{previewDoc.title}</h3>
                  <p className="text-xs text-slate-400 font-mono">{previewDoc.fileName} · {previewDoc.fileSize}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.storageUrl || previewDoc.dataBase64}
                  download={previewDoc.fileName}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / PDF Viewer */}
            <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative flex items-center justify-center min-h-[500px]">
              <iframe
                src={previewDoc.storageUrl || previewDoc.dataBase64}
                title={previewDoc.title}
                className="w-full h-full min-h-[500px] border-0 rounded-lg bg-white shadow-inner"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

