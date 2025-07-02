import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Gift, Users, ShieldCheck, TrendingUp, CheckCircle } from "lucide-react";
// Import or copy your tierDetails, getAmountsInRange, getFeatures, getBenefits helpers here

// Example helpers (reuse from your main file or centralize them)
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
      interest: "3.0% p.a.",
      access: "Anytime",
      description: "Ideal for growing groups looking for better returns and added flexibility.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R1000–R1950",
      interest: "3.5% p.a.",
      access: "Anytime",
      description: "For established groups seeking higher interest and exclusive benefits.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000–R5000",
      interest: "4.0% p.a.",
      access: "Anytime",
      description: "Top-tier for large groups with maximum benefits and personalized service.",
      support: "Dedicated manager"
    }
  },
  Burial: {
    Bronze: {
      amountRange: "R100–R400",
      interest: "N/A",
      access: "On claim",
      description: "Entry-level cover for individuals or families starting their burial plan.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R450–R900",
      interest: "N/A",
      access: "On claim",
      description: "Enhanced cover for families or small groups with added benefits.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R950–R1900",
      interest: "N/A",
      access: "On claim",
      description: "Comprehensive cover for larger groups with premium services.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R2000–R5000",
      interest: "N/A",
      access: "On claim",
      description: "Maximum cover and personalized support for large groups.",
      support: "Dedicated manager"
    }
  },
  Investment: {
    Bronze: {
      amountRange: "R500–R1000",
      interest: "5.0% p.a.",
      access: "Quarterly",
      description: "Start your investment journey with flexible options and steady growth.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R1100–R2500",
      interest: "6.0% p.a.",
      access: "Quarterly",
      description: "Better returns and more options for growing your investments.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R2600–R5000",
      interest: "7.0% p.a.",
      access: "Quarterly",
      description: "Premium investment options for serious savers and groups.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R5100–R10000",
      interest: "8.0% p.a.",
      access: "Quarterly",
      description: "Top-tier investment with maximum returns and exclusive benefits.",
      support: "Dedicated manager"
    }
  },
  Business: {
    Bronze: {
      amountRange: "R1000–R2500",
      interest: "3.0% p.a.",
      access: "Monthly",
      description: "Entry-level business savings for startups and small businesses.",
      support: "Basic support"
    },
    Silver: {
      amountRange: "R2600–R5000",
      interest: "3.5% p.a.",
      access: "Monthly",
      description: "Enhanced business savings with added flexibility and support.",
      support: "Priority support"
    },
    Gold: {
      amountRange: "R5100–R10000",
      interest: "4.0% p.a.",
      access: "Monthly",
      description: "Premium business savings for established businesses.",
      support: "Premium support"
    },
    Platinum: {
      amountRange: "R10100–R20000",
      interest: "4.5% p.a.",
      access: "Monthly",
      description: "Top-tier business savings with maximum benefits and dedicated support.",
      support: "Dedicated manager"
    }
  }
};
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
function getFeatures(amount: number, tier: string) {
  // ...same as before...
  return [
    { icon: <Users className="w-5 h-5 text-blue-500" />, label: "Group Savings" },
    { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: "Flexible Deposits" },
    { icon: <ShieldCheck className="w-5 h-5 text-yellow-500" />, label: "Safe & Secure" },
  ];
}
function getBenefits(amount: number, tier: string) {
  // ...same as before...
  return [
    { icon: <CheckCircle className="w-5 h-5 text-green-500" />, label: "Basic support" },
    { icon: <Gift className="w-5 h-5 text-pink-500" />, label: "Welcome bonus" },
  ];
}

const TierDetails: React.FC = () => {
  const { category, tier } = useParams();
  const navigate = useNavigate();

  function capitalize(str: string) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  function findKeyInsensitive(obj: Record<string, any>, key: string | undefined) {
    if (!key) return undefined;
    const lowerKey = key.toLowerCase();
    return Object.keys(obj).find(k => k.toLowerCase() === lowerKey);
  }

  const categoryKey = findKeyInsensitive(tierDetails, category);
  if (!categoryKey) return <div>Category not found.</div>;

  const tierKey = findKeyInsensitive(tierDetails[categoryKey], tier);
  if (!tierKey) return <div>Tier not found.</div>;

  const details = tierDetails[categoryKey][tierKey];
  const amounts = getAmountsInRange(details.amountRange);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-300 p-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold shadow-lg bg-white text-blue-600 mb-2">
            {capitalize(tier)[0]}
          </div>
          <div className="text-white text-3xl font-bold">{capitalize(tier)} Tier</div>
          <div className="text-blue-100 text-lg">{details.amountRange}</div>
          <div className="text-blue-50 text-md mt-2 text-center max-w-2xl">{details.description}</div>
        </div>
        {/* All Amount Options */}
        <div className="px-8 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {amounts.map((amt) => {
            const features = getFeatures(amt, capitalize(tier));
            const benefits = getBenefits(amt, capitalize(tier));
            return (
              <div key={amt} className="border rounded-2xl p-6 shadow-lg flex flex-col bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-700 font-bold text-xl">{capitalize(tier)} R{amt}</span>
                </div>
                <div className="mb-3">
                  <div className="font-bold text-blue-700 mb-1 flex items-center gap-2">
                    <Star className="w-5 h-5" /> Key Features
                  </div>
                  <ul className="space-y-1 mb-2">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                        {f.icon} {f.label}
                      </li>
                    ))}
                  </ul>
                  <div className="font-bold text-green-700 mb-1 flex items-center gap-2">
                    <Gift className="w-5 h-5" /> Benefits
                  </div>
                  <ul className="space-y-1">
                    {benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                        {b.icon} {b.label}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  className="mt-auto bg-gradient-to-r from-blue-600 to-green-500 text-white px-4 py-2 rounded-xl font-bold shadow hover:scale-105 transition"
                  onClick={() => alert(`Request submitted for ${capitalize(tier)} R${amt}`)}
                >
                  Submit Request
                </button>
              </div>
            );
          })}
        </div>
        <div className="p-6 flex justify-end">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => navigate(-1)}
          >
            &larr; Back to Tiers
          </button>
        </div>
      </div>
    </div>
  );
};

export default TierDetails;
