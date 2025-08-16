// Web Worker for campaign data processing
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'PROCESS_CAMPAIGNS':
      try {
        const processedCampaigns = data.map((campaign) => ({
          ...campaign,
          // Heavy processing moved to worker
          processedBudget: formatBudget(campaign.budget),
          processedDeadline: calculateDeadline(campaign.endDate),
          processedApplicants: formatApplicants(campaign.applicants, campaign.maxApplicants)
        }));
        
        self.postMessage({
          type: 'CAMPAIGNS_PROCESSED',
          data: processedCampaigns
        });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          error: error.message
        });
      }
      break;
      
    case 'FILTER_CAMPAIGNS':
      try {
        const { campaigns, filters } = data;
        const filtered = campaigns.filter((campaign) => {
          return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            return campaign[key]?.toString().toLowerCase().includes(value.toString().toLowerCase());
          });
        });
        
        self.postMessage({
          type: 'CAMPAIGNS_FILTERED',
          data: filtered
        });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          error: error.message
        });
      }
      break;
  }
};

function formatBudget(budget) {
  const numBudget = typeof budget === 'string' ? parseInt(budget) : budget;
  if (numBudget >= 1000000) {
    return `${(numBudget / 1000000).toFixed(1)}M원`;
  } else if (numBudget >= 1000) {
    return `${(numBudget / 1000).toFixed(1)}K원`;
  }
  return `${numBudget}원`;
}

function calculateDeadline(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function formatApplicants(current, max) {
  const percentage = (current / max) * 100;
  return `${current}/${max}명 (${percentage.toFixed(0)}%)`;
}