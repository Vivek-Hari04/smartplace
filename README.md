# 🚀 SmartPlace — Placement Management System

SmartPlace is a full-stack web application designed to streamline the campus placement process by connecting students, faculty, advisors, and administrators on a single platform.

It provides structured workflows for managing placement drives, applications, offers, academic resources, and real-time system interactions.

---

## 🌐 Overview

SmartPlace digitizes and automates the entire placement lifecycle:

* Students can explore and apply for drives
* Companies can post offers
* Faculty can manage course materials
* Advisors can monitor student progress
* Admins control and oversee the system
* Users receive  notifications for critical updates

---

## 🧠 Tech Stack

### Frontend

* React.js
* Vite
* Axios

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL (Supabase)

### Authentication

* JWT-based authentication
* Role-based access control (RBAC)

### Realtime System

* Event-driven notifications

---

## 🏗️ Architecture

The backend follows a modular and scalable structure:

modules/
├── admin/
├── advisor/
├── faculty/
├── student/
middleware/
config/
routes/
controllers/
services/

### Flow

Route → Controller → Service → Database

* Routes → define endpoints
* Controllers → handle request/response
* Services → business logic
* Database → query execution

---

## 🔑 Core Features

### 🎓 Student

* View eligible placement drives
* Apply for offers
* Track application status
* Accept or reject offers
* Receive real-time updates on application status

### 🏢 Company / Placement

* Create placement drives
* Add job offers
* Manage applicants
* Notify students instantly

### 👨‍🏫 Faculty

* Upload course materials (Drive links)
* Manage academic content
* Notify students about new materials

### 🧑‍💼 Advisor

* Monitor student performance
* Track placement activity
* Receive alerts for important events

### 🛠️ Admin

* Manage users and roles
* System-level control
* Broadcast system-wide notifications

---

## 🔔 Real-Time Notification System

SmartPlace includes a notification system to ensure users stay updated.

### Features:

* updates on:

  * Application status changes
  * New placement drives
  * Offer acceptance/rejection
  * Course material uploads
* Role-specific notifications

---

## 📦 Key Functionalities

### Placement Drive Management

* Drives contain multiple offers
* Offers linked to companies
* Structured relational design

### Offer Application System

* Applications per offer
* Acceptance locks further actions
* Data integrity enforced

### Material Upload (Drive-based)

* No file storage dependency
* Uses external links
* Lightweight and scalable

### Role-Based Access Control

* Strict permission handling
* Secure route protection

---

## 🔐 Security

* JWT authentication
* Middleware authorization
* Ownership validation
* Parameterized SQL queries

---

## 🗄️ Database Design

* Strong relational schema
* Foreign key constraints
* Cascading deletes

Example flow:
placement_drives → placement_offers → offer_applications

---

## ⚙️ Setup

### Clone Repo

git clone 
cd smartplace

### Install Dependencies

npm install

### Environment Variables (.env)

PORT=5000
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret

### Run Backend

cd server

npm run dev

### Run Frontend

cd smartplace

npm install

npm run dev

---

## 🔌 API Example

### Upload Material

POST /courses//materials

Request Body:

{
"title": "Week 1 Notes",
"description": "Introduction lecture",
"file_url": "https://drive.google.com/..."
}

---

## 📈 Future Improvements

* Push notifications (mobile)
* AI-based recommendations
* Resume analysis
* Interview scheduling
* Notification preference settings

---

## 🤝 Contribution

Fork the repo and submit pull requests.
