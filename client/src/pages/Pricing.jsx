import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { getPlans, getMySubscription, upgradePlan } from '../services/billing.service';
import { useToast } from '@/hooks/use-toast';

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData] = await Promise.all([
        getPlans(),
        getMySubscription().catch(() => null),
      ]);
      setPlans(plansData);
      setCurrentPlan(subscriptionData?.plan_details?.name || 'free');
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pricing plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planName) => {
    if (planName === currentPlan) {
      toast({
        title: 'Info',
        description: 'You are already on this plan',
      });
      return;
    }

    try {
      setUpgradingTo(planName);

      // For paid plans, we'll need to integrate Stripe
      // For now, just show a message
      if (planName !== 'free') {
        toast({
          title: 'Coming Soon',
          description: 'Payment integration coming soon! Please contact support.',
          variant: 'destructive',
        });
        setUpgradingTo(null);
        return;
      }

      // Downgrade to free
      await upgradePlan(planName);
      toast({
        title: 'Success',
        description: `Successfully changed to ${planName} plan`,
      });
      await fetchData();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to upgrade plan',
        variant: 'destructive',
      });
    } finally {
      setUpgradingTo(null);
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName) {
      case 'free':
        return <Sparkles className="w-8 h-8" />;
      case 'standard':
        return <Zap className="w-8 h-8" />;
      case 'premium':
        return <Crown className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case 'free':
        return 'from-gray-500 to-gray-600';
      case 'standard':
        return 'from-blue-500 to-blue-600';
      case 'premium':
        return 'from-purple-500 to-purple-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPlanFeatures = (plan) => {
    const features = [];

    // Documents
    if (plan.max_documents === null) {
      features.push({ text: 'Unlimited Documents', included: true });
    } else {
      features.push({ text: `${plan.max_documents} Documents Total`, included: true });
    }

    // Messages
    if (plan.max_messages_per_day === null) {
      features.push({ text: 'Unlimited Messages/Day', included: true });
    } else {
      features.push({ text: `${plan.max_messages_per_day} Messages/Day`, included: true });
    }

    // Egyptian Laws
    if (plan.max_egyptian_laws === null) {
      features.push({ text: 'All Egyptian Laws Access', included: true });
    } else if (plan.max_egyptian_laws === 0) {
      features.push({ text: 'Egyptian Laws Access', included: false });
    } else {
      features.push({ text: `${plan.max_egyptian_laws} Egyptian Laws of Choice`, included: true });
    }

    // AI Analysis
    if (plan.name === 'free') {
      features.push({ text: 'Basic AI Analysis', included: true });
      features.push({ text: 'Legal Clause Detection', included: true });
      features.push({ text: 'Risk Analysis', included: true });
    } else if (plan.name === 'standard') {
      features.push({ text: 'Full AI Analysis', included: true });
      features.push({ text: 'Legal Clause Detection', included: true });
      features.push({ text: 'Risk Analysis', included: true });
    } else {
      features.push({ text: 'Advanced AI Analysis', included: true });
      features.push({ text: 'Legal Clause Detection', included: true });
      features.push({ text: 'Risk Analysis', included: true });
      features.push({ text: 'Contract Comparison', included: true });
    }

    // Future Features
    if (plan.has_future_features) {
      features.push({ text: 'Access to Future Features', included: true });
    } else {
      features.push({ text: 'Access to Future Features', included: false });
    }

    // Support
    if (plan.name === 'premium') {
      features.push({ text: 'Priority Support (6h)', included: true });
    } else if (plan.name === 'standard') {
      features.push({ text: 'Email Support (48h)', included: true });
    }

    return features;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-gray-600">
          Unlock the full power of AI-powered legal document analysis
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlan;
          const isPremium = plan.name === 'premium';
          const features = getPlanFeatures(plan);

          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden ${isPremium ? 'ring-2 ring-purple-500' : ''
                }`}
            >
              {/* Popular Badge */}
              {isPremium && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                  POPULAR
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 text-sm font-semibold rounded-br-lg">
                  CURRENT PLAN
                </div>
              )}

              <div className="p-8">
                {/* Plan Icon & Name */}
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${getPlanColor(plan.name)} text-white mb-4`}>
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.display_name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={isCurrentPlan || upgradingTo === plan.name}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${isCurrentPlan
                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                    : `bg-gradient-to-r ${getPlanColor(plan.name)} text-white hover:opacity-90 hover:shadow-lg`
                    }`}
                >
                  {upgradingTo === plan.name ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    `Upgrade to ${plan.display_name}`
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Back to Dashboard */}
      <div className="text-center mt-12">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  </div>
  );
};

export default Pricing;
