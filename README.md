# REVOO Admin Portal

Enterprise back-office operations and fleet management console for the **REVOO Smartphone Buyback & Resale Platform**.

---

## 🚀 Overview

The **REVOO Admin Portal** empowers operations, catalog managers, and inspection teams to manage the end-to-end phone lifecycle, pricing engines, and customer buyback transactions.

### Key Features
- **📊 Real-time Operations Dashboard**: Track GMV, pending inspections, processed buybacks, and conversion KPIs.
- **📱 Dynamic Device Catalog**: Manage smartphone brands, series, models, variants, storage tiers, and high-res asset media.
- **🏷️ Automated Pricing Matrix**: Configure base valuations, age deprecation rules, body/screen defect penalties, and instant algorithmic cash quotes.
- **📋 Buyback & Inspection Management**: Complete doorstep inspection logs, photo verifications, counter-offers, and status workflows.
- **📢 Marketing & Banners**: Schedule promotional carousels, instant sell banners, and announcement badges for the mobile app.
- **🔒 Enterprise Security**: Role-based access control (RBAC), JWT token authentication with auto-refresh, and comprehensive audit logs.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS & PostCSS
- **State & Server Cache**: TanStack React Query v5
- **Routing**: React Router DOM v7
- **Forms & Validation**: React Hook Form + Zod resolvers
- **Icons**: Lucide React
- **HTTP Client**: Axios with automatic JWT refresh interceptor

---

## 📦 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/iamselva3/Revoo-admin.git
cd Revoo-admin

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the project:
```env
# Live Production Backend (Render)
VITE_API_BASE_URL=https://revoo-backend-ivqq.onrender.com/api/v1

# Or Local Development Backend
# VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 5. Production Build
```bash
# Typecheck and compile optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Connected Services

- **Backend API**: `https://revoo-backend-ivqq.onrender.com/api/v1`
- **Mobile App**: REVOO Flutter Client (Android / iOS)
- **Database**: MongoDB Atlas Cluster
