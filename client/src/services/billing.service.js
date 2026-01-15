import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// Get all available plans
export const getPlans = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/billing/plans/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
};

// Get current user's subscription
export const getMySubscription = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/billing/subscription/me/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

// Upgrade/change subscription plan
export const upgradePlan = async (planName, paymentMethodId = null) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/billing/subscription/upgrade/`,
      {
        plan: planName,
        stripe_payment_method_id: paymentMethodId,
      },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error upgrading plan:', error);
    throw error;
  }
};

// Cancel subscription (downgrade to free)
export const cancelSubscription = async () => {
  try {
    const response = await axios.post(
      `${API_URL}/api/billing/subscription/cancel/`,
      {},
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

// Get current usage stats
export const getUsageStats = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/billing/usage/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    throw error;
  }
};

// Get available Egyptian laws
export const getAvailableEgyptianLaws = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/billing/egyptian-laws/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching Egyptian laws:', error);
    throw error;
  }
};

// Get user's selected Egyptian laws
export const getMyLawSelections = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/billing/law-selections/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching law selections:', error);
    throw error;
  }
};

// Add a law selection
export const addLawSelection = async (lawSlug) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/billing/law-selections/`,
      { law: lawSlug },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error adding law selection:', error);
    throw error;
  }
};

// Remove a law selection
export const removeLawSelection = async (selectionId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/api/billing/law-selections/${selectionId}/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error removing law selection:', error);
    throw error;
  }
};

// Check if user has access to a specific law
export const checkLawAccess = async (lawSlug) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/billing/check-law-access/${lawSlug}/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error checking law access:', error);
    throw error;
  }
};

export default {
  getPlans,
  getMySubscription,
  upgradePlan,
  cancelSubscription,
  getUsageStats,
  getAvailableEgyptianLaws,
  getMyLawSelections,
  addLawSelection,
  removeLawSelection,
  checkLawAccess,
};
