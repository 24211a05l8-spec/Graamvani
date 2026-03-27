import cron from 'node-cron';
import { fetchLatestNews, formatNewsForTTS } from './services/newsService.js';
import { generateAudioBulletin } from './services/ttsService.js';
import { Bulletin } from './models/index.js';

/**
 * Automates the daily bulletin creation
 */
export const initCronJobs = () => {
  // Run at 06:00 AM every day
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ Running daily bulletin auto-generation...');
    
    try {
      const regions = ['Bihar', 'Uttar Pradesh', 'Rajasthan']; // Example regions
      
      for (const region of regions) {
        const news = await fetchLatestNews(region);
        const script = formatNewsForTTS(news);
        const audio = await generateAudioBulletin(script);
        
        const newBulletin = new Bulletin({
          title: `Daily Morning Bulletin - ${region}`,
          audioUrl: audio.url,
          textSeed: script,
          language: 'Hindi',
          region: region,
          type: 'news'
        });
        
        await newBulletin.save();
        console.log(`✅ Bulletin created for ${region}`);
      }
    } catch (err) {
      console.error('❌ Cron Job Error:', err);
    }
  });
};
