/**
 * Quick setup script to add Gemini API key to .env.local
 * Run with: node setup-gemini.js
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env.local');
const API_KEY = 'AIzaSyDQV2g4eHbekOTBsO11xAPC7WxRLJi-UJU';

function setupGeminiKey() {
  console.log('🚀 Setting up Gemini AI...\n');

  try {
    let envContent = '';
    
    // Read existing .env.local if it exists
    if (fs.existsSync(ENV_FILE)) {
      envContent = fs.readFileSync(ENV_FILE, 'utf8');
      console.log('✓ Found existing .env.local file');
      
      // Check if GEMINI_API_KEY already exists
      if (envContent.includes('GEMINI_API_KEY')) {
        console.log('⚠️  GEMINI_API_KEY already exists in .env.local');
        console.log('   Please update it manually if needed.\n');
        return;
      }
    } else {
      console.log('✓ Creating new .env.local file');
    }

    // Add GEMINI_API_KEY
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `\n# Gemini AI API Key for Receipt Scanning\nGEMINI_API_KEY=${API_KEY}\n`;

    // Write to file
    fs.writeFileSync(ENV_FILE, envContent);
    
    console.log('✅ Successfully added GEMINI_API_KEY to .env.local\n');
    console.log('📝 Next steps:');
    console.log('   1. Restart your development server (npm run dev)');
    console.log('   2. Upload a receipt image in the expense form');
    console.log('   3. Watch the AI auto-fill your form! 🎉\n');
    console.log('📖 For more info, see GEMINI_SETUP.md\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Manual setup:');
    console.log('   Add this line to your .env.local file:');
    console.log(`   GEMINI_API_KEY=${API_KEY}\n`);
  }
}

setupGeminiKey();
