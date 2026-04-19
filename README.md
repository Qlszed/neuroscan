# Digital Footprint Analyzer

An advanced AI-powered web platform for detecting academic stress in gifted adolescents through digital footprint analysis.

## Features

- **AI-Powered Analysis**: Uses RuBERT sentiment analysis model for Russian text
- **7-Component Stress Model**: Activity change, sentiment, social interactions, time patterns, geolocation, academic mentions, social feedback
- **Modern UI**: Glassmorphism design with smooth animations
- **Privacy-First**: Anonymized data processing with user consent
- **JWT Authentication**: Secure user authentication
- **Interactive Visualizations**: Radar charts, time-series graphs

## Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- React Router

### Backend
- Python 3.11+
- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- Transformers (RuBERT)
- JWT Authentication

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run the server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/analysis/` - Run stress analysis
- `GET /api/v1/analysis/history` - Get analysis history

## Environment Variables

```env
# Backend (.env)
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=digital_footprint
SECRET_KEY=your-secret-key
```

## License

MIT License - See LICENSE file for details.
