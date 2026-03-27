import cron from 'node-cron';
import admin from 'firebase-admin';
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
      // 1. Define News Configurations (Categories & Languages)
      const configs = [
        { category: 'global', language: 'Hindi', label: 'Global Hot Topics' },
        { category: 'telugu', language: 'Telugu', label: 'Telugu Regional News' },
        { category: 'local', language: 'Hindi', label: 'Local District Updates' }
      ];
      
      for (const config of configs) {
        // 2. Fetch Top 5 News
        const news = await fetchLatestNews(config.category, config.language, 5);
        
        // 3. Format Script
        const script = formatNewsForTTS(news, config.language);
        
        // 4. Generate AI Voice
        const audio = await generateAudioBulletin(script, config.language);
        
        // 5. Save to Firestore
        const data = {
          title: `AI Auto: ${config.label}`,
          audioUrl: audio.url,
          textSeed: script,
          language: config.language,
          category: config.category,
          isActive: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await Bulletin.add(data);
        console.log(`✅ Auto-Bulletin created: ${config.label}`);
      }
    } catch (err) {
      console.error('❌ Cron Job Error:', err);
    }
  });
};
