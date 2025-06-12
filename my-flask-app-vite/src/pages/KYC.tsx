import { useState, useEffect } from 'react';
import { AlertCircle, Upload } from 'lucide-react';
import { userNavItems, marketplaceNavItem } from '../navItems';
import { toast } from 'react-toastify';
import api from '../services/api';

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
    idDocument: File | null;
    proofOfAddress: File | null;
    proofOfIncome: File | null;
    bankStatement: File | null;
  };
}

const tabs = [
  { id: 'personal', label: 'Personal Details' },
  { id: 'address', label: 'Address' },
  { id: 'income', label: 'Income Verification' },
  { id: 'bank', label: 'Bank Details' },
  { id: 'documents', label: 'Documents' },
];

export default function KYCPage() {
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState<KYCFormData>({
    personal: {
      fullName: '',
      dateOfBirth: '',
      idNumber: '',
      phone: '',
      email: '',
      employmentStatus: '',
      employerName: '',
    },
    address: {
      streetAddress: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'South Africa',
    },
    income: {
      monthlyIncome: '',
      incomeSource: '',
      employmentType: '',
    },
    bank: {
      bankName: '',
      accountNumber: '',
      accountType: '',
      branchCode: '',
    },
    documents: {
      idDocument: null,
      proofOfAddress: null,
      proofOfIncome: null,
      bankStatement: null,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user data from localStorage first
        const storedUser = localStorage.getItem('user');
        const userData = storedUser ? JSON.parse(storedUser) : null;

        // Pre-fill form with available user data
        if (userData) {
          setFormData(prev => ({
            ...prev,
            personal: {
              ...prev.personal,
              fullName: userData.name || '',
              email: userData.email || '',
              phone: userData.phone || '',
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load user data');
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (section: keyof KYCFormData, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (field: keyof KYCFormData['documents'], file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For now, just log the form data instead of sending to API
      console.log('Form Data:', formData);
      
      // Show success message
      toast.success('KYC form submitted successfully! (Demo mode)');
      
      // You can add this back when the backend is ready:
      /*
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([section, data]) => {
        if (section === 'documents') {
          Object.entries(data).forEach(([field, file]) => {
            if (file) {
              formDataToSend.append(`documents.${field}`, file);
            }
          });
        } else {
          Object.entries(data).forEach(([field, value]) => {
            formDataToSend.append(`${section}.${field}`, value);
          });
        }
      });

      await api.post('/api/kyc/submit', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      */
    } catch (error) {
      console.error('Error submitting KYC:', error);
      toast.error('Failed to submit KYC. Please try again.');
    }
  };

  const renderPersonalDetails = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Personal Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={formData.personal.fullName}
            onChange={(e) => handleInputChange('personal', 'fullName', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.personal.dateOfBirth}
            onChange={(e) => handleInputChange('personal', 'dateOfBirth', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">ID Number</label>
          <input
            type="text"
            value={formData.personal.idNumber}
            onChange={(e) => handleInputChange('personal', 'idNumber', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.personal.phone}
            onChange={(e) => handleInputChange('personal', 'phone', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Employment Status</label>
          <select
            value={formData.personal.employmentStatus}
            onChange={(e) => handleInputChange('personal', 'employmentStatus', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Status</option>
            <option value="employed">Employed</option>
            <option value="self-employed">Self-Employed</option>
            <option value="unemployed">Unemployed</option>
            <option value="student">Student</option>
            <option value="retired">Retired</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Employer Name</label>
          <input
            type="text"
            value={formData.personal.employerName}
            onChange={(e) => handleInputChange('personal', 'employerName', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required={formData.personal.employmentStatus === 'employed'}
          />
        </div>
      </div>
    </div>
  );

  const renderAddress = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Address Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-gray-700 font-medium mb-1">Street Address</label>
          <input
            type="text"
            value={formData.address.streetAddress}
            onChange={(e) => handleInputChange('address', 'streetAddress', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">City</label>
          <input
            type="text"
            value={formData.address.city}
            onChange={(e) => handleInputChange('address', 'city', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Province</label>
          <select
            value={formData.address.province}
            onChange={(e) => handleInputChange('address', 'province', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Province</option>
            <option value="Eastern Cape">Eastern Cape</option>
            <option value="Free State">Free State</option>
            <option value="Gauteng">Gauteng</option>
            <option value="KwaZulu-Natal">KwaZulu-Natal</option>
            <option value="Limpopo">Limpopo</option>
            <option value="Mpumalanga">Mpumalanga</option>
            <option value="Northern Cape">Northern Cape</option>
            <option value="North West">North West</option>
            <option value="Western Cape">Western Cape</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Postal Code</label>
          <input
            type="text"
            value={formData.address.postalCode}
            onChange={(e) => handleInputChange('address', 'postalCode', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderIncome = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Income Verification</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Monthly Income (R)</label>
          <input
            type="number"
            value={formData.income.monthlyIncome}
            onChange={(e) => handleInputChange('income', 'monthlyIncome', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Income Source</label>
          <select
            value={formData.income.incomeSource}
            onChange={(e) => handleInputChange('income', 'incomeSource', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Source</option>
            <option value="salary">Salary</option>
            <option value="business">Business</option>
            <option value="investments">Investments</option>
            <option value="pension">Pension</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Employment Type</label>
          <select
            value={formData.income.employmentType}
            onChange={(e) => handleInputChange('income', 'employmentType', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Type</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
            <option value="self-employed">Self Employed</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderBankDetails = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Bank Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1">Bank Name</label>
          <select
            value={formData.bank.bankName}
            onChange={(e) => handleInputChange('bank', 'bankName', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Bank</option>
            <option value="absa">ABSA</option>
            <option value="fnb">First National Bank</option>
            <option value="nedbank">Nedbank</option>
            <option value="standard-bank">Standard Bank</option>
            <option value="capitec">Capitec</option>
            <option value="african-bank">African Bank</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Account Number</label>
          <input
            type="text"
            value={formData.bank.accountNumber}
            onChange={(e) => handleInputChange('bank', 'accountNumber', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Account Type</label>
          <select
            value={formData.bank.accountType}
            onChange={(e) => handleInputChange('bank', 'accountType', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          >
            <option value="">Select Type</option>
            <option value="savings">Savings</option>
            <option value="cheque">Cheque</option>
            <option value="transmission">Transmission</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-1">Branch Code</label>
          <input
            type="text"
            value={formData.bank.branchCode}
            onChange={(e) => handleInputChange('bank', 'branchCode', e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-xl font-bold text-blue-700 mb-4">Required Documents</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-1">ID Document</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('idDocument', e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Upload a clear copy of your ID document</p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Proof of Address</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('proofOfAddress', e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Upload a recent utility bill or bank statement (not older than 3 months)</p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Proof of Income</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('proofOfIncome', e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Upload your latest payslip or bank statement showing salary deposits</p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-1">Bank Statement</label>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange('bankStatement', e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Upload your latest bank statement (not older than 3 months)</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-200 via-blue-100 to-yellow-100 p-6">
        <div className="max-w-3xl mx-auto mt-10">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm transition-colors duration-200 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <form onSubmit={handleSubmit}>
            {activeTab === 'personal' && renderPersonalDetails()}
            {activeTab === 'address' && renderAddress()}
            {activeTab === 'income' && renderIncome()}
            {activeTab === 'bank' && renderBankDetails()}
            {activeTab === 'documents' && renderDocuments()}

            {/* Submit Button */}
            <div className="mt-8">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                Submit for Verification
                </button>
            </div>
              </form>

          {/* Privacy Notice */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-gray-700">Privacy Notice</h3>
                <p className="text-xs text-gray-500 mt-1">
                Your documents are encrypted and securely stored. We comply with all FICA/AML regulations.
                  Your information will only be used for verification purposes and will not be shared with third parties.
              </p>
            </div>
            </div>
            </div>
        </div>
      </div>
    </>
  );
}
