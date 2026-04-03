# 🗳️ VoteHub - Secure Digital Voting Platform

Professional-grade, secure, and intuitive digital voting system built with React, Node.js, and MongoDB.

---

## ✨ Features

- **🛡️ Secure Access**: BCrypt-hashed passwords for both voters and admins.
- **🗳️ Multi-Vote Support**: Configurable number of votes per person via admin settings.
- **📊 Real-time Results**: Live vote count visualization for admins.
- **👥 Flexible Management**:
  - Add, edit, or delete candidates.
  - Bulk upload voters via CSV.
  - Reset voter status (allowing them to vote again).
- **🚀 Cloud Ready**: Optimized for Vercel deployment with serverless functions.
- **🎨 Premium UI**: Modern, glassmorphism-inspired design with smooth animations.

---

## 🛠️ Tech Stack

- **Frontend**: [React](https://reactjs.org/), [Lucide-Icons](https://lucide.dev/), [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Mongoose](https://mongoosejs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- **Deployment**: [Vercel](https://vercel.com/) (Serverless Ready)

---

## 🚀 Getting Started

### 📦 Prerequisites

1.  **Node.js**: v14.0 or higher.
2.  **MongoDB**: 
    - **Local**: [Install MongoDB Community](https://www.mongodb.com/try/download/community)
    - **Cloud**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)

---

### ⚙️ Installation

1.  **Clone & Backend Install**:
    ```bash
    cd Vote
    npm install
    ```

2.  **Frontend Setup**:
    ```bash
    cd votehub-frontend
    npm install
    cd ..
    ```

---

### ▶️ Running Locally

1.  **Start Backend**:
    ```bash
    node server.js
    ```
    *Server will listen on [http://localhost:5000](http://localhost:5000)*

2.  **Start Frontend**:
    ```bash
    cd votehub-frontend
    npm start
    ```
    *App will open on [http://localhost:3000](http://localhost:3000)*

3.  **Initial Connection**:
    - Enter your MongoDB URI (e.g., `mongodb://localhost:27017` or Atlas URI) in the Setup screen.
    - **Default Admin Credentials**:
      - **Email**: `admin@vote.com`
      - **Password**: `admin123`

---

## ☁️ Deployment (Vercel)

1.  **Import to Vercel**: Connect your repository.
2.  **Environment Variables**:
    - `MONGODB_URI`: Your full MongoDB Atlas connection string (with password).
    - `MONGODB_DB_NAME`: `votingSystem`
3.  **Deploy**: Vercel handles the API routing via the `/api` directory.

---

## 📁 Project Structure

- `/api`: Vercel serverless functions (backend).
- `/votehub-frontend`: React frontend application.
- `server.js`: Standard Node.js entry point for local development.
- `MONGODB_CONFIG.md`: Detailed guide for database setup.

---

## 📄 License
MIT License - Developed with ❤️ by [Your Name/Org]
