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
  CreditCard
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">KYC Management</h2>
        <div className="text-sm text-gray-600">
          Total: {submissions.length} | Pending: {submissions.filter(s => s.status === 'pending').length}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, email, or ID number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Submissions Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documents
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{submission.full_name}</div>
                    <div className="text-sm text-gray-500">{submission.user_email}</div>
                    <div className="text-xs text-gray-400">ID: {submission.id_number}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(submission.status)}
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    {submission.id_document_path && (
                      <button
                        onClick={() => downloadDocument(submission.id_document_path.split('/').pop()!)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        ID
                      </button>
                    )}
                    {submission.proof_of_address_path && (
                      <button
                        onClick={() => downloadDocument(submission.proof_of_address_path.split('/').pop()!)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Address
                      </button>
                    )}
                    {submission.proof_of_income_path && (
                      <button
                        onClick={() => downloadDocument(submission.proof_of_income_path.split('/').pop()!)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Income
                      </button>
                    )}
                    {submission.bank_statement_path && (
                      <button
                        onClick={() => downloadDocument(submission.bank_statement_path.split('/').pop()!)}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Bank
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(submission.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {submission.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(submission.id)}
                        className="text-green-600 hover:text-green-900 text-xs flex items-center"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedSubmission(submission)}
                        className="text-red-600 hover:text-red-900 text-xs flex items-center"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  )}
                  {submission.status === 'rejected' && submission.rejection_reason && (
                    <div className="text-xs text-red-600 max-w-xs truncate" title={submission.rejection_reason}>
                      Reason: {submission.rejection_reason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rejection Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject KYC Submission
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting {selectedSubmission.full_name}'s KYC submission.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleReject(selectedSubmission.id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedSubmission(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement; 