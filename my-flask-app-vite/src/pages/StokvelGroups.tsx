import React, { useState, useEffect } from "react";
import { Search, Filter, CheckCircle, Star, Users, ShieldCheck, TrendingUp, Gift } from "lucide-react";
import { toast } from "react-hot-toast";
import { groupService } from '../services/groupService';
import { useNavigate } from "react-router-dom";

const tierDetails: Record<string, Record<string, {
  amountRange: string;
  interest: string;
  access: string;
  description: string;
  support: string;
}>> = {
  Savings: {
    Bronze: {
      amountRange: "R200–R450",
      interest: "2.5% p.a.",
      access: "Anytime",
      description: "Perfect for individuals or small groups starting their savings journey. Flexible deposits and easy withdrawals.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R500–R950",
      interest: "3.2% p.a.",
      access: "Anytime",
      description: "Ideal for growing savings groups looking for better rates and more flexibility.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R1000–R1950",
      interest: "4.1% p.a.",
      access: "Anytime",
      description: "Best for established groups wanting higher limits and added perks.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000+",
      interest: "5.0% p.a.",
      access: "Anytime",
      description: "Premium tier for large groups seeking maximum benefits and exclusive features.",
      support: "24/7 VIP support"
    }
  },
  Burial: {
    Bronze: {
      amountRange: "R100–R300",
      interest: "1.0% p.a.",
      access: "On claim",
      description: "Entry-level burial stokvel for basic funeral cover and support.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R350–R700",
      interest: "1.5% p.a.",
      access: "On claim",
      description: "Enhanced cover for families and small communities.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R750–R1500",
      interest: "2.0% p.a.",
      access: "On claim",
      description: "Comprehensive burial benefits for larger groups.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R1600+",
      interest: "2.5% p.a.",
      access: "On claim",
      description: "Top-tier cover with additional family and community benefits.",
      support: "24/7 VIP support"
    }
  },
  Investment: {
    Bronze: {
      amountRange: "R500–R1000",
      interest: "4.0% p.a.",
      access: "Quarterly",
      description: "Start your investment journey with low minimums and steady returns.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R1100–R2500",
      interest: "5.0% p.a.",
      access: "Quarterly",
      description: "Better rates for groups with a medium-term investment horizon.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R2600–R5000",
      interest: "6.0% p.a.",
      access: "Bi-Annually",
      description: "Higher returns for committed investment stokvels.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R5100+",
      interest: "7.0% p.a.",
      access: "Annually",
      description: "Maximum growth for long-term, high-value investment groups.",
      support: "24/7 VIP support"
    }
  },
  Business: {
    Bronze: {
      amountRange: "R1000–R2500",
      interest: "3.0% p.a.",
      access: "Monthly",
      description: "For small business stokvels pooling resources for growth.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R2600–R5000",
      interest: "3.8% p.a.",
      access: "Monthly",
      description: "Ideal for growing business collectives needing flexible access.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R5100–R10000",
      interest: "4.5% p.a.",
      access: "Quarterly",
      description: "Higher limits and returns for established business stokvels.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R10100+",
      interest: "5.5% p.a.",
      access: "Quarterly",
      description: "Top-tier for large business groups with exclusive benefits.",
      support: "24/7 VIP support"
    }
  }
};

const categoryTiers = {
  Savings: [
    { name: "Bronze", amount: "R300", color: "bg-green-100 text-green-800" },
    { name: "Silver", amount: "R700", color: "bg-green-200 text-green-900" },
    { name: "Gold", amount: "R1500", color: "bg-green-300 text-green-900" },
    { name: "Platinum", amount: "R3000", color: "bg-green-400 text-white" },
  ],
  Burial: [
    { name: "Bronze", amount: "R150", color: "bg-blue-100 text-blue-800" },
    { name: "Silver", amount: "R400", color: "bg-blue-200 text-blue-900" },
    { name: "Gold", amount: "R900", color: "bg-blue-300 text-blue-900" },
    { name: "Platinum", amount: "R1600", color: "bg-blue-400 text-white" },
  ],
  Investment: [
    { name: "Bronze", amount: "R500", color: "bg-purple-100 text-purple-800" },
    { name: "Silver", amount: "R1200", color: "bg-purple-200 text-purple-900" },
    { name: "Gold", amount: "R2500", color: "bg-purple-300 text-purple-900" },
    { name: "Platinum", amount: "R5100", color: "bg-purple-400 text-white" },
  ],
  Business: [
    { name: "Bronze", amount: "R250", color: "bg-yellow-100 text-yellow-800" },
    { name: "Silver", amount: "R600", color: "bg-yellow-200 text-yellow-900" },
    { name: "Gold", amount: "R1200", color: "bg-yellow-300 text-yellow-900" },
    { name: "Platinum", amount: "R2500", color: "bg-yellow-400 text-white" },
  ],
};

const StokvelGroups: React.FC = () => {
  const [search, setSearch] = useState("");
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Savings");
  const [openTier, setOpenTier] = useState<{ name: string, category: string } | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fetch all groups and organize by category
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await groupService.getAvailableGroups();
        const groups = res.data;
        setAllGroups(groups);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(groups.map((group: any) => group.category))];
        setCategories(uniqueCategories);
        
        // Set first category as active
        if (uniqueCategories.length > 0 && !activeCategory) {
          setActiveCategory(uniqueCategories[0]);
        }
      } catch (err) {
        toast.error("Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Fetch user's join requests - This ensures data persists after refresh/logout
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch("/api/user/join-requests", {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setJoinRequests(
            data.map((req: any) => ({
              groupId: req.tier_id,
              status: req.status,
              reason: req.reason
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch join requests:", err);
      }
    };

    fetchRequests();
  }, []);

  // Filter groups by active category
  const filteredGroups = allGroups.filter(group => 
    group.category === activeCategory &&
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handle join request
  const handleJoin = async (groupId: number) => {
    setLoadingTier(groupId);
    try {
      await groupService.joinGroup(groupId);
      // Add to local state immediately for instant feedback
      setJoinRequests(prev => [...prev, { groupId, status: "pending" }]);
      toast.success("Join request sent successfully!");
    } catch (err) {
      toast.error("Failed to submit join request.");
    } finally {
      setLoadingTier(null);
    }
  };

  // Get join request status for a group
  const getRequestStatus = (groupId: number) => {
    return joinRequests.find(req => req.groupId === groupId);
  };

  // Helper to generate amounts in R50 increments within a range
  function getAmountsInRange(range: string) {
    const match = range.match(/R(\d+)[–-]R?(\d+)?/);
    if (!match) return [];
    const min = parseInt(match[1], 10);
    const max = match[2] ? parseInt(match[2], 10) : min;
    let amounts = [];
    for (let amt = min; amt <= max; amt += 50) {
      amounts.push(amt);
    }
    return amounts;
  }

  // Example: Generate unique features and benefits for each amount
  function getFeatures(amount: number, tier: string) {
    if (tier === "Bronze") {
      return [
        { icon: <Users className="w-5 h-5 text-blue-500" />, label: "Group Savings" },
        { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: "Flexible Deposits" },
        { icon: <ShieldCheck className="w-5 h-5 text-yellow-500" />, label: "Safe & Secure" },
      ];
    }
    // ...add for other tiers
    return [];
  }

  function getBenefits(amount: number, tier: string) {
    if (tier === "Bronze") {
      if (amount <= 250) return [
        { icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: "Basic support" },
        { icon: <Gift className="w-5 h-5 text-pink-500" />, label: "Welcome bonus" },
      ];
      if (amount <= 350) return [
        { icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: "Priority support" },
        { icon: <Gift className="w-5 h-5 text-pink-500" />, label: "Monthly draw entry" },
      ];
      return [
        { icon: <Star className="w-5 h-5 text-yellow-500" />, label: "VIP support" },
        { icon: <Gift className="w-5 h-5 text-pink-500" />, label: "Exclusive rewards" },
      ];
    }
    // ...add for other tiers
    return [];
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text mb-2">Stokvel Groups</h1>
            <p className="text-gray-600 dark:text-gray-400">Join a group and start saving with others</p>
          </div>
          {/* Search Bar - now at top right */}
          <div className="w-full md:w-80 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-dark-text"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4">
          {Object.keys(categoryTiers).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === cat
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-blue-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tier Cards for Selected Category */}
        <div>
          <h2 className="font-semibold text-lg mb-3">{selectedCategory} Tiers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {categoryTiers[selectedCategory].map((tier) => {
              const details = tierDetails[selectedCategory][tier.name];
              return (
                <div
                  key={tier.name}
                  className="flex flex-col items-center bg-white rounded-2xl shadow-lg border border-gray-100 p-7 min-h-[360px] w-full hover:shadow-2xl transition-all"
                >
                  {/* Colored badge/icon at the top */}
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow
                      ${tier.name === "Bronze" ? "bg-yellow-400 text-white" : ""}
                      ${tier.name === "Silver" ? "bg-gray-300 text-gray-800" : ""}
                      ${tier.name === "Gold" ? "bg-yellow-500 text-white" : ""}
                      ${tier.name === "Platinum" ? "bg-gray-800 text-white" : ""}
                    `}
                  >
                    {tier.name[0]}
                  </div>
                  {/* Main info */}
                  <div className="flex-1 flex flex-col items-center text-center w-full">
                    <div className="font-bold text-2xl mb-1 tracking-wide">{tier.name} Tier</div>
                    <div className="text-gray-600 mb-1 text-lg font-semibold">
                      Amount: <span className="font-bold">{details.amountRange}</span>
                    </div>
                    <div className="text-gray-500 text-sm mb-1">
                      Category: {selectedCategory}
                    </div>
                    <div className="text-gray-400 text-xs mb-2">
                      {details.description}
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="w-full border-t border-gray-100 my-3"></div>
                  {/* Extra info section */}
                  <div className="flex flex-col gap-2 w-full text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Interest earned</span>
                      <span className="font-semibold text-blue-700">{details.interest}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Access to funds</span>
                      <span className="font-semibold text-green-600">{details.access}</span>
                    </div>
                  </div>
                  {/* Action or extra info at the bottom */}
                  <div className="mt-5 flex flex-col items-center w-full">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition text-sm w-full font-semibold"
                      onClick={() => navigate(`/tiers/${selectedCategory.toLowerCase()}/${tier.name.toLowerCase()}`)}
                    >
                      Learn More
                    </button>
                    <div className="mt-2 text-xs text-gray-500 text-center w-full">
                      {details.support}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Table - Always visible for better UX */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 dark:text-dark-text">My Join Requests Status</h2>
          <div className="bg-white dark:bg-dark-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No join requests yet. Select a group above to get started.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StokvelGroups;
