import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { CheckCircle, Clock, FileUp, XCircle, FileText, X } from 'lucide-react';

// --- Interfaces ---
interface KYCFormData {
  personal: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    phone: string;
    email: string;
    employmentStatus: string;
    employerName: string;
  };
  address: {
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  income: {
    monthlyIncome: string;
    incomeSource: string;
    employmentType: string;
  };
  bank: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    branchCode: string;
  };
  documents: {
    idDocument?: File | null;
    proofOfAddress?: File | null;
    proofOfIncome?: File | null;
    bankStatement?: File | null;
  };
}

interface KYCStatus {
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'not_submitted';
  rejection_reason?: string;
  submitted_at?: string;
}

const KYC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState<KYCFormData>({
    personal: { fullName: '', dateOfBirth: '', idNumber: '', phone: '', email: '', employmentStatus: '', employerName: '' },
    address: { streetAddress: '', city: '', province: '', postalCode: '', country: 'South Africa' },
    income: { monthlyIncome: '', incomeSource: '', employmentType: '' },
    bank: { bankName: '', accountNumber: '', accountType: '', branchCode: '' },
    documents: { idDocument: null, proofOfAddress: null, proofOfIncome: null, bankStatement: null },
  });
  const [kycStatus, setKycStatus] = useState<KYCStatus>({ status: 'draft' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: string}>({});
  const [uploadingDocuments, setUploadingDocuments] = useState<{[key: string]: boolean}>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // --- Data Fetching ---
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: userData } = await api.get('/api/user/profile');
      
      // Autofill personal information from user profile
      setFormData(prev => ({
        ...prev,
        personal: {
          ...prev.personal,
          fullName: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dateOfBirth: userData.date_of_birth ? new Date(userData.date_of_birth).toISOString().split('T')[0] : '',
          employmentStatus: userData.employment_status || '',
        }
      }));
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, []);

  const fetchKYCData = useCallback(async () => {
    try {
      const { data } = await api.get('/api/kyc/status');
      if (data && data.status !== 'not_submitted') {
        // ✅ Only set status for approved/rejected, not for pending/draft
        if (data.status === 'approved' || data.status === 'rejected') {
          setKycStatus({
            status: data.status,
            rejection_reason: data.rejection_reason,
            submitted_at: data.created_at,
          });
        } else {
          // For pending/draft status, don't show status card - let user submit fresh
          setKycStatus({ status: 'draft' });
        }
        
        // Map backend data to frontend form structure
        setFormData(prev => ({
          ...prev,
          personal: {
            fullName: data.full_name || prev.personal.fullName,
            dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : prev.personal.dateOfBirth,
            idNumber: data.id_number || '',
            phone: data.phone || prev.personal.phone,
            email: data.email || prev.personal.email,
            employmentStatus: data.employment_status || prev.personal.employmentStatus,
            employerName: data.employer_name || '',
          },
          address: {
            streetAddress: data.street_address || '',
            city: data.city || '',
            province: data.province || '',
            postalCode: data.postal_code || '',
            country: data.country || 'South Africa',
          },
          income: {
            monthlyIncome: data.monthly_income ? data.monthly_income.toString() : '',
            incomeSource: data.income_source || '',
            employmentType: data.employment_type || '',
          },
          bank: {
            bankName: data.bank_name || '',
            accountNumber: data.account_number || '',
            accountType: data.account_type || '',
            branchCode: data.branch_code || '',
          },
        }));

        // Show message that existing documents exist
        const hasExistingDocs = data.id_document_path || data.proof_of_address_path || data.proof_of_income_path || data.bank_statement_path;
        if (hasExistingDocs) {
          toast.info('Existing documents found in your previous submission. You can upload new documents to replace them.');
        }
      } else {
        setKycStatus({ status: 'draft' });
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      setKycStatus({ status: 'draft' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUserProfile(), fetchKYCData()]);
    };
    loadData();
  }, [fetchUserProfile, fetchKYCData]);

  // --- Handlers ---
  const handleInputChange = (section: keyof Omit<KYCFormData, 'documents'>, field: string, value: string) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleFileChange = (field: keyof KYCFormData['documents'], file: File | null) => {
    setFormData(prev => ({ ...prev, documents: { ...prev.documents, [field]: file } }));
  };

  const saveKYCData = async (section: keyof Omit<KYCFormData, 'documents'>) => {
    try {
      const sectionData = formData[section];
      await api.patch('/api/kyc/update', { [section]: sectionData });
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} information saved successfully!`);
    } catch (error: any) {
      console.error('Error saving KYC data:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save data. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleSaveAndContinue = async (nextTab: string) => {
    // Save current section data before moving to next tab
    const currentSection = activeTab as keyof Omit<KYCFormData, 'documents'>;
    await saveKYCData(currentSection);
    setActiveTab(nextTab);
  };

  const handleDocumentUpload = async (field: keyof KYCFormData['documents'], file: File | null) => {
    handleFileChange(field, file);
    
    // If a file was selected, save it immediately
    if (file) {
      setUploadingDocuments(prev => ({ ...prev, [field]: true }));
      
      try {
        const formDataToSend = new FormData();
        formDataToSend.append(`documents.${field}`, file);
        
        await api.patch('/api/kyc/update', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update uploaded documents status
        setUploadedDocuments(prev => ({ ...prev, [field]: 'Uploaded' }));
        
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        toast.success(`${fieldName} uploaded successfully!`);
      } catch (error: any) {
        console.error('Error uploading document:', error);
        const errorMessage = error.response?.data?.error || 'Failed to upload document. Please try again.';
        toast.error(errorMessage);
        // Remove the file from state if upload failed
        handleFileChange(field, null);
        setUploadedDocuments(prev => ({ ...prev, [field]: '' }));
      } finally {
        setUploadingDocuments(prev => ({ ...prev, [field]: false }));
      }
    } else {
      // If file was removed, clear the uploaded status
      setUploadedDocuments(prev => ({ ...prev, [field]: '' }));
    }
  };

  const clearDocumentsOnly = () => {
    setFormData(prev => ({
      ...prev,
      documents: { idDocument: null, proofOfAddress: null, proofOfIncome: null, bankStatement: null }
    }));
    setUploadedDocuments({});
  };

  const handleSubmitForVerification = async () => {
    // Validate required fields
    if (!formData.personal.fullName.trim()) {
      setModalMessage('Please enter your full name.');
      setShowErrorModal(true);
      return;
    }

    if (!formData.personal.idNumber.trim()) {
      setModalMessage('Please enter your ID number.');
      setShowErrorModal(true);
      return;
    }

    if (formData.personal.idNumber.length < 11) {
      setModalMessage('ID Number must be at least 11 digits.');
      setShowErrorModal(true);
      return;
    }

    if (!formData.personal.phone.trim()) {
      setModalMessage('Please enter your phone number.');
      setShowErrorModal(true);
      return;
    }

    if (!formData.personal.email.trim()) {
      setModalMessage('Please enter your email address.');
      setShowErrorModal(true);
      return;
    }

    // Check if required documents are uploaded
    const requiredDocuments = ['idDocument', 'proofOfAddress'];
    const missingDocuments = requiredDocuments.filter(doc => !uploadedDocuments[doc]);
    
    if (missingDocuments.length > 0) {
      const missingNames = missingDocuments.map(doc => 
        doc.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      );
      setModalMessage(`Please upload the following required documents: ${missingNames.join(', ')}`);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    const dataToSend = new FormData();

    // Add all form data
    Object.entries(formData).forEach(([section, values]) => {
      if (section !== 'documents') {
        Object.entries(values).forEach(([key, value]) => { 
          dataToSend.append(`${section}.${key}`, value as string); 
        });
      } else {
        Object.entries(values).forEach(([key, value]) => { 
          if (value) { 
            dataToSend.append(`documents.${key}`, value as File); 
          } 
        });
      }
    });

    try {
      const response = await api.post('/api/kyc/submit', dataToSend, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      // Show success modal
      setModalMessage(response.data.message || 'KYC submitted successfully! Your application is now pending review.');
      setShowSuccessModal(true);
      
      // Update status
      setKycStatus(prev => ({ ...prev, status: 'pending' }));
      
      // ✅ Only clear documents section, keep all other form data
      clearDocumentsOnly();
      
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      const errorMessage = error.response?.data?.error || 'An error occurred during submission. Please try again.';
      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Modal Components ---
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-800">Success!</h3>
          <button 
            onClick={() => setShowSuccessModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
          <p className="text-gray-700">{modalMessage}</p>
        </div>
        <button 
          onClick={() => setShowSuccessModal(false)}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          OK
        </button>
      </div>
    </div>
  );

  const ErrorModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-800">Error</h3>
          <button 
            onClick={() => setShowErrorModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center mb-4">
          <XCircle className="h-8 w-8 text-red-500 mr-3" />
          <p className="text-gray-700">{modalMessage}</p>
        </div>
        <button 
          onClick={() => setShowErrorModal(false)}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
        >
          OK
        </button>
      </div>
    </div>
  );

  // --- Render Functions ---
  const renderTabs = () => (
    <div className="flex border-b mb-6">
      {['personal', 'address', 'income', 'bank', 'documents'].map(tab => (
        <button key={tab} className={`capitalize py-2 px-4 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );

  const renderPersonalDetails = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Personal Information</h3>
        <div><label className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" value={formData.personal.fullName} onChange={e => handleInputChange('personal', 'fullName', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Date of Birth</label><input type="date" value={formData.personal.dateOfBirth} onChange={e => handleInputChange('personal', 'dateOfBirth', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">ID Number</label><input type="text" value={formData.personal.idNumber} onChange={e => handleInputChange('personal', 'idNumber', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Phone</label><input type="text" value={formData.personal.phone} onChange={e => handleInputChange('personal', 'phone', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={formData.personal.email} onChange={e => handleInputChange('personal', 'email', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Employment Status</label><select value={formData.personal.employmentStatus} onChange={e => handleInputChange('personal', 'employmentStatus', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"><option value="">Select...</option><option value="employed">Employed</option><option value="unemployed">Unemployed</option><option value="student">Student</option></select></div>
        <div><label className="block text-sm font-medium text-gray-700">Employer Name</label><input type="text" value={formData.personal.employerName} onChange={e => handleInputChange('personal', 'employerName', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <button onClick={() => handleSaveAndContinue('address')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Save & Continue</button>
    </div>
  );

  const renderAddress = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Address Information</h3>
        <div><label className="block text-sm font-medium text-gray-700">Street Address</label><input type="text" value={formData.address.streetAddress} onChange={e => handleInputChange('address', 'streetAddress', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">City</label><input type="text" value={formData.address.city} onChange={e => handleInputChange('address', 'city', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Province</label><input type="text" value={formData.address.province} onChange={e => handleInputChange('address', 'province', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Postal Code</label><input type="text" value={formData.address.postalCode} onChange={e => handleInputChange('address', 'postalCode', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <button onClick={() => handleSaveAndContinue('income')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Save & Continue</button>
    </div>
  );

  const renderIncome = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Income Information</h3>
        <div><label className="block text-sm font-medium text-gray-700">Monthly Income</label><input type="number" value={formData.income.monthlyIncome} onChange={e => handleInputChange('income', 'monthlyIncome', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Income Source</label><input type="text" value={formData.income.incomeSource} onChange={e => handleInputChange('income', 'incomeSource', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Employment Type</label><input type="text" value={formData.income.employmentType} onChange={e => handleInputChange('income', 'employmentType', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <button onClick={() => handleSaveAndContinue('bank')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Save & Continue</button>
    </div>
  );

  const renderBankDetails = () => (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Bank Information</h3>
        <div><label className="block text-sm font-medium text-gray-700">Bank Name</label><input type="text" value={formData.bank.bankName} onChange={e => handleInputChange('bank', 'bankName', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Account Number</label><input type="text" value={formData.bank.accountNumber} onChange={e => handleInputChange('bank', 'accountNumber', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Account Type</label><input type="text" value={formData.bank.accountType} onChange={e => handleInputChange('bank', 'accountType', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <div><label className="block text-sm font-medium text-gray-700">Branch Code</label><input type="text" value={formData.bank.branchCode} onChange={e => handleInputChange('bank', 'branchCode', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
        <button onClick={() => handleSaveAndContinue('documents')} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">Save & Continue</button>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Upload Documents</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please upload the required documents to complete your verification process. 
        <span className="text-red-600 font-medium">* Required documents must be uploaded before submission.</span>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID Document */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            ID Document <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="idDocument" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <input 
                  id="idDocument" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('idDocument', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.idDocument && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.idDocument && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 font-medium">{formData.documents.idDocument.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.documents.idDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.idDocument && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Proof of Address <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="proofOfAddress" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <input 
                  id="proofOfAddress" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('proofOfAddress', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.proofOfAddress && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.proofOfAddress && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 font-medium">{formData.documents.proofOfAddress.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.documents.proofOfAddress.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.proofOfAddress && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Proof of Income</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="proofOfIncome" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <input 
                  id="proofOfIncome" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('proofOfIncome', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.proofOfIncome && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.proofOfIncome && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 font-medium">{formData.documents.proofOfIncome.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.documents.proofOfIncome.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.proofOfIncome && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Statement */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Statement</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="bankStatement" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                <input 
                  id="bankStatement" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('bankStatement', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.bankStatement && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.bankStatement && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 font-medium">{formData.documents.bankStatement.name}</p>
                  <p className="text-xs text-gray-500">
                    {(formData.documents.bankStatement.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.bankStatement && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.idDocument ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={uploadedDocuments.idDocument ? 'text-green-600 font-medium' : 'text-gray-500'}>
              ID Document {uploadedDocuments.idDocument ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.proofOfAddress ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={uploadedDocuments.proofOfAddress ? 'text-green-600 font-medium' : 'text-gray-500'}>
              Proof of Address {uploadedDocuments.proofOfAddress ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.proofOfIncome ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={uploadedDocuments.proofOfIncome ? 'text-green-600 font-medium' : 'text-gray-500'}>
              Proof of Income {uploadedDocuments.proofOfIncome ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.bankStatement ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span className={uploadedDocuments.bankStatement ? 'text-green-600 font-medium' : 'text-gray-500'}>
              Bank Statement {uploadedDocuments.bankStatement ? '✓' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button 
          onClick={handleSubmitForVerification} 
          disabled={isSubmitting || Object.keys(uploadingDocuments).some(key => uploadingDocuments[key])} 
          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg group"
        >
          {/* Background gradient overlay for extra depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          
          {/* Button content */}
          <div className="relative flex items-center justify-center">
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submit for Verification</span>
              </>
            )}
          </div>
          
          {/* Subtle shine effect */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
        </button>
      </div>
    </div>
  );

  const renderStatusCard = () => {
    const { status, rejection_reason, submitted_at } = kycStatus;
    
    const submittedAtJsx = submitted_at && (
      <p className="text-xs text-gray-500 mt-2">
        Submitted on: {new Date(submitted_at).toLocaleString()}
      </p>
    );

    switch (status) {
      case 'draft':
        return (
          <div className="mb-6 border-l-4 p-4 rounded-md bg-gray-50 border-gray-400 text-gray-700">
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-4 text-gray-500" />
              <div>
                <h3 className="text-lg font-bold">Draft Status</h3>
                <p className="mt-1 text-sm">Complete your KYC information and submit for verification.</p>
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="mb-6 border-l-4 p-4 rounded-md bg-blue-50 border-blue-500 text-blue-800">
            <div className="flex items-center">
              <Clock className="h-8 w-8 mr-4 text-blue-500" />
              <div>
                <h3 className="text-lg font-bold">Verification Pending</h3>
                <p className="mt-1 text-sm">Your documents are under review. You will be notified once the review is complete.</p>
                {submittedAtJsx}
              </div>
            </div>
          </div>
        );
      case 'approved':
        return (
          <div className="mb-6 border-l-4 p-4 rounded-md bg-green-50 border-green-500 text-green-800">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 mr-4 text-green-500" />
              <div>
                <h3 className="text-lg font-bold">Verification Approved</h3>
                <p className="mt-1 text-sm">Congratulations! Your account is successfully verified.</p>
                {submittedAtJsx}
              </div>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="mb-6 border-l-4 p-4 rounded-md bg-red-50 border-red-500 text-red-800">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 mr-4 text-red-500" />
              <div>
                <h3 className="text-lg font-bold">Verification Rejected</h3>
                <p className="mt-1 text-sm">Reason: {rejection_reason || 'Contact support for more information.'}</p>
                <p className="mt-2 text-sm">You can update your information and submit again.</p>
                {submittedAtJsx}
              </div>
            </div>
          </div>
        );
      default:
        // ✅ Don't show any status card for 'not_submitted' or unknown statuses
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">KYC Verification</h2>
      
      {renderStatusCard()}

      {/* Always show tabs and form */}
      {renderTabs()}
      <div className="mt-6">
        {activeTab === 'personal' && renderPersonalDetails()}
        {activeTab === 'address' && renderAddress()}
        {activeTab === 'income' && renderIncome()}
        {activeTab === 'bank' && renderBankDetails()}
        {activeTab === 'documents' && renderDocuments()}
      </div>

      {/* Modals */}
      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
    </div>
  );
};

export default KYC;
