# 🩸 Blood-Donation-Management-System

![Project Banner](assets/banner.png)

## 🚀 Overview
**BloodConnect** is a comprehensive full-stack solution designed to bridge the gap between blood donors and healthcare facilities. By providing real-time tracking of blood requirements and donor availability, this system ensures that critical medical needs are met with efficiency and speed.

---

## ✨ Key Features

### 👤 For Donors
- **Smart Eligibility Tracking**: Automated calculation of donation intervals (90-day rule).
- **Availability Toggle**: Real-time status updates so hospitals can find you when it matters most.
- **Urgent Notifications**: Get notified of critical shortages in your specific location.
- **Personal Dashboard**: Track your donation history and impact.

### 🏥 For Hospitals
- **Dynamic Request Management**: Create and track blood requests with varying urgency levels.
- **Donor Matching**: Advanced search and matching based on blood type and current location.
- **Efficient Workflow**: Streamlined process for accepting donations and updating inventories.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Tailwind CSS, Vanilla JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL |
| **Auth** | JWT (JSON Web Tokens), Bcrypt hashing |
| **Design** | Modern Glassmorphism & Responsive Layouts |

---

## 📦 Getting Started

### Prerequisites
- Node.js installed
- MySQL Server running

### 1. Database Setup
Create a MySQL database and run the schema initialization:
```sql
CREATE DATABASE blood_donation;
-- Run your schema scripts here
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=blood_donation
JWT_SECRET=your_jwt_secret
```

### 3. Installation
```bash
# Install dependencies
npm install

# Start the backend server
node backend/server.js
```

### 4. Running the Frontend
Simply open `frontend/index.html` in your browser or use a Live Server extension in VS Code.

---

## 📸 Screenshots
*(Include screenshots here after taking them or use mockups)*

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
