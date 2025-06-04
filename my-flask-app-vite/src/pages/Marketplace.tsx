import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout'; // Assuming DashboardLayout is the correct layout component
import {
  Archive, // Example icon for Marketplace tab
  Heart, // Example icon for My Offers
  Package, // Example icon for Track Orders
  Users, // Example icon for Partner Portal
  PiggyBank, // Example icon for Savings
  ShoppingBasket, // Example icon for Grocery
  Cross, // Example icon for Burial
  Briefcase, // Example icon for Business
  TrendingUp, // Example icon for Investment
  ShoppingBag, // Example icon for Marketplace offer card
  ShieldCheck, // Example icon for Verified badge
  User as UserIcon, // Alias User to avoid conflict
  CreditCard,
  CheckCircle,
  DollarSign,
  Activity,
  Shield,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  BarChart2,
  MessageSquare,
  Home,
  FileText,
  UserPlus,
  ArrowLeft // Import the ArrowLeft icon
} from 'lucide-react'; // Import necessary icons
import { toast } from 'react-hot-toast';


// --- Mock Data for Offers ---
interface Offer {
  id: number;
  title: string;
  description: string;
  provider?: string; // e.g., "from AVBOB"
  logo?: string; // Path to logo image if available
  tags?: string[]; // e.g., ["Marketrw", "Travel"]
  verified?: boolean;
  buttonText?: string;
  buttonLink?: string;
}

const mockOffers: Offer[] = [
  {
    id: 1,
    title: 'R200 OFF Bulk Grocery Combo',
    description: 'Save big when your stokvel buys in bulk.',
    logo: '/path/to/marketrw-logo.png', // Placeholder logo path
    tags: ['Marketrw'],
    verified: false, // Example, can be true if needed
    buttonText: 'Use This Offer with My Stokvel',
    buttonLink: '/marketplace/offer/1' // Example link
  },
  {
    id: 2,
    title: 'Burial Plan',
    provider: 'from AVBOB',
    description: 'Affordable family funeral cover.',
    tags: ['Tiseficel'], // Example tag
    verified: false,
    buttonText: 'Learn More', // Example button for non-direct offers
    buttonLink: '/marketplace/offer/2' // Example link
  },
  {
    id: 3,
    title: 'Save R500 on Durban Trip',
    description: 'Plan your stokvel holiday with us.',
    tags: ['Travel'],
    verified: false,
    buttonText: 'View Packages', // Example button
    buttonLink: '/marketplace/offer/3' // Example link
  },
   {
    id: 4,
    title: 'R200 OFF Bulk Grocery Combo', // Duplicating the grocery offer to show the "Verified" version
    description: 'Save big when your stokvel buys in bulk.\nOffered by Makro Wholesalers', // Added multiline description
    provider: 'Offered by Makro Wholesalers',
    verified: true,
    buttonText: 'Use This Offer with My Stokvel',
    buttonLink: '/marketplace/offer/4' // Example link
  }
  // Add more mock offers as needed
];


// --- Offer Card Component ---
interface OfferCardProps {
  offer: Offer;
  navigate: ReturnType<typeof useNavigate>;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, navigate }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
         {offer.provider && <p className="text-sm text-gray-600 mb-1">{offer.provider}</p>}
         {offer.verified && (
           <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 mb-2">
             <ShieldCheck className="-ml-0.5 mr-1.5 h-3 w-3" />
             Verified
           </span>
         )}
        <p className="text-gray-700 text-sm whitespace-pre-line">{offer.description}</p> {/* Use whitespace-pre-line for \n */}
      </div>
      <div className="mt-4">
        {offer.tags && (
          <div className="flex space-x-2 mb-3">
            {offer.tags.map(tag => (
              <span key={tag} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-700">
                {tag}
              </span>
            ))}
          </div>
        )}
        {offer.buttonText && offer.buttonLink && (
           <button
             onClick={() => {
               try {
                 navigate(offer.buttonLink);
               } catch (error) {
                 console.error('Navigation error:', error);
                 toast.error('Failed to navigate to offer details');
               }
             }}
             className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
           >
             {offer.buttonText}
           </button>
         )}
      </div>
    </div>
  );
};

// --- Nav Items (for DashboardLayout - simplified for Marketplace page) ---
// Assuming DashboardLayout expects navItems prop.
// You might pass the current user's role here to determine which nav items to show.
// For demo, let's use userNavItems. You might adjust this based on your actual routing.
const userNavItems = [
  { id: 'user', label: 'User', icon: UserIcon, path: '/dashboard/profile' },
  { id: 'payment', label: 'Payment Method', icon: CreditCard, path: '/dashboard/payment' },
  { id: 'kyc', label: 'KYC', icon: CheckCircle, path: '/dashboard/kyc' },
  { id: 'contributions', label: 'Contributions', icon: DollarSign, path: '/dashboard/contributions' },
  { id: 'withdrawals', label: 'Withdrawals', icon: PiggyBank, path: '/dashboard/withdrawals' },
  { id: 'history', label: 'Transaction History', icon: Activity, path: '/dashboard/history' },
  { id: 'refer', label: 'Refer & Earn', icon: Users, path: '/dashboard/refer' },
  { id: 'groups', label: 'Stokvel Groups', icon: Briefcase, path: '/dashboard/groups' },
];

const adminNavItems = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'users', label: 'User Management', icon: UserPlus, path: '/admin/users' },
  { id: 'groups', label: 'Group Management', icon: Briefcase, path: '/admin/groups' },
  { id: 'transactions', label: 'Transactions', icon: DollarSign, path: '/admin/transactions' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/admin/reports' },
  { id: 'polls', label: 'Polls', icon: BarChart2, path: '/admin/polls' },
  { id: 'meetings', label: 'Meetings', icon: Calendar, path: '/admin/meetings' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/admin/messages' },
  { id: 'settings', label: 'Settings', icon: Shield, path: '/admin/settings' },
];

interface MockUser {
  name: string;
  role: 'admin' | 'member';
  email: string;
}

const mockUser: MockUser = { name: 'User', role: 'member', email: 'user@example.com' };

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('marketplace'); // State to manage active tab
   // You would likely fetch the real user object here or get it from context/state

  // In a real app, you might fetch offers based on the active tab
  const offers = mockOffers; // If not planning to update offers

  // You might fetch data here based on activeTab
  // useEffect(() => {
  //   const fetchOffers = async () => {
  //     setLoading(true);
  //     try {
  //       const response = await api.get(`/api/marketplace/${activeTab}`); // Example endpoint
  //       setOffers(response.data);
  //     } catch (error) {
  //       console.error(`Error fetching ${activeTab} offers:`, error);
  //       setOffers([]); // Clear offers on error
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchOffers();
  // }, [activeTab]); // Fetch data when activeTab changes


   // Determine which nav items to show (example: always user nav for marketplace demo)
   const currentNavItems = userNavItems; // Or determine based on real user object


  return (
    <DashboardLayout user={mockUser} navItems={currentNavItems}> {/* Pass mock user and nav items */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Page Header with Back Button */}
        <div className="flex items-center justify-between mb-6"> {/* Use flex to align button and title */}
            <button
                onClick={() => navigate('/dashboard')} // Navigate back to the dashboard path
                className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm font-medium"
            >
                <ArrowLeft className="w-5 h-5 mr-1" /> {/* Back arrow icon */}
                Back to Dashboard
            </button>
             <h1 className="text-2xl md:text-3xl font-bold text-gray-900">i-Stokvel Dashboard</h1> {/* Page Title from image */}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('marketplace')}
              aria-label="Switch to marketplace tab"
              role="tab"
              aria-selected={activeTab === 'marketplace'}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'marketplace'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <Archive className="inline-block w-4 h-4 mr-2" />
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab('my-offers')}
              aria-label="Switch to my offers tab"
              role="tab"
              aria-selected={activeTab === 'my-offers'}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-offers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
               <Heart className="inline-block w-4 h-4 mr-2" />
              My Offers
            </button>
             <button
              onClick={() => setActiveTab('track-orders')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'track-orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
               <Package className="inline-block w-4 h-4 mr-2" />
              Track Orders
            </button>
             <button
              onClick={() => setActiveTab('partner-portal')}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'partner-portal'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
               <Users className="inline-block w-4 h-4 mr-2" />
              Partner Portal
            </button>
          </nav>
        </div>

        {/* Content based on Active Tab */}
        {activeTab === 'marketplace' && (
          <>
            {/* Browse Offers by Category */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse Offers by Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => (
                  <OfferCard key={offer.id} offer={offer} navigate={navigate} />
                ))}
                 {/* Add more OfferCard components or map through more mock data */}
              </div>
            </div>

            {/* Saved / Used Offers (Placeholder) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                 <Heart className="inline-block w-6 h-6 mr-2 text-red-500" />
                 Saved / Used Offers
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-600">Coming soon: history, reviews, and saved offers.</p>
              </div>
            </div>

             {/* Order & Offer Tracking (Placeholder) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                 <Package className="inline-block w-6 h-6 mr-2 text-blue-500" />
                 Order & Offer Tracking
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <p className="text-gray-600">Real-time status of group purchases.</p>
              </div>
            </div>

          </>
        )}

        {/* My Offers Content (Placeholder) */}
        {activeTab === 'my-offers' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">My Offers</h2>
            <p className="text-gray-600">Content for saved or personalized offers will appear here.</p>
             {/* You would list user's saved/used offers here */}
          </div>
        )}

         {/* Track Orders Content (Placeholder) */}
        {activeTab === 'track-orders' && (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Tracking</h2>
            <p className="text-gray-600">Track the status of your marketplace orders.</p>
             {/* You would list user's marketplace orders here */}
          </div>
        )}

        {/* Partner Portal Content (Placeholder) */}
        {activeTab === 'partner-portal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Placeholder content, similar to image */}
             <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Partner Portal Access</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="partner-email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      id="partner-email"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Partner Login or Registration"
                    />
                  </div>
                  {/* Add password field if needed for login */}
                   {/* <div>
                    <label htmlFor="partner-password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      id="partner-password"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div> */}
                  <button className="w-full px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors duration-200">
                    Log In / Join
                  </button>
                </div>
             </div>
             {/* You could add more partner portal related info or forms here */}
          </div>
        )}


      </div>
    </DashboardLayout>
  );
};

export default Marketplace; 