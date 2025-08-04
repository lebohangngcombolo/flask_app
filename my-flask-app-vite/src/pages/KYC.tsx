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

const provinces = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"];
const employmentTypes = ["Full-time", "Part-time", "Self-employed", "Contract", "Internship", "Unemployed", "Student"];
const bankNames = ["Absa", "African Bank", "Capitec", "Discovery Bank", "FNB", "Nedbank", "Standard Bank", "TymeBank"];
const accountTypes = ["Cheque / Current", "Savings", "Credit", "Transmission"];

// Add South African universities list
const universities = [
  "University of Cape Town",
  "University of the Witwatersrand", 
  "Stellenbosch University",
  "University of Pretoria",
  "University of KwaZulu-Natal",
  "University of Johannesburg",
  "University of the Western Cape",
  "University of Limpopo",
  "University of Fort Hare",
  "University of Venda",
  "University of Zululand",
  "University of the Free State",
  "North-West University",
  "University of Mpumalanga",
  "Sol Plaatje University",
  "Sefako Makgatho Health Sciences University",
  "Cape Peninsula University of Technology",
  "Central University of Technology",
  "Durban University of Technology",
  "Mangosuthu University of Technology",
  "Tshwane University of Technology",
  "Vaal University of Technology",
  "Walter Sisulu University",
  "Nelson Mandela University",
  "Rhodes University",
  "University of South Africa (UNISA)",
  "Other"
];

const bankBranchCodes: { [key: string]: string } = {
  "Absa": "632005",
  "African Bank": "430000",
  "Capitec": "470010",
  "Discovery Bank": "679000",
  "FNB": "250655",
  "Nedbank": "198765",
  "Standard Bank": "051001",
  "TymeBank": "678910",
};

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
  const [showCongrats, setShowCongrats] = useState(true);

  // Function to extract date from ID number
  const extractDateFromID = (idNumber: string) => {
    if (idNumber.length !== 13) return null;
    
    const year = idNumber.substring(0, 2);
    const month = idNumber.substring(2, 4);
    const day = idNumber.substring(4, 6);
    
    // Determine century based on year
    const currentYear = new Date().getFullYear();
    const currentYearLastTwo = currentYear % 100;
    const idYear = parseInt(year);
    
    let fullYear;
    if (idYear <= currentYearLastTwo) {
      fullYear = 2000 + idYear;
    } else {
      fullYear = 1900 + idYear;
    }
    
    return `${fullYear}-${month}-${day}`;
  };

  // Function to validate ID number format
  const validateIDNumber = (idNumber: string) => {
    if (idNumber.length !== 13) return false;
    
    // Check if all characters are digits
    if (!/^\d{13}$/.test(idNumber)) return false;
    
    // Extract date components
    const month = parseInt(idNumber.substring(2, 4));
    const day = parseInt(idNumber.substring(4, 6));
    
    // Validate month (1-12)
    if (month < 1 || month > 12) return false;
    
    // Validate day (1-31)
    if (day < 1 || day > 31) return false;
    
    // Additional validation for specific months
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) return false;
    
    return true;
  };

  // Validation functions
  const validatePersonal = () => {
    const errors: string[] = [];
    if (!formData.personal.fullName.trim()) errors.push('Full Name is required');
    if (!formData.personal.dateOfBirth) errors.push('Date of Birth is required');
    if (!formData.personal.idNumber.trim()) errors.push('ID Number is required');
    if (formData.personal.idNumber.trim().length !== 13) errors.push('ID Number must be exactly 13 digits');
    
    // Validate ID number format
    if (formData.personal.idNumber.length === 13 && !validateIDNumber(formData.personal.idNumber)) {
      errors.push('ID Number contains invalid date information');
    }
    
    // Check alignment between DOB and ID number
    if (formData.personal.dateOfBirth && formData.personal.idNumber.length === 13) {
      const idDate = extractDateFromID(formData.personal.idNumber);
      if (idDate && formData.personal.dateOfBirth !== idDate) {
        errors.push('Date of Birth does not match the date in your ID Number');
      }
    }
    
    if (!formData.personal.phone.trim()) errors.push('Phone is required');
    if (!formData.personal.email.trim()) errors.push('Email is required');
    if (!formData.personal.employmentStatus) errors.push('Employment Status is required');
    
    // Validate employer/university based on employment status
    if (formData.personal.employmentStatus === 'employed' && !formData.personal.employerName.trim()) {
      errors.push('Employer Name is required');
    }
    if (formData.personal.employmentStatus === 'student' && !formData.personal.employerName.trim()) {
      errors.push('University is required');
    }
    
    return errors;
  };

  const validateAddress = () => {
    const errors: string[] = [];
    if (!formData.address.streetAddress.trim()) errors.push('Street Address is required');
    if (!formData.address.city.trim()) errors.push('City is required');
    if (!formData.address.province) errors.push('Province is required');
    if (!formData.address.postalCode.trim()) errors.push('Postal Code is required');
    return errors;
  };

  const validateIncome = () => {
    const errors: string[] = [];
    if (!formData.income.monthlyIncome.trim()) errors.push('Monthly Income is required');
    if (!formData.income.incomeSource.trim()) errors.push('Source of Income is required');
    if (!formData.income.employmentType) errors.push('Employment Type is required');
    return errors;
  };

  const validateBank = () => {
    const errors: string[] = [];
    if (!formData.bank.bankName) errors.push('Bank Name is required');
    if (!formData.bank.accountNumber.trim()) errors.push('Account Number is required');
    if (!formData.bank.accountType) errors.push('Account Type is required');
    if (!formData.bank.branchCode.trim()) errors.push('Branch Code is required');
    return errors;
  };

  const validateDocuments = () => {
    const errors: string[] = [];
    if (!formData.documents.idDocument) errors.push('ID Document is required');
    if (!formData.documents.proofOfAddress) errors.push('Proof of Address is required');
    return errors;
  };

  // --- Data Fetching ---
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: userData } = await api.get('/api/user/profile');
      
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
        setKycStatus({
          status: data.status,
          rejection_reason: data.rejection_reason,
          submitted_at: data.created_at,
        });
        
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
          documents: prev.documents,
        }));
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
    // Validate current section before proceeding
    let errors: string[] = [];
    
    switch (activeTab) {
      case 'personal':
        errors = validatePersonal();
        break;
      case 'address':
        errors = validateAddress();
        break;
      case 'income':
        errors = validateIncome();
        break;
      case 'bank':
        errors = validateBank();
        break;
      case 'documents':
        errors = validateDocuments();
        break;
    }

    if (errors.length > 0) {
      setModalMessage(`Please fill in all required fields:\n${errors.join('\n')}`);
      setShowErrorModal(true);
      return;
    }

    // Save current section data before moving to next tab
    const currentSection = activeTab as keyof Omit<KYCFormData, 'documents'>;
    await saveKYCData(currentSection);
    setActiveTab(nextTab);
  };

  const handleDocumentUpload = async (field: keyof KYCFormData['documents'], file: File | null) => {
    handleFileChange(field, file);
    
    if (file) {
      setUploadingDocuments(prev => ({ ...prev, [field]: true }));
      
      try {
        const formDataToSend = new FormData();
        formDataToSend.append(`documents.${field}`, file);
        
        await api.patch('/api/kyc/update', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setUploadedDocuments(prev => ({ ...prev, [field]: 'Uploaded' }));
        
        const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        toast.success(`${fieldName} uploaded successfully!`);
      } catch (error: any) {
        console.error('Error uploading document:', error);
        const errorMessage = error.response?.data?.error || 'Failed to upload document. Please try again.';
        toast.error(errorMessage);
        handleFileChange(field, null);
        setUploadedDocuments(prev => ({ ...prev, [field]: '' }));
      } finally {
        setUploadingDocuments(prev => ({ ...prev, [field]: false }));
      }
    } else {
      setUploadedDocuments(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmitForVerification = async () => {
    // Validate all sections
    const personalErrors = validatePersonal();
    const addressErrors = validateAddress();
    const incomeErrors = validateIncome();
    const bankErrors = validateBank();
    const documentErrors = validateDocuments();

    const allErrors = [...personalErrors, ...addressErrors, ...incomeErrors, ...bankErrors, ...documentErrors];

    if (allErrors.length > 0) {
      setModalMessage(`Please complete all required fields before submitting:\n${allErrors.join('\n')}`);
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/kyc/submit');
      setModalMessage('Your KYC information has been submitted successfully for verification!');
      setShowSuccessModal(true);
      setKycStatus({ status: 'pending' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'An unexpected error occurred during submission.';
      setModalMessage(errorMessage);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBankChange = (bankName: string) => {
    setFormData(prev => ({
      ...prev,
      bank: {
        ...prev.bank,
        bankName,
        branchCode: bankBranchCodes[bankName] || "",
      }
    }));
  };

  // --- Modal Components ---
  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Success!</h3>
          <button 
            onClick={() => setShowSuccessModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
          <p className="text-gray-700 dark:text-dark-text">{modalMessage}</p>
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
      <div className="bg-white dark:bg-dark-card rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error</h3>
          <button 
            onClick={() => setShowErrorModal(false)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center mb-4">
          <XCircle className="h-8 w-8 text-red-500 mr-3" />
          <p className="text-gray-700 dark:text-dark-text whitespace-pre-line">{modalMessage}</p>
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
    <div className="flex border-b dark:border-dark-border mb-6">
      {['personal', 'address', 'income', 'bank', 'documents'].map(tab => (
        <button key={tab} className={`capitalize py-2 px-4 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`} onClick={() => setActiveTab(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );

  const renderPersonalDetails = () => {
    // Extract date from ID number for comparison
    const idDate = formData.personal.idNumber.length === 13 ? extractDateFromID(formData.personal.idNumber) : null;
    const isDateMismatch = formData.personal.dateOfBirth && idDate && formData.personal.dateOfBirth !== idDate;
    const isIDValid = formData.personal.idNumber.length === 13 && validateIDNumber(formData.personal.idNumber);

    return (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Personal Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input 
              type="text" 
              value={formData.personal.fullName} 
              onChange={e => handleInputChange('personal', 'fullName', e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date of Birth <span className="text-red-600">*</span>
            </label>
            <input 
              type="date" 
              value={formData.personal.dateOfBirth} 
              onChange={e => handleInputChange('personal', 'dateOfBirth', e.target.value)} 
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ${
                isDateMismatch ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
            />
            {isDateMismatch && (
              <p className="mt-1 text-sm text-red-600">
                Date of Birth does not match the date in your ID Number
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              ID Number <span className="text-red-600">*</span>
            </label>
            <input 
              type="text" 
              value={formData.personal.idNumber} 
              onChange={e => {
                // Only allow numbers and limit to 13 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 13);
                handleInputChange('personal', 'idNumber', value);
              }}
              maxLength={13}
              placeholder="Enter 13-digit ID number (YYMMDD)"
              className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm ${
                formData.personal.idNumber.length > 0 && (formData.personal.idNumber.length !== 13 || !isIDValid) 
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                  : ''
              }`}
            />
            {formData.personal.idNumber.length > 0 && formData.personal.idNumber.length !== 13 && (
              <p className="mt-1 text-sm text-red-600">
                ID Number must be exactly 13 digits
              </p>
            )}
            {formData.personal.idNumber.length === 13 && !isIDValid && (
              <p className="mt-1 text-sm text-red-600">
                ID Number contains invalid date information
              </p>
            )}
            {formData.personal.idNumber.length === 13 && isIDValid && idDate && (
              <p className="mt-1 text-sm text-green-600">
                ID Number date: {new Date(idDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone <span className="text-red-600">*</span>
            </label>
            <input 
              type="text" 
              value={formData.personal.phone} 
              onChange={e => handleInputChange('personal', 'phone', e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email <span className="text-red-600">*</span>
            </label>
            <input 
              type="email" 
              value={formData.personal.email} 
              onChange={e => handleInputChange('personal', 'email', e.target.value)} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Employment Status <span className="text-red-600">*</span>
            </label>
            <select 
              value={formData.personal.employmentStatus} 
              onChange={e => {
                handleInputChange('personal', 'employmentStatus', e.target.value);
                // Clear employer/university when status changes
                if (e.target.value !== 'employed' && e.target.value !== 'student') {
                  handleInputChange('personal', 'employerName', '');
                }
              }} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
            >
              <option value="">Select...</option>
              <option value="employed">Employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="student">Student</option>
            </select>
          </div>
          
          {/* Show employer name field only for employed */}
          {formData.personal.employmentStatus === 'employed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Employer Name <span className="text-red-600">*</span>
              </label>
              <input 
                type="text" 
                value={formData.personal.employerName} 
                onChange={e => handleInputChange('personal', 'employerName', e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
              />
            </div>
          )}

          {/* Show university dropdown only for students */}
          {formData.personal.employmentStatus === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                University <span className="text-red-600">*</span>
              </label>
              <select 
                value={formData.personal.employerName} 
                onChange={e => handleInputChange('personal', 'employerName', e.target.value)} 
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              >
                <option value="">Select University...</option>
                {universities.map(university => (
                  <option key={university} value={university}>{university}</option>
                ))}
              </select>
            </div>
          )}

        <div className="flex justify-end mt-6">
          <button
            onClick={() => handleSaveAndContinue('address')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save & Continue
          </button>
        </div>
    </div>
  );
  };

  const renderAddress = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">Residential Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Street Address <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={formData.address.streetAddress} 
            onChange={e => handleInputChange('address', 'streetAddress', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            City <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={formData.address.city} 
            onChange={e => handleInputChange('address', 'city', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Province <span className="text-red-600">*</span>
          </label>
          <select 
            value={formData.address.province} 
            onChange={e => handleInputChange('address', 'province', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          >
            <option value="">Select Province...</option>
            {provinces.map(province => <option key={province} value={province}>{province}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Postal Code <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={formData.address.postalCode} 
            onChange={e => handleInputChange('address', 'postalCode', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label>
          <input 
            type="text" 
            value={formData.address.country} 
            readOnly 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm" 
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={() => setActiveTab('personal')} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
          Back
        </button>
        <button onClick={() => handleSaveAndContinue('income')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save & Continue
        </button>
      </div>
    </div>
  );

  const renderIncome = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">Income Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Estimated Monthly Income (ZAR) <span className="text-red-600">*</span>
          </label>
          <input 
            type="number" 
            value={formData.income.monthlyIncome} 
            onChange={e => handleInputChange('income', 'monthlyIncome', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Source of Income <span className="text-red-600">*</span>
          </label>
          <input 
            type="text" 
            value={formData.income.incomeSource} 
            onChange={e => handleInputChange('income', 'incomeSource', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Employment Type <span className="text-red-600">*</span>
          </label>
          <select 
            value={formData.income.employmentType} 
            onChange={e => handleInputChange('income', 'employmentType', e.target.value)} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          >
            <option value="">Select Employment Type...</option>
            {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={() => setActiveTab('address')} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
          Back
        </button>
        <button onClick={() => handleSaveAndContinue('bank')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save & Continue
        </button>
      </div>
    </div>
  );

  const renderBankDetails = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">Bank Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bank Name <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.bank.bankName}
            onChange={e => handleBankChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          >
            <option value="">Select Bank...</option>
            {bankNames.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account Number <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.bank.accountNumber}
            onChange={e => handleInputChange('bank', 'accountNumber', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account Type <span className="text-red-600">*</span>
          </label>
          <select
            value={formData.bank.accountType}
            onChange={e => handleInputChange('bank', 'accountType', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          >
            <option value="">Select Account Type...</option>
            {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Branch Code <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.bank.branchCode}
            onChange={e => handleInputChange('bank', 'branchCode', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={() => setActiveTab('income')} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
          Back
        </button>
        <button onClick={() => handleSaveAndContinue('documents')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save & Continue
        </button>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Upload Documents</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Please upload the required documents to complete your verification process. 
        <span className="text-red-600 font-medium">* Required documents must be uploaded before submission.</span>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID Document */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ID Document <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="idDocument" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="idDocument" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('idDocument', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.idDocument && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.idDocument && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.idDocument.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.idDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.idDocument && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Proof of Address <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="proofOfAddress" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="proofOfAddress" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('proofOfAddress', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.proofOfAddress && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.proofOfAddress && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.proofOfAddress.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.proofOfAddress.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.proofOfAddress && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Proof of Income <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="proofOfIncome" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="proofOfIncome" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('proofOfIncome', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.proofOfIncome && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.proofOfIncome && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.proofOfIncome.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.proofOfIncome.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.proofOfIncome && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Statement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bank Statement <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="bankStatement" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="bankStatement" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('bankStatement', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.bankStatement && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.bankStatement && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.bankStatement.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.bankStatement.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.bankStatement && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.idDocument ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.idDocument ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              ID Document {uploadedDocuments.idDocument ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.proofOfAddress ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.proofOfAddress ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              Proof of Address {uploadedDocuments.proofOfAddress ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.proofOfIncome ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.proofOfIncome ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              Proof of Income {uploadedDocuments.proofOfIncome ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.bankStatement ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.bankStatement ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
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

  const renderReadOnlyPersonalDetails = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Personal Information</h3>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
        <div className="mt-1">{formData.personal.fullName}</div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
        <div className="mt-1">{formData.personal.dateOfBirth}</div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Number</label>
        <div className="mt-1">{formData.personal.idNumber}</div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
        <div className="mt-1">{formData.personal.phone}</div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
        <div className="mt-1">{formData.personal.email}</div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employment Status</label>
        <div className="mt-1">{formData.personal.employmentStatus}</div>
      </div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employer Name</label>
        <div className="mt-1">{formData.personal.employerName}</div>
      </div>
    </div>
  );

  const renderReadOnlyAddress = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">Residential Address</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Street Address</label><div className="mt-1">{formData.address.streetAddress}</div></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City</label><div className="mt-1">{formData.address.city}</div></div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Province</label>
          <div className="mt-1">{formData.address.province}</div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Postal Code</label><div className="mt-1">{formData.address.postalCode}</div></div>
        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Country</label><div className="mt-1">{formData.address.country}</div></div>
      </div>
    </div>
  );

  const renderReadOnlyIncome = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">Income Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Monthly Income (ZAR)</label><div className="mt-1">{formData.income.monthlyIncome}</div></div>
      <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source of Income</label><div className="mt-1">{formData.income.incomeSource}</div></div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Employment Type</label>
        <div className="mt-1">{formData.income.employmentType}</div>
        </div>
      </div>
    </div>
  );

  const renderReadOnlyBankDetails = () => (
    <div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-dark-text">Bank Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bank Name</label>
          <div className="mt-1">{formData.bank.bankName}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Number</label>
          <div className="mt-1">{formData.bank.accountNumber}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
          <div className="mt-1">{formData.bank.accountType}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Branch Code</label>
          <div className="mt-1">{formData.bank.branchCode}</div>
        </div>
      </div>
    </div>
  );

  const renderReadOnlyDocuments = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text">Upload Documents</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Please upload the required documents to complete your verification process. 
        <span className="text-red-600 font-medium">* Required documents must be uploaded before submission.</span>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ID Document */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            ID Document <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="idDocument" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="idDocument" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('idDocument', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.idDocument && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.idDocument && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.idDocument.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.idDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.idDocument && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Proof of Address <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="proofOfAddress" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="proofOfAddress" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('proofOfAddress', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.proofOfAddress && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.proofOfAddress && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.proofOfAddress.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.proofOfAddress.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.proofOfAddress && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proof of Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Proof of Income <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="proofOfIncome" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="proofOfIncome" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('proofOfIncome', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.proofOfIncome && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.proofOfIncome && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.proofOfIncome.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.proofOfIncome.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.proofOfIncome && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bank Statement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bank Statement <span className="text-red-600">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <div className="space-y-1 text-center">
              <FileUp className="mx-auto h-12 w-12 text-gray-400" />
              <label htmlFor="bankStatement" className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                <input 
                  id="bankStatement" 
                  type="file" 
                  className="sr-only" 
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => handleDocumentUpload('bankStatement', e.target.files?.[0] || null)} 
                />
                <span>Upload a file</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG, PNG, DOC up to 10MB</p>
              
              {/* Upload Status */}
              {uploadingDocuments.bankStatement && (
                <div className="mt-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Uploading...</p>
                  </div>
                </div>
              )}
              
              {formData.documents.bankStatement && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{formData.documents.bankStatement.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(formData.documents.bankStatement.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadedDocuments.bankStatement && (
                    <div className="flex items-center justify-center mt-1">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600 dark:text-green-400">Uploaded</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Summary */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.idDocument ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.idDocument ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              ID Document {uploadedDocuments.idDocument ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.proofOfAddress ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.proofOfAddress ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              Proof of Address {uploadedDocuments.proofOfAddress ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.proofOfIncome ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.proofOfIncome ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              Proof of Income {uploadedDocuments.proofOfIncome ? '✓' : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${uploadedDocuments.bankStatement ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            <span className={uploadedDocuments.bankStatement ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
              Bank Statement {uploadedDocuments.bankStatement ? '✓' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatusCard = () => {
    const { status, rejection_reason, submitted_at } = kycStatus;
    
    const submittedAtJsx = submitted_at && (
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Submitted on: {new Date(submitted_at).toLocaleString()}
      </p>
    );

    switch (status) {
      case 'draft':
        return (
          <div className="mb-6 border-l-4 p-4 rounded-md bg-gray-50 dark:bg-gray-800/50 border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300">
            <div className="flex items-center">
              <FileText className="h-8 w-8 mr-4 text-gray-500 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-bold">Draft Status</h3>
                <p className="mt-1 text-sm">Complete your KYC information and submit for verification.</p>
              </div>
            </div>
          </div>
        );
      case 'pending':
        return (
          <div className="mb-6 border-l-4 p-4 rounded-md bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-800 dark:text-blue-200">
            <div className="flex items-center">
              <Clock className="h-8 w-8 mr-4 text-blue-500 dark:text-blue-400" />
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
          <div className="mb-6 border-l-4 p-4 rounded-md bg-green-50 dark:bg-green-900/50 border-green-500 text-green-800 dark:text-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 mr-4 text-green-500 dark:text-green-400" />
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
          <div className="mb-6 border-l-4 p-4 rounded-md bg-red-50 dark:bg-red-900/50 border-red-500 text-red-800 dark:text-red-200">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 mr-4 text-red-500 dark:text-red-400" />
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
      <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-dark-text">KYC Verification</h2>
      
      {renderStatusCard()}

      {/* Show Congratulations or Rejection screen if approved/rejected and showCongrats is true */}
      {(kycStatus.status === "approved" && showCongrats) && (
        <div className="flex flex-col items-center justify-center h-96">
          <h1 className="text-3xl font-bold text-green-700 mb-4">CONGRATULATIONS, {formData.personal.fullName.toUpperCase()}!</h1>
          <p className="text-lg mb-6">Your KYC application has been approved.</p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setShowCongrats(false)}
          >
            Back
          </button>
        </div>
      )}

      {(kycStatus.status === "rejected" && showCongrats) && (
        <div className="flex flex-col items-center justify-center h-96">
          <h1 className="text-3xl font-bold text-red-700 mb-4">SORRY, {formData.personal.fullName.toUpperCase()}!</h1>
          <p className="text-lg mb-2">Your KYC application was rejected.</p>
          <p className="text-md text-gray-700 mb-6">Reason: {kycStatus.rejection_reason || "No reason provided."}</p>
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => setShowCongrats(false)}
          >
            Back
          </button>
        </div>
      )}

      {/* Only show editable form if draft or not_submitted */}
      {(kycStatus.status === "draft" || kycStatus.status === "not_submitted") && (
        <>
          {renderTabs()}
          <div className="mt-6">
            {activeTab === 'personal' && renderPersonalDetails()}
            {activeTab === 'address' && renderAddress()}
            {activeTab === 'income' && renderIncome()}
            {activeTab === 'bank' && renderBankDetails()}
            {activeTab === 'documents' && renderDocuments()}
          </div>
        </>
      )}

      {/* Render read-only tabs if status is approved/pending/rejected */}
      {(kycStatus.status === "approved" || kycStatus.status === "pending" || kycStatus.status === "rejected") && !showCongrats && (
        <>
          {renderTabs()}
          <div className="mt-6">
            {activeTab === 'personal' && renderReadOnlyPersonalDetails()}
            {activeTab === 'address' && renderReadOnlyAddress()}
            {activeTab === 'income' && renderReadOnlyIncome()}
            {activeTab === 'bank' && renderReadOnlyBankDetails()}
            {activeTab === 'documents' && renderReadOnlyDocuments()}
          </div>
        </>
      )}

      {/* Modals */}
      {showSuccessModal && <SuccessModal />}
      {showErrorModal && <ErrorModal />}
    </div>
  );
};

export default KYC;
