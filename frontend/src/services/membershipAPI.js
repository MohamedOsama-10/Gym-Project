import { apiRequest } from './httpClient';

export const membershipAPI = {
  // Get gym membership plans
  getPlans: async () => {
    return apiRequest('/memberships/plans');
  },

  // Get coach packages
  getCoachPackages: async () => {
    return apiRequest('/memberships/coach-packages');
  },

  // Subscribe to a plan
  subscribe: async (planId, paymentMethod = 'cash') => {
    return apiRequest('/memberships/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        payment_method: paymentMethod
      })
    });
  },

  // Get user's subscriptions
  getMySubscriptions: async () => {
    return apiRequest('/memberships/my-subscriptions');
  }
};

export default membershipAPI;
