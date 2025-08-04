# StockKing

A web application for stock trading analysis using technical indicators and AI.

## Project Structure

```
StockKing/
├── frontend/          # React.js frontend
├── backend/           # Node.js/Express API
├── ai-service/        # Python AI microservice
└── docs/             # Documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.8+)
- PostgreSQL
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DandanITman/StockKing.git
cd StockKing
```

2. Set up the backend:
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials and API keys
npm run dev
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm start
```

4. Set up the AI service:
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
# or source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py
```

## Features (Planned)

- Track up to 100 stocks
- Technical indicator analysis
- AI-powered buy/sell recommendations
- Real-time stock data
- Intraday and swing trading modes
- Clean, responsive UI

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **AI Service**: Python with Flask
- **Styling**: Material-UI or Ant Design

## Development Status

🚧 **Project is in early development phase** 🚧

Currently setting up the basic project structure and development environment.
