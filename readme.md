# 🌱 Smart Crop Advisory System for Small and Marginal Farmers  

## 📌 Team Information
- **Team Name:** AgriTech Innovators  
- **Team ID:** 102  
- **Members:**  
  - Rahul – Full Stack Develoment (Ionic/Angular, Integration, Backend & Database (Laravel, API handling)  )  
  - Monu – Plant Disease Scan Implementation and Weather api integration
  - Ritin – Chatbot Implementation  
  - Adityan Keshav – Presentation (Design)  
---

## 📝 Problem Statement
**"Smart Crop Advisory System for Small and Marginal Farmers"**  

A majority of small and marginal farmers in India rely on traditional knowledge, local shopkeepers, or guesswork for crop selection, pest control, and fertilizer use. They lack access to personalized, real-time advisory services that consider soil type, weather, and crop history.  
This leads to poor yield, excessive costs, and environmental degradation.  

Our solution is a **multilingual, AI-powered mobile application** that provides:  
- Personalized crop and fertilizer advisory.  
- Pest/disease detection via image uploads.  
- Weather-based predictive alerts.  
- Market price tracking.  
- Voice based listening features for low-literate users.  

---

## 🛠️ Tech Stack Used
- **Frontend (Mobile App):** Ionic + Capacitor + Angular  
- **Backend (API):** Laravel (PHP) hosted on test server  
- **APIs:**  
  - Weather: OpenWeatherMap API  
  - Market Prices: Agmarknet / Mock API  
  - Reasoning and Text-to-Speech: Gemini, ElevenLabs 
- **Database:** MySQL  

---

## 🚀 Features
- **Crop Selection** personalised suggessions to grow new crops according to the fields.  
- **Multilingual chatbot** (text + voice) for personalized advisory.  
- **Weather alerts & predictive insights** for better planning.  
- **Pest/disease detection via image uploads** with treatment suggestions.  
- **Market price tracking** for smarter selling decisions.  

---

## ⚙️ How to Run the Project

### You can directly install the provided app-debug.apk file on any Android device to test the application without additional setup.

### 1. Prerequisites
- Node.js (>= 18)  
- Ionic CLI (`npm install -g @ionic/cli`)  
- PHP (>= 8.1) & Composer  
- MySQL server  

### 2. Setup Frontend (Ionic Angular App)
```bash
# Clone repository
git clone <repo-url>
cd smart-crop-advisory-app

# Install dependencies
npm install

# Run app in browser
ionic serve

# For Android build
ionic capacitor build android
