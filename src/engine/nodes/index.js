const { registerNode } = require('./nodeRegistry');

const ManualTrigger = require('./triggers/manualTrigger');
const WhatsAppReceive = require('./triggers/whatsappReceive');
const TelegramReceive = require('./triggers/telegramReceive');
const WebhookTrigger = require('./triggers/webhookTrigger');
const ScheduleTrigger = require('./triggers/scheduleTrigger');
const EmailReceive = require('./triggers/emailReceive');

const WhatsAppSend = require('./actions/whatsappSend');
const TelegramSend = require('./actions/telegramSend');
const SendEmail = require('./actions/sendEmail');
const HttpRequest = require('./actions/httpRequest');

const AIAgent = require('./ai/aiAgent');
const AISummarize = require('./ai/aiSummarize');
const SentimentAnalysis = require('./ai/sentimentAnalysis');

const YouTubeComments = require('./data/youtubeComments');
const GoogleMapsScrape = require('./data/googleMapsScrape');

const IfCondition = require('./logic/ifCondition');
const SwitchNode = require('./logic/switchNode');
const MergeNode = require('./logic/mergeNode');
const SplitNode = require('./logic/splitNode');

const CsvExport = require('./output/csvExport');
const GoogleSheets = require('./output/googleSheets');
const GoogleDocs = require('./output/googleDocs');

registerNode('manual-trigger', ManualTrigger);
registerNode('whatsapp-receive', WhatsAppReceive);
registerNode('telegram-receive', TelegramReceive);
registerNode('webhook-trigger', WebhookTrigger);
registerNode('schedule-trigger', ScheduleTrigger);
registerNode('email-receive', EmailReceive);

registerNode('whatsapp-send', WhatsAppSend);
registerNode('telegram-send', TelegramSend);
registerNode('send-email', SendEmail);
registerNode('http-request', HttpRequest);

registerNode('ai-agent', AIAgent);
registerNode('ai-summarize', AISummarize);
registerNode('sentiment-analysis', SentimentAnalysis);

registerNode('youtube-comments', YouTubeComments);
registerNode('google-maps-scrape', GoogleMapsScrape);

registerNode('if-condition', IfCondition);
registerNode('switch', SwitchNode);
registerNode('merge', MergeNode);
registerNode('split', SplitNode);

registerNode('csv-export', CsvExport);
registerNode('google-sheets', GoogleSheets);
registerNode('google-docs', GoogleDocs);

require('../tools/getCurrentTime');
require('../tools/httpRequestTool');
require('../tools/searchWeb');
