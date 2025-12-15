# 🎓 Campus Assistant AI

**Your intelligent companion for navigating campus life.**

![Project Status](https://img.shields.io/badge/Status-In%20Development-orange)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20JavaScript-blue)

---

## 📖 Non-Technical Overview
### What is Campus Assistant?
Campus Assistant AI is a web application designed to help students, faculty, and visitors navigate the complexities of campus life. Instead of searching through multiple notice boards or websites, users can interact with this assistant to get instant answers.

### Why did we build this?
University campuses can be overwhelming. Information regarding schedules, locations, and events is often scattered. This project aims to centralize that information into a single, easy-to-use interface.

### Key Features
* **🤖 AI Chat Support:** Ask natural language questions like *"Where is the library?"* or *"When is the next break?"*
* **📍 Campus Navigation:** (Optional: Add if relevant) Interactive maps to find classrooms and labs.
* **📅 Event Scheduling:** Real-time updates on campus events and academic calendars.
* **📱 User-Friendly Interface:** Designed to be accessible on both desktop and mobile devices.

---

## ⚙️ Technical Documentation
### Tech Stack
This project is built using a modern frontend stack to ensure speed and reactivity.

* **Frontend:** [React.js](https://reactjs.org/) (v18+)
* **Language:** JavaScript (ES6+)
* **Styling:**  Tailwind 
* **State Management:** React Hooks (useState, useEffect)
* **Version Control:** Git & GitHub

### Prerequisites
Before running this project locally, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v14 or higher)
* npm (Node Package Manager)

### 🚀 Installation & Setup Guide

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/GopalakrishnanDhavasi/campus-assistant-ai.git](https://github.com/GopalakrishnanDhavasi/campus-assistant-ai.git)
    cd campus-assistant-ai
    ```

2.  **Install Dependencies**
    This installs all the required libraries listed in `package.json`.
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    * Create a `.env` file in the root directory.
    * Add your API keys (e.g., if you are using OpenAI or a database):
    ```env
    REACT_APP_API_KEY=your_api_key_here
    ```

4.  **Run the Application**
    Start the local development server.
    ```bash
    npm start
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Project Structure
```text
campus-assistant-ai/
├── public/              # Static assets (images, favicon, manifest)
├── src/
│   ├── components/      # Reusable UI components (Buttons, Chatbox, etc.)
│   ├── pages/           # Full page views (Home, About, Dashboard)
│   ├── services/        # API calls and backend logic connections
│   ├── App.js           # Main application component
│   └── index.js         # Entry point
├── .gitignore           # Files to exclude from Git
├── package.json         # Project metadata and dependencies
└── README.md            # Project documentation
