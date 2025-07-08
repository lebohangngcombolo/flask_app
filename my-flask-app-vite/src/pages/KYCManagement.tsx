import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Eye, 
  Search,
  Filter,
  FileText,
  User,
  Calendar,
  Building,
  CreditCard,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

interface KYCSubmission {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  employment_status: string;
  bank_name: string;
  account_number: string;
  id_document_path: string;
  proof_of_address_path: string;
  proof_of_income_path: string;
  bank_statement_path: string;
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
}

const KYCManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | null>(null);
  const [previewLabel, setPreviewLabel] = useState<string>('');

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/kyc/submissions');
      setSubmissions(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch KYC submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submissionId: number) => {
    try {
      await api.post(`/api/admin/kyc/${submissionId}/approve`);
      toast.success('KYC submission approved successfully');
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve submission');
    }
  };

  const handleReject = async (submissionId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await api.post(`/api/admin/kyc/${submissionId}/reject`, {
        rejection_reason: rejectionReason
      });
      toast.success('KYC submission rejected successfully');
      setRejectionReason('');
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject submission');
    }
  };

  const downloadDocument = async (filename: string) => {
    try {
      const response = await api.get(`/api/kyc/document/${filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error('Failed to download document');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.id_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getDocUrl = (docPath: string | null) => {
    if (!docPath) return null;
    const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
    if (docPath.includes('kyc_docs/')) {
      const filename = docPath.split('kyc_docs/').pop();
      return `${backendUrl}/uploads/kyc_docs/${filename}`;
    }
    if (docPath.startsWith('/')) {
      return `${backendUrl}${docPath}`;
    }
    return `${backendUrl}/${docPath}`;
  };

  function DocPreview({ docPath, label, onPreview }: { docPath: string | null, label: string, onPreview: (url: string, type: 'image' | 'pdf', label: string) => void }) {
    const url = getDocUrl(docPath);
    const [imgError, setImgError] = useState(false);
    const [loading, setLoading] = useState(true);

    if (!url) {
      return (
        <div className="flex flex-col items-center text-gray-400">
          <FileText className="w-8 h-8 mb-1" />
          <span className="text-xs italic">No file</span>
        </div>
      );
    }

    if (/\.(jpg|jpeg|png)$/i.test(url)) {
      return (
        <div className="flex flex-col items-center group">
          {loading && !imgError && (
            <div className="w-[100px] h-[100px] bg-gray-100 animate-pulse rounded mb-1" />
          )}
          {!imgError ? (
            <img
              src={url}
              alt={label}
              className={`rounded shadow max-w-[100px] max-h-[100px] object-cover border transition-transform duration-200 group-hover:scale-105 cursor-pointer ${loading ? 'hidden' : ''}`}
              onError={() => setImgError(true)}
              onLoad={() => setLoading(false)}
              title={label}
              onClick={() => onPreview(url, 'image', label)}
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="w-8 h-8 mb-1" />
              <span className="text-xs italic">Image not available</span>
            </div>
          )}
          <a
            href={url}
            download
            className="mt-2 text-xs text-blue-600 underline hover:text-blue-800 transition-colors"
            title={`Download ${label}`}
          >
            Download
          </a>
        </div>
      );
    }
    if (/\.pdf$/i.test(url)) {
      return (
        <div className="flex flex-col items-center group">
          <div
            className="w-[100px] h-[120px] border rounded group-hover:shadow-lg transition-shadow flex items-center justify-center bg-gray-50 cursor-pointer"
            onClick={() => onPreview(url, 'pdf', label)}
            title={`Preview ${label}`}
          >
            <FileText className="w-8 h-8 text-gray-400" />
            <span className="text-xs text-gray-500 ml-2">PDF</span>
          </div>
          <a
            href={url}
            download
            className="mt-2 text-xs text-blue-600 underline hover:text-blue-800 transition-colors"
            title={`Download ${label}`}
          >
            Download PDF
          </a>
        </div>
      );
    }
    return (
      <a
        href={url}
        download
        className="text-blue-600 underline hover:text-blue-800 transition-colors"
        title={`Download ${label}`}
      >
        Download
      </a>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[#1a237e]">KYC Management</h2>
          <div className="flex items-center gap-4">
            <span className="text-gray-500">Total: {submissions.length}</span>
            <button className="bg-[#e8eaf6] text-[#1a237e] px-3 py-1 rounded-lg font-semibold">
              <User className="inline w-4 h-4 mr-1" /> Pending: {submissions.filter(s => s.status === 'pending').length}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name, email, or ID number..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#3949ab] focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="w-full text-left rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-[#e8eaf6] text-[#1a237e]">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Documents</th>
              <th className="py-3 px-4">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id} className="border-b last:border-b-0 hover:bg-[#f5f5f5] transition">
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                    ${submission.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {submission.status}
                  </span>
                </td>
                <td className="py-3 px-4 flex gap-3">
                  <div>
                    <span className="block text-xs text-gray-500">ID</span>
                    <a href={getDocUrl(submission.id_document_path)} download className="text-[#3949ab] underline">Download</a>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Proof of Address</span>
                    <a href={getDocUrl(submission.proof_of_address_path)} download className="text-[#3949ab] underline">Download</a>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Proof of Income</span>
                    <a href={getDocUrl(submission.proof_of_income_path)} download className="text-[#3949ab] underline">Download</a>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Bank Statement</span>
                    <a href={getDocUrl(submission.bank_statement_path)} download className="text-[#3949ab] underline">Download</a>
                  </div>
                </td>
                <td className="py-3 px-4">{new Date(submission.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setSelectedSubmission(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6">Review KYC: {selectedSubmission.user_name}</h2>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <DocPreview docPath={selectedSubmission.id_document_path} label="ID Document" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
              <DocPreview docPath={selectedSubmission.proof_of_address_path} label="Proof of Address" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
              <DocPreview docPath={selectedSubmission.proof_of_income_path} label="Proof of Income" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
              <DocPreview docPath={selectedSubmission.bank_statement_path} label="Bank Statement" onPreview={(url, type, label) => { setPreviewUrl(url); setPreviewType(type); setPreviewLabel(label); }} />
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">Approve</button>
              <button className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">Reject</button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-white rounded-lg shadow-lg p-4 max-w-3xl w-full flex flex-col items-center">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setPreviewUrl(null)}
              title="Close"
            >
              &times;
            </button>
            <div className="mb-4 text-lg font-semibold">{previewLabel}</div>
            {previewType === 'image' ? (
              <img src={previewUrl} alt={previewLabel} className="max-h-[70vh] max-w-full rounded shadow" />
            ) : (
              <iframe src={previewUrl} title={previewLabel} className="w-full h-[70vh] rounded shadow" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement; 