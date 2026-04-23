<div align="center">
  <br />
  <h1>🛡️ NeuralGate AI Security</h1>
  <p>
    <strong>A next-generation, fully client-side biometric authentication and control system.</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow.js" />
    <img src="https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue" alt="Framer Motion" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  </p>
</div>

<br />

NeuralGate is a state-of-the-art web application that brings enterprise-grade biometric security directly to the browser. Built entirely with client-side technologies, it features a **Facial Recognition Authentication System** and an interactive **Hand Gesture Control Interface** without requiring *any* backend servers or databases.

Your biometric data never leaves your device. 

## ✨ Key Features

- **👤 Facial Recognition Auth (`face-api.js`)**
  - Real-time 68-point face landmark detection.
  - High-accuracy neural network matching using 128-dimensional face embeddings.
  - Live emotion and expression detection.
  - Seamless face registration and authentication securely saved to local storage.
  
- **✋ Hand Gesture Control (`@mediapipe/tasks-vision`)**
  - 21-point 3D hand tracking powered by Google's MediaPipe.
  - Custom gesture recognition (Open Palm, Closed Fist, Thumb Up/Down, Pointing, etc.).
  - Virtual "System Simulator" demonstrating real-world applications (Power ON/OFF, Volume Control, Brightness Adjustment).

- **🔒 100% Client-Side Privacy**
  - Zero server round-trips. No backend needed.
  - All ML models run natively in the browser via WebGL acceleration.
  - Complete data residency on the user's device.

- **🎨 Premium UI/UX**
  - High-end dark theme with glassmorphism aesthetics.
  - Silky-smooth page transitions and micro-interactions powered by Framer Motion.
  - Fully responsive design optimized for desktop and mobile.

---

## 🚀 Quick Start

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neuralgate.git
   cd neuralgate
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the App**
   Navigate to `http://localhost:5173` in your browser. (Ensure your browser has permissions to access the webcam).

---

## 🏗️ Architecture & Stack

- **Frontend Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Machine Learning (Face)**: [face-api.js](https://justadudewhohacks.github.io/face-api.js/docs/index.html) (TensorFlow.js models)
- **Machine Learning (Hands)**: [@mediapipe/tasks-vision](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS with comprehensive custom properties (Variables), Glassmorphism, and responsive breakpoints.

---

## 🌐 Deploy to Vercel

Since NeuralGate has zero backend dependencies, it is inherently ready for edge deployment. You can easily deploy it to Vercel in seconds:

1. Push your code to a GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com/new).
3. Import your GitHub repository.
4. Vercel will automatically detect the **Vite** framework.
5. Click **Deploy**.

*Alternatively, deploy via Vercel CLI:*
```bash
npm i -g vercel
vercel
```

---

## 🕹️ How to Use

### Face Authentication
1. Navigate to the **Face Auth** tab.
2. Click **"Load AI Models"** to fetch the TensorFlow networks.
3. Click **"Start Camera"**.
4. To register, type your name in the input box, look at the camera until the bounding box appears, and click **"Capture & Register"**.
5. Switch to the **Authenticate** tab. Look at the camera and click **"Authenticate Now"** to log in and unlock the Dashboard.

### Gesture Control
1. Navigate to the **Gestures** tab.
2. Click **"Initialize AI Model"**.
3. Click **"Start Camera"**.
4. Use the following gestures to control the simulated system:
   - ✋ **Open Palm**: Power ON
   - ✊ **Closed Fist**: Power OFF
   - 👍 **Thumb Up**: Increase Volume
   - 👎 **Thumb Down**: Decrease Volume
   - ☝️ **Pointing Up**: Increase Brightness
   - 🤟 **"I Love You" Sign**: Lock Screen

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

<div align="center">
  <p>Built with 🩵 by an AI enthusiast.</p>
</div>
