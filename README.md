# Skillforge — Student Learning Application

**Learning Management System (LMS)**

A lightweight, modular LMS rebuilt from a previous prototype using an iterative & incremental approach. Skillforge focuses on practical teaching workflows: authentication & authorization, responsive UI, clear role abstraction (student, tutor, admin), course/tutorial management, integrated virtual tutorials (Google Meet), and useful academic resources.

---

## ✨ Key Features

### 📚 Accessible Tutorials

* Students can explore tutorials organized by topic to reinforce Computer Science concepts outside lecture hours.
* Tutorials can be scheduled, described, and linked to live sessions.

### 💻 Coding Practice Environment

* Interactive coding practice area for sharpening programming skills.
* In-progress: auto-grading and immediate feedback for code submissions (planned feature).

### 🌐 Virtual Tutorial Sessions (Google Meet)

* Tutors can provision Google Meet links when creating tutorials.
* Students join via a secure Join button (opens Meet in a new tab for compatibility and security).
* Provisioning is automated using the Google Calendar API via secure Cloud Functions (optional OAuth/service-account methods supported).

### 🗂️ Academic Resources Access

Centralized access to useful study materials, including:

* Past exam papers
* Study guides
* Online compilers and math solvers
* Lecture supplements and notes

### 🔐 User Authentication

* Secure login and registration using **Firebase Authentication** (Email/Password and optional Google Sign-In).
* Role-based access: `student`, `tutor`, `admin` (enforced via Firebase custom claims and Firestore security rules).

### 📈 Basic Analytics & Attendance

* Attendance events are logged to Firestore for later analytics (attendance counts, engagement tracking).

### 🛠️ Built With

* **Frontend:** React.js, Tailwind CSS
* **Backend / Serverless:** Firebase Authentication, Firestore, Firebase Cloud Functions (Node.js)
* **Hosting:** Firebase Hosting (or any static host)
* **Synchronous Meetings:** Google Meet (provisioned via Google Calendar API)

---

## 🌐 Live Demo

*If you have a deployed instance, add the live demo URL here.*

---

## ⚙️ Quick Start (Development)

Prerequisites: Node.js (18+ recommended), npm or yarn, Firebase CLI, and a Google Cloud project for Meet provisioning (optional).

```bash
# Clone the repo
git clone <repo-url>
cd skillforge

# Install client deps
cd client && npm install

# Install functions deps
cd ../functions && npm install

# Run the frontend locally
cd ../client
npm run dev

# Run Firebase emulators (recommended)
firebase emulators:start --only auth,firestore,functions,hosting
```

> Use the Firebase Emulator Suite to test Firestore rules and Cloud Functions without consuming production quota.

---

## ⚙️ Environment & Configuration

Create `.env.local` in the client and set these (example keys):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

For Cloud Functions, configure Google credentials securely using Firebase Functions config or Secret Manager:

```bash
firebase functions:config:set google.service_account_email="svc@project.iam.gserviceaccount.com" google.private_key="-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
"
```

**Do not commit secrets to source control.**

---

## 🔧 Firebase Setup (Summary)

1. Create a Firebase project.
2. Enable Authentication (Email/Password; enable Google provider if desired).
3. Create Firestore (Native mode).
4. Enable Cloud Functions and deploy service credentials for Google Calendar API usage if you want auto-provisioning of Meet links.
5. Optional: Configure Firebase Hosting for the client build.

### Recommended Firestore Collections

* `users/{userId}` — `{ displayName, email, role }`
* `tutorials/{tutorialId}` — `{ title, description, startTime, endTime, meetLink, hostId, visibility }`
* `attendance/{tutorialId}/{userId}` — `{ joinedAt, leftAt }`

### Example Firestore Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tutorials/{tutorialId} {
      allow read: if request.auth != null;
      allow create: if request.auth.token.role in ['tutor','admin'];
      allow update, delete: if request.auth.token.role in ['tutor','admin'] && request.auth.uid == resource.data.hostId;
    }
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
  }
}
```

---

## 🔔 Google Meet Provisioning (Calendar API)

Skillforge supports two provisioning models for Meet links:

1. **OAuth per tutor:** Tutors authorize the app to create events in their calendar (requires implementing OAuth flows).
2. **Service account with domain delegation (Google Workspace):** For institutional deployments where domain-wide delegation is possible.

**Flow (high-level):**

* Tutor requests auto-provision when creating a tutorial → Client calls a secure Cloud Function → Function calls Google Calendar API with `conferenceData.createRequest` → Calendar API returns a Meet join URL → Function stores meet link in `tutorials/{id}`.

**Note:** Embedding Google Meet inside an iframe is not reliable due to security policies; the Join button opens the Meet link in a new tab/window.

---

## 🔒 Security & Access Control

* Assign roles via Firebase custom claims: `admin.auth().setCustomUserClaims(uid, { role: 'tutor' })` (admin-only).
* Enforce role checks in Firestore rules and in server-side Cloud Functions.
* Keep all API keys and private keys out of client bundles and source control.

---

## 🧪 SQA & Testing Strategy

* **Unit tests:** Jest + React Testing Library for React components.
* **Integration tests:** Use Firebase emulators to test Cloud Functions and Firestore interactions locally.
* **Manual usability tests:** Conduct small user trials each iteration and collect feedback.
* **CI:** GitHub Actions to run linting and tests on PRs.

**Test focus areas:** authentication flows, tutorial creation/provisioning, role-based access, and join flow UX.

---

## 🧭 Workflows

### Tutor / Admin

* Create Tutorial: fill metadata, choose auto-provision (Google Meet) or paste manual link.
* Manage Tutorials: edit schedule, cancel (optionally trigger calendar event removal).

### Student

* Browse tutorials, register/enroll (if required), and click `Join` to open Google Meet.
* Access academic resources from the dashboard.

### System Admin / DevOps

* Manage service account or OAuth client IDs, rotate keys, and monitor Firebase usage.

---

## 🛠️ Development Guidelines

* Branching: `main`, `dev`, `feature/*`, `hotfix/*`.
* Code style: ESLint + Prettier; follow React component best practices.
* Commits: Use conventional commit messages (e.g., `feat: add tutorial form`).
* PRs: Require at least one reviewer and passing CI checks.

---

## 🚀 Roadmap / Future Improvements

* Auto-grading and immediate feedback for code exercises.
* Native mobile apps (Android/iOS) or responsive PWA.
* Gamification (badges, leaderboards).
* In-app chat/Q\&A synchronized with tutorials.
* Self-hosted interactive sessions (LiveKit/Jitsi) for a fully embedded experience.
* Analytics dashboard for tutors and admins (engagement, attendance).

---

## ❓ Troubleshooting & FAQs

**Q: Why does `Join` open a new tab?**
A: Google Meet embedding is restricted. Opening a new tab ensures compatibility and avoids security issues.

**Q: Meet link not provisioned?**
A: Check Cloud Function logs for Calendar API errors (auth/quota). Ensure service account/OAuth credentials are correctly configured.

**Q: How to assign a tutor role?**
A: Use an admin-only Cloud Function or Firebase Admin SDK to set custom claims for the user.

---

## 🤝 Contributing

Contributions are welcome. Steps:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m "feat: describe your change"`
4. Push and open a PR

Please run tests and lint locally before opening a PR.

---

## 📝 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

Suwilanji Trey Chellah
University of Zambia | Department of Computing and Informatics

---

*README updated — I merged your original content and broadened setup, security, and development sections. Want me to push this as `README.md` to the repo or generate `CONTRIBUTING.md` and `CHANGELOG.md` next?*
