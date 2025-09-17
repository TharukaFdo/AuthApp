# MERN Stack Authentication App

A full-stack web application built with MongoDB, Express.js, React, and Node.js featuring user authentication.

## Features

- ✅ User registration and login
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ MongoDB database integration
- ✅ React frontend with Vite
- ✅ Docker containerization
- ✅ Password hashing with bcrypt

## Project Structure

```
mern-auth-app/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── user.js
│   ├── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Home.jsx
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (local installation or MongoDB Atlas)
- Docker (optional)

### Local Development

1. **Clone and setup the project:**
   ```bash
   cd mern-auth-app
   ```

2. **Backend setup:**
   ```bash
   cd backend
   npm install
   # Make sure MongoDB is running locally or update MONGODB_URI in .env
   npm run dev
   ```

3. **Frontend setup (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Using Docker

1. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User Routes (`/api/user`)

- `GET /api/user/profile` - Get user profile (protected)

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mernauth
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
```

## Learning Concepts Covered

### Backend (Node.js/Express)
- RESTful API design
- MongoDB integration with Mongoose
- Password hashing with bcryptjs
- JWT authentication
- Middleware for route protection
- Error handling

### Frontend (React/Vite)
- React hooks (useState, useEffect)
- Component-based architecture
- API calls with Axios
- Local storage for token persistence
- Conditional rendering
- Form handling and validation

### DevOps
- Docker containerization
- Docker Compose for multi-service applications
- Environment configuration
- Development vs production setups

## Security Features

- Password hashing using bcryptjs
- JWT tokens for authentication
- Protected routes
- Input validation
- CORS configuration

## Next Steps for Learning

1. **Add form validation library** (e.g., Formik, React Hook Form)
2. **Implement password reset functionality**
3. **Add email verification**
4. **Implement role-based authorization**
5. **Add unit and integration tests**
6. **Deploy to cloud platforms** (Heroku, Vercel, AWS)
7. **Add CI/CD pipeline**
8. **Implement caching with Redis**
9. **Add API rate limiting**
10. **Implement refresh tokens**

## Troubleshooting

- Make sure MongoDB is running before starting the backend
- Check that all environment variables are set correctly
- Ensure ports 3000, 5000, and 27017 are available
- For Docker issues, try `docker-compose down` then `docker-compose up --build`