# 🤖 WhatsApp Smart Chatbot

<!-- PORT=3000 -->


A clean, modular, production-ready WhatsApp chatbot built with **whatsapp-web.js** that responds intelligently using a knowledge base and AI-style prompt logic.

---

## 📁 Project Structure

```
project-root/
│── src/
│   ├── bot/
│   │   ├── client.js          # WhatsApp client setup & event handling
│   │   ├── messageHandler.js  # Message processing & command routing
│   │   ├── aiEngine.js        # AI-style response generation
│   │   └── knowledgeBase.js   # Predefined Q&A knowledge base
│   ├── routes/
│   │   └── health.js          # Express health check endpoint
│   ├── utils/
│   │   └── logger.js          # Colored, timestamped logging utility
│   └── app.js                 # Application entry point
│
│── .env                       # Environment variables
│── package.json
│── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)
- **Google Chrome** or **Chromium** (required by Puppeteer for whatsapp-web.js)

### Steps

1. **Clone or navigate to the project directory:**

   ```bash
   cd /path/to/project
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**

   The `.env` file is already included with default values:
   ```
   PORT=5000
   ```

---

## ▶️ How to Run

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

---

## 📱 How to Scan the QR Code

1. Run the bot using `npm start` or `npm run dev`
2. A **QR code** will appear in your terminal
3. Open **WhatsApp** on your phone
4. Go to **Settings** → **Linked Devices** → **Link a Device**
5. Scan the QR code displayed in the terminal
6. Once scanned, the bot will show: `✅ WhatsApp client is ready!`

> **Note:** After the first scan, the session is saved locally (via `LocalAuth`). You won't need to scan again unless you delete the `.wwebjs_auth` folder.

---

## 💬 Bot Commands

| Command   | Description                     |
|-----------|---------------------------------|
| `!help`   | Show available features & topics |
| `!about`  | Learn about the bot              |

---

## 🧠 How It Works

1. **User sends a message** on WhatsApp
2. **Message Handler** normalizes input and checks for commands
3. If no command, the **AI Engine** processes the message:
   - Checks the **Knowledge Base** for keyword matches
   - Detects greetings and responds warmly
   - Detects questions and provides contextual replies
   - Falls back to a smart acknowledgment for unknown topics
4. **Response is sent** back to the user

---

## 📡 Health Check

While the bot is running, you can verify the server status:

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "Bot is running",
  "uptime": 42.5,
  "timestamp": "2026-03-25T17:30:00.000Z"
}
```

---

## 🛠️ Customization

### Adding Knowledge Base Entries

Edit `src/bot/knowledgeBase.js` and add new entries to the array:

```js
{
  keywords: ['your', 'keywords', 'here'],
  answer: 'Your custom answer here.'
}
```

### Adding Commands

Edit `src/bot/messageHandler.js` and add to the `COMMANDS` object:

```js
'!mycommand': {
  description: 'My custom command',
  handler: () => 'Custom response here!',
}
```

---

## 📦 Tech Stack

- **Node.js** — Runtime environment
- **Express.js** — Health check server
- **whatsapp-web.js** — WhatsApp Web API client
- **qrcode-terminal** — QR code display in terminal
- **dotenv** — Environment variable management

---

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|---------|
| QR code not showing | Ensure Chrome/Chromium is installed |
| Authentication fails | Delete `.wwebjs_auth` folder and restart |
| Bot not responding | Check that you're messaging in a private chat (not a group) |
| Port already in use | Change the `PORT` value in `.env` |

---

## 📄 License

ISC
