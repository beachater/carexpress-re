# CareXpress 🚑💊

CareXpress is a mobile application designed to provide fast, secure, and accessible prescription medicine delivery—especially for persons with disabilities, seniors, and solo-living individuals in the Philippines. The app connects patients, verified doctors, local pharmacies, and delivery drivers through a streamlined platform, ensuring prescription authenticity and on-time delivery with care.

---

## 📱 Features

* **Role-based dashboards** for Patients, Doctors, Pharmacists, and Drivers.
* **Doctor-verified prescription system** with secure upload and expiry tracking.
* **Digital prescription preview** and QR code scanning integration.
* **Supabase backend integration** for authentication and database operations.
* **Modern, clean UI** with React Native (Expo) and TypeScript.

---

## 📂 Project Structure

```
carexpress/
├── app/
│   ├── auth/                  # Login and registration screens
│   ├── patient/               # Patient dashboard and order screens
│   ├── doctor/                # Doctor dashboard and prescription tools
│   ├── pharmacist/            # Pharmacy order management
│   ├── driver/                # Delivery and routing interface
│   ├── role-select/           # User role selection screen
│   └── index.tsx             # Landing page
├── assets/                   # Logos, icons, fonts, and UI images
├── lib/
│   └── supabase.ts           # Supabase client and configuration
├── __tests__/                # Unit tests for critical components
├── app.json                  # Expo configuration
├── package.json              # Project metadata and dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md
```

---

## ⚙️ Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/carexpress-re.git
   cd carexpress-re
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npx expo start
   ```

4. **Run tests**

   ```bash
   npm test
   ```

---

## 📦 Dependencies

* **React Native (Expo)** – cross-platform mobile development
* **Supabase** – backend as a service (authentication, database, storage)
* **Expo Location** – for real-time GPS and mapping
* **React Navigation** – routing and navigation
* **TypeScript** – type-safe development
* **Jest + Testing Library** – for unit testing

---

## 🚀 Deployment Instructions (Optional for MVP)

### Option A: Expo Go (Development Preview)

1. Run `npx expo start`.
2. Scan the QR code using the **Expo Go** app on your mobile device.

### Option B: EAS Build

1. Install EAS CLI

   ```bash
   npm install -g eas-cli
   ```

2. Log in to Expo

   ```bash
   eas login
   ```

3. Configure build profile in `eas.json`

4. Build the app

   ```bash
   eas build -p android
   eas build -p ios
   ```

5. Submit to app stores with `eas submit`.

---

## 🛡️ Security & Authentication

* Role-based access via Supabase Auth
* Email/password login with session persistence
* Encrypted digital prescription previews

---

## 📌 Notes

* Doctor-only prescription uploads.
* Patients can only order what is verified and valid.
* Future features include real-time pharmacy inventory sync and delivery prioritization based on patient condition.

---

## 📬 Contact

CareXpress Team
📍 Cagayan de Oro, Philippines

---
