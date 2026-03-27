# GraamVaani Setup Instructions

"The news radio in your pocket — no internet, no smartphone, no literacy required."

## 🚀 How to Run

To run the full-stack application, you need to start both the **Backend API** and the **Frontend Portal**.

### Option 1: Separate Terminals (Recommended for Logs)

**1. Start the Backend:**
```bash
cd backend
npm install
npm run dev
```
*The server will run at http://localhost:5000*

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*The portal will run at http://localhost:5173*

---

### Option 2: Single Command (Root Directory)

If you have `concurrently` installed, you can run everything from the root:

```bash
# First time setup
npm install
npm run install:all

# Launch both
npm run dev
```

## 🛠️ Prerequisites
- **Node.js**: v18+ recommended.
- **MongoDB**: Ensure you have a local instance running or update `MONGODB_URI` in `backend/.env`.

## 📁 Project Structure
- `/frontend`: Vite + React + Lucide (Premium Dashboard & Landing Page)
- `/backend`: Node.js + Express + Mongoose (API & Automated Bulletin Pipeline)
- `/backend/services`: Logic for News aggregation and TTS (Mocked for demo)
