#!/usr/bin/env node
// scripts/cal-webhook.mjs
// Скрипт для создания и обновления вебхуков Cal.com

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Читаем переменные окружения
function loadEnv() {
  const envPath = join(__dirname, '..', 'env', 'cal.local.env');
  const examplePath = join(__dirname, '..', 'env', 'cal.example.env');
  
  let envContent = '';
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  } else if (existsSync(examplePath)) {
    envContent = readFileSync(examplePath, 'utf8');
  }
  
  const env = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return env;
}

const env = loadEnv();

// Конфигурация
const CAL_API_BASE = 'https://api.cal.com/v2';
const CLIENT_ID = process.env.CAL_CLIENT_ID || env.CAL_CLIENT_ID;
const CLIENT_SECRET = process.env.CAL_CLIENT_SECRET || env.CAL_CLIENT_SECRET;
const WEBHOOK_SECRET = process.env.CAL_WEBHOOK_SECRET || env.CAL_WEBHOOK_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL || env.PUBLIC_URL || 'https://your-domain.com';

if (!CLIENT_ID || !CLIENT_SECRET || !WEBHOOK_SECRET) {
  console.error('❌ Missing required environment variables:');
  console.error('   CAL_CLIENT_ID - Your Cal.com OAuth client ID');
  console.error('   CAL_CLIENT_SECRET - Your Cal.com OAuth client secret');
  console.error('   CAL_WEBHOOK_SECRET - Webhook secret for signature verification');
  console.error('   PUBLIC_URL - Your public URL (optional, defaults to https://your-domain.com)');
  process.exit(1);
}

const WEBHOOK_URL = `${PUBLIC_URL}/api/cal/webhook`;

// Функция для HTTP запросов
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-cal-secret-key': CLIENT_SECRET,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

// Получить список существующих вебхуков
async function getWebhooks() {
  try {
    const webhooks = await makeRequest(`${CAL_API_BASE}/oauth-clients/${CLIENT_ID}/webhooks`);
    return webhooks;
  } catch (error) {
    console.error('❌ Failed to fetch webhooks:', error.message);
    return [];
  }
}

// Создать новый вебхук
async function createWebhook() {
  const webhookData = {
    active: true,
    subscriberUrl: WEBHOOK_URL,
    triggers: ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'],
    secret: WEBHOOK_SECRET,
  };

  try {
    console.log('🚀 Creating new webhook...');
    console.log(`   URL: ${WEBHOOK_URL}`);
    console.log(`   Triggers: ${webhookData.triggers.join(', ')}`);
    
    const result = await makeRequest(`${CAL_API_BASE}/oauth-clients/${CLIENT_ID}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });

    console.log('✅ Webhook created successfully!');
    console.log(`   ID: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Failed to create webhook:', error.message);
    throw error;
  }
}

// Обновить существующий вебхук
async function updateWebhook(webhookId) {
  const webhookData = {
    active: true,
    subscriberUrl: WEBHOOK_URL,
    triggers: ['BOOKING_CREATED', 'BOOKING_RESCHEDULED', 'BOOKING_CANCELLED'],
    secret: WEBHOOK_SECRET,
  };

  try {
    console.log(`🔄 Updating webhook ${webhookId}...`);
    console.log(`   URL: ${WEBHOOK_URL}`);
    console.log(`   Triggers: ${webhookData.triggers.join(', ')}`);
    
    const result = await makeRequest(`${CAL_API_BASE}/oauth-clients/${CLIENT_ID}/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(webhookData),
    });

    console.log('✅ Webhook updated successfully!');
    return result;
  } catch (error) {
    console.error('❌ Failed to update webhook:', error.message);
    throw error;
  }
}

// Основная функция
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'create':
        await createWebhook();
        break;
        
      case 'update':
        const webhooks = await getWebhooks();
        const existingWebhook = webhooks.find(w => w.subscriberUrl === WEBHOOK_URL);
        
        if (existingWebhook) {
          await updateWebhook(existingWebhook.id);
        } else {
          console.log('⚠️  No existing webhook found for this URL. Creating new one...');
          await createWebhook();
        }
        break;
        
      case 'list':
        const allWebhooks = await getWebhooks();
        console.log('📋 Existing webhooks:');
        allWebhooks.forEach(webhook => {
          console.log(`   ID: ${webhook.id}`);
          console.log(`   URL: ${webhook.subscriberUrl}`);
          console.log(`   Active: ${webhook.active}`);
          console.log(`   Triggers: ${webhook.triggers?.join(', ') || 'N/A'}`);
          console.log('   ---');
        });
        break;
        
      default:
        console.log('📖 Cal.com Webhook Manager');
        console.log('');
        console.log('Usage:');
        console.log('  node scripts/cal-webhook.mjs create  - Create new webhook');
        console.log('  node scripts/cal-webhook.mjs update  - Update existing webhook');
        console.log('  node scripts/cal-webhook.mjs list    - List all webhooks');
        console.log('');
        console.log('Environment variables:');
        console.log('  CAL_CLIENT_ID      - Your Cal.com OAuth client ID');
        console.log('  CAL_CLIENT_SECRET  - Your Cal.com OAuth client secret');
        console.log('  CAL_WEBHOOK_SECRET - Webhook secret for signature verification');
        console.log('  PUBLIC_URL         - Your public URL (optional)');
        break;
    }
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

main();
