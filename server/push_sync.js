require('dotenv').config();
const axios = require('axios');
const port = process.env.PORT || 3000;
if (!process.env.WEBHOOK_SECRET) { console.error('push skip: WEBHOOK_SECRET not set'); process.exit(0); }
axios.post(`http://127.0.0.1:${port}/sync/push-all`, {}, { headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET }, timeout: 60000 })
  .then(r => console.log('push ok:', JSON.stringify(r.data)))
  .catch(e => console.error('push fail:', e.response ? (e.response.status + ' ' + JSON.stringify(e.response.data)) : e.message));
