import { useEffect, useState } from 'react';
import { referralAPI } from '../services/api';
import { toast } from 'react-hot-toast';

interface Reward {
  key: string;
  description: string;
  points: number;
  image?: string;
}

interface Referral {
  name: string;
  email: string;
  status: 'pending' | 'completed';
  points: number;
}

const ReferralDashboard = () => {
  const [details, setDetails] = useState<any>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    referralAPI.getReferralDetails()
      .then(res => setDetails(res.data))
      .catch(() => toast.error('Failed to load referral details'));

    // Mock referrals data - replace with actual API call
    setReferrals([
      { name: 'Bongiwe', email: 'leano@gmail.com', status: 'pending', points: 0 },
      { name: 'Ntando', email: 'ntandombele7@gmail.com', status: 'pending', points: 0 },
      { name: 'Ntando', email: 'ntandombele15@gmail.com', status: 'completed', points: 30 },
      { name: 'Leano', email: 'leanoncebo@gmail.com', status: 'completed', points: 30 },
    ]);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(details?.referral_link || '');
    toast.success('Referral link copied!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ url: details?.referral_link || '' });
    } else {
      handleCopy();
    }
  };

  if (!details) return <div className="flex justify-center items-center h-64">Loading...</div>;

  const completedReferrals = referrals.filter(ref => ref.status === 'completed').length;
  const totalPoints = referrals.reduce((sum, ref) => sum + ref.points, 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Refer & Earn Rewards!</h1>
        <p className="text-gray-600 text-lg mb-6">
          Earn points by inviting friends to iStokvel! Share your referral link—when your friend signs up and verifies, you earn points:
        </p>
        
        {/* Rules */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-700">First referral: 20 points</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-700">Each after: 30 points</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="text-gray-700">Every 3rd referral: 100 bonus points</span>
          </div>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            value={details.referral_link || 'http://localhost:5173/signup?ref=540998'}
            readOnly
            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-700 font-mono text-sm"
          />
          <button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            onClick={handleCopy}
          >
            Copy
          </button>
          <button
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            onClick={handleShare}
          >
            Share
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-green-600 font-semibold text-sm uppercase tracking-wide">SIGNED UP</div>
              <div className="text-3xl font-bold text-gray-800">{completedReferrals}</div>
              <div className="text-gray-500 text-sm">friends</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <div className="text-red-600 font-semibold text-sm uppercase tracking-wide">POINTS</div>
              <div className="text-3xl font-bold text-gray-800">{totalPoints}</div>
              <div className="text-gray-500 text-sm">earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Your Referrals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrals.map((referral, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {referral.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {referral.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      referral.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {referral.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redeem Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-2 p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedReward(null)}
            >
              &times;
            </button>
            <div className="flex flex-col items-center">
              <img src={selectedReward.image} alt={selectedReward.description} className="w-20 h-20 object-contain mb-4" />
              <h2 className="text-xl font-bold mb-2">{selectedReward.description}</h2>
              <div className="text-blue-600 font-semibold mb-4">{selectedReward.points} Points</div>
              <button
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium mt-2"
                onClick={async () => {
                  try {
                    await referralAPI.redeemReward(selectedReward.key);
                    toast.success('Reward redeemed successfully!');
                    setSelectedReward(null);
                    // Update points in UI
                    setDetails((prev: any) => ({
                      ...prev,
                      points: (prev.points ?? 0) - selectedReward.points
                    }));
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Redemption failed');
                  }
                }}
              >
                Confirm Redemption
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralDashboard;
