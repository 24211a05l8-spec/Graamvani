/**
 * Service to fetch news from RSS feeds or News APIs
 * In a real-world scenario, this would poll every morning.
 */
export const fetchLatestNews = async (category = 'local', language = 'Hindi', limit = 5) => {
  console.log(`🔍 AI Fetching Top ${limit} ${category} news in ${language}...`);
  
  // Real-world: Use NewsAPI.org or GNews.io with category filtering
  // For the demo, we generate realistic dynamic news items
  
  const newsMocks = {
    'global': [
      { title: "Global Security Update: New ceasefire talks begin", content: "International mediators have arrived for a new round of peace talks aiming to resolve the ongoing conflict." },
      { title: "G20 Summit: Economic cooperation high on agenda", content: "Leaders of the world's largest economies meet to discuss trade barriers and sustainable development." },
      { title: "SpaceX Mars Mission: Pre-launch tests successful", content: "The heavy-lift rocket passed all critical pressure tests at the Starbase facility today." },
      { title: "Global Healthcare: New malaria vaccine reaches millions", content: "WHO reports a significant drop in childhood mortality across sub-Saharan Africa due to the new vaccine rollout." },
      { title: "Energy Transition: Solar power capacity doubles in 2024", content: "The International Energy Agency confirms that renewable installations have surpassed all previous records." }
    ],
    'telugu': [
      { title: "Hyderabad Tech Hub: New 500-acre IT park announced", content: "The Telangana government has approved the plan for a second HITEC city to accommodate growing global demand." },
      { title: "AP Agriculture: Rythu Bharosa funds credited to 50 lakh farmers", content: "The state government has completed the direct benefit transfer for the current Kharif season." },
      { title: "Telugu Cinema: Global release dates for upcoming epics", content: "Several high-budget Tollywood productions are set to release simultaneously in 15 international languages." },
      { title: "Vizag Port: Expansion project to boost trade by 30%", content: "The central government has sanctioned funds for deepening the inner harbor to accommodate larger vessels." },
      { title: "Tirumala Update: New eco-friendly transport for pilgrims", content: "The TTD board has replaced all diesel buses with high-capacity electric variants." }
    ],
    'local': [
      { title: "District Agri Expo: New organic techniques showcased", content: "Farmers from across the district gathered to learn about natural pest control and soil health." },
      { title: "Panchayat Education: 5 new schools to get digital labs", content: "Under the village development fund, high schools will be equipped with modern computing facilities." },
      { title: "Weather Alert: Light rain expected in next 48 hours", content: "Local IMD office advises farmers to postpone harvesting of pulse crops." },
      { title: "Rural Health: Mobile clinics to visit 20 more villages", content: "The health department is expanding its weekly check-up program for seniors and children." },
      { title: "Market Rates: Rice and Wheat see stable prices", content: "The local mandi reports consistent arrivals and fair pricing for the current season's produce." }
    ]
  };

  const selectedNews = newsMocks[category.toLowerCase()] || newsMocks['local'];
  return selectedNews.slice(0, limit);
};

export const formatNewsForTTS = (newsItems, language = 'Hindi') => {
  let script = `Namaste, this is your GraamVaani Hot News bulletin. Today's Top ${newsItems.length} updates. `;
  
  newsItems.forEach((item, index) => {
    script += `Update ${index + 1}: ${item.title}. ${item.content} `;
  });
  
  script += `That concludes our bulletin. Stay informed with GraamVaani. Goodbye!`;
  return script;
};
