import axios from 'axios';

/**
 * Service to fetch news from RSS feeds or News APIs
 * In a real-world scenario, this would poll every morning.
 */
export const fetchLatestNews = async (region = 'Bihar', category = 'agriculture') => {
  console.log(`🔍 Fetching latest ${category} news for ${region}...`);
  
  // Mocking external API call
  // Real APIs: GNews, NewsAPI, or scraping Gov portals
  return [
    {
      title: "PM-KISAN 17th Installment Released",
      content: "The government has released the 17th installment of PM-KISAN. Farmers are advised to check their bank accounts and complete e-KYC if pending.",
      source: "AgriNews India"
    },
    {
      title: "Monsoon Alert: Heavy Rain in North Bihar",
      content: "Meteorological department predicts heavy rainfall in Muzaffarpur and surrounding areas. Farmers should delay pesticide spraying.",
      source: "IMD Weather"
    }
  ];
};

export const formatNewsForTTS = (newsItems) => {
  let script = "Namaste, this is your GraamVaani morning bulletin. ";
  newsItems.forEach((item, index) => {
    script += `Headline ${index + 1}: ${item.title}. ${item.content} `;
  });
  script += "Thank you for listening to GraamVaani. Stay informed, stay safe.";
  return script;
};
