# 🎮 EduQuest AI

**A gamified, AI-powered study companion** that transforms your notes into interactive quizzes with RAG-powered tutoring.

[![Tech Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-FF6600?style=flat)](https://groq.com/)

---

## 🌟 Features

### Core Gameplay
- 🎯 **AI Quiz Generation**: Paste study notes → get 5 MCQ questions
- 🧙‍♂️ **Smart Tutor**: RAG-powered explanations when you get answers wrong
- 📊 **XP System**: Earn +10 XP per correct answer
- 🎨 **Gamified UI**: Prodigy-style interface with animations, sounds, and dynamic backgrounds
- 🖼️ **Visual Learning**: Auto-fetched Unsplash images based on quiz topic

### Technical Highlights
- ⚡ **Vector Search**: Sentence-transformers embeddings with cosine similarity
- 🔄 **Real-time Quiz Flow**: Upload → Vectorize → Generate → Play
- 🎭 **Immersive UX**: LoadingQuest component, bounce/shake animations, WebAudio feedback
- 🛡️ **Error Boundaries**: Graceful error handling throughout

---

## 🏗️ Architecture

```
eduQuest-ai/
├── backend/                 # FastAPI + MongoDB + Groq AI
│   ├── app/
│   │   ├── main.py         # FastAPI app with CORS
│   │   ├── routes/
│   │   │   ├── quiz.py     # POST /api/generate-quiz
│   │   │   └── content.py  # POST /api/upload, /api/ask-tutor
│   │   ├── services/
│   │   │   ├── ai_engine.py        # Groq Llama 3.1 wrapper
│   │   │   ├── embeddings.py      # sentence-transformers
│   │   │   └── vector_store.py    # Chunking + vector ops
│   │   ├── models/
│   │   │   └── schemas.py  # Pydantic models
│   │   └── config/
│   │       └── db.py       # Motor MongoDB client
│   └── requirements.txt
│
└── frontend/                # Next.js 14 + Tailwind CSS
    ├── app/
    │   ├── page.tsx        # Landing page
    │   ├── quest/page.tsx  # Notes upload + drag-drop
    │   ├── game/page.tsx   # Game Arena (quiz gameplay)
    │   └── layout.tsx      # Root layout with ErrorBoundary
    ├── components/
    │   ├── LoadingQuest.tsx       # Immersive loading screen
    │   ├── TutorModal.tsx         # RAG-powered tutor popup
    │   ├── CompletionScreen.tsx   # Final score screen
    │   └── ErrorBoundary.tsx      # React error boundary
    ├── hooks/
    │   └── useGame.ts      # Game state management
    └── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account (free tier)
- Groq API key (free tier)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add:
   ```env
   GROQ_API_KEY=your_groq_key_here
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
   MONGO_DB_NAME=eduquest
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

---

## 🎮 How to Play

1. **🏠 Home** → Click "Start Quest"
2. **📜 Paste Notes** → Upload your study material (or drag & drop a .txt file)
3. **⏳ LoadingQuest** → AI generates your personalized quiz
4. **⚔️ Game Arena** → Answer 5 multiple-choice questions
   - ✅ Correct answer: +10 XP, bounce animation, pleasant tone
   - ❌ Wrong answer: shake animation, tutor popup with RAG explanation
5. **🏆 Completion Screen** → See your score, grade, and XP earned

---

## 🔑 Key Endpoints

### Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Store study content with vector embeddings |
| `/api/generate-quiz` | POST | Generate 5 MCQ questions from text |
| `/api/ask-tutor` | POST | Get RAG-powered explanations for wrong answers |

**Example: Generate Quiz**
```bash
curl -X POST http://localhost:8000/api/generate-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "text_context": "Photosynthesis is the process by which plants convert light energy into chemical energy..."
  }'
```

**Response:**
```json
{
  "topic": "photosynthesis",
  "items": [
    {
      "question": "What is the primary energy source for photosynthesis?",
      "options": ["Water", "Sunlight", "Carbon Dioxide", "Oxygen"],
      "answer": "Sunlight",
      "explanation": "Plants use light energy from the sun to drive the photosynthetic process."
    }
  ]
}
```

---

## 🎨 Tech Stack Deep Dive

### Backend
- **FastAPI**: Async Python web framework (CORS-enabled for local dev)
- **Groq AI**: Llama 3.1 (70B) for quiz generation and tutoring
- **MongoDB Atlas**: Free-tier cloud database with Motor (async driver)
- **sentence-transformers**: `all-MiniLM-L6-v2` model for embeddings (~90MB)
- **Vector Store**: Custom implementation with cosine similarity retrieval

### Frontend
- **Next.js 14**: App Router with TypeScript
- **Tailwind CSS**: Custom theme with quest-themed colors and animations
- **React Hooks**: `useGame` for state management
- **WebAudio API**: Sound effects without external assets
- **Unsplash**: Free background images via `source.unsplash.com`

---

## 🚢 Deployment

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set environment variables:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.onrender.com
   ```
3. Deploy (automatic from `main` branch)

### Backend (Render)

1. Create new Web Service from GitHub
2. Set build command: `pip install -r backend/requirements.txt`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   ```
   GROQ_API_KEY=your_key
   MONGO_URI=your_mongo_uri
   MONGO_DB_NAME=eduquest
   ```

---

## 📊 Project Status

**MVP Completion: ~95%**

✅ Completed:
- AI quiz generation with topic extraction
- Vector store with RAG retrieval
- Upload → Quiz → Tutor flow
- Gamified UI with animations
- Error boundaries
- Completion screen
- Drag-and-drop upload

🔄 In Progress:
- Final end-to-end testing
- Documentation polish

📋 Future Enhancements:
- User authentication
- PDF upload support
- Progress persistence (localStorage)
- Multiple question types
- Difficulty levels
- Leaderboards

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is built as an MVP demo. Feel free to use for learning purposes.

---

## 🙏 Acknowledgments

- **Groq** for lightning-fast AI inference (free tier)
- **MongoDB Atlas** for generous free-tier database
- **Unsplash** for beautiful free images
- **sentence-transformers** for efficient embeddings

---

## 📧 Contact

For questions or feedback, open an issue on GitHub.

**Built with ❤️ for learners everywhere** 🎓
