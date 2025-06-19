import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft, // Import the ArrowLeft icon
  Search, // Import the Search icon
  Filter // Add Filter icon import
} from 'lucide-react'; // Import necessary icons
import { toast } from 'react-hot-toast';
import { marketplaceAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';


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

const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Define the sidebar navigation items
  const sidebarNavItems = [
    { id: 'user', label: 'User', icon: UserIcon, path: '/dashboard/profile' },
    { id: 'digital-wallet', label: 'Digital Wallet', icon: CreditCard, path: '/dashboard/payment' },
    { id: 'kyc', label: 'KYC', icon: CheckCircle, path: '/dashboard/kyc' },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users, path: '/dashboard/beneficiaries' },
    { id: 'refer', label: 'Refer & Earn', icon: Users, path: '/dashboard/refer' },
    { id: 'groups', label: 'Stokvel Groups', icon: Briefcase, path: '/dashboard/groups' },
    { id: 'separator', separator: true }, // Add a separator
  ];

  // Define the marketplace navigation item
  const marketplaceNavItem = {
    id: 'marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    path: '/dashboard/marketplace'
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await marketplaceAPI.getOffers();
        setOffers(response.data);
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex-1 p-4">
      <div className="flex justify-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">iStokvel Deals</h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex justify-center space-x-8" aria-label="Tabs">
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

      <div className="w-full flex justify-center mb-6">
        <div className="w-full max-w-3xl flex items-center space-x-4">
          <button
            onClick={() => {/* handle search */}}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
          >
            <Search className="w-5 h-5" />
            <span>Search deals...</span>
          </button>

          <button
            onClick={() => {/* handle filter */}}
            className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200"
          >
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => (
          <OfferCard key={offer.id} offer={offer} navigate={useNavigate()} />
        ))}
      </div>
    </div>
  );
};

export default Marketplace; 