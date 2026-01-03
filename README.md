# 🚀 LabSync

<div align="center">

![Project Banner](https://img.shields.io/badge/LabSync-Automated_Verification-4f46e5?style=for-the-badge&logo=codeigniter&logoColor=white)

**The all-in-one workspace for academic submissions.**

Bridging HackerRank and your gradebook with automated verification and seamless tracking.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-LabSync-00C853?style=for-the-badge)](https://labsyncit.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔍 **Automated Verification** | Instantly validates HackerRank submission links and checks public profile activity. |
| 🎓 **Role-Based Access** | Dedicated dashboards for Students to submit work and Teachers to manage labs. |
| 📊 **One-Click Exports** | Generate comprehensive Excel sheets containing verification status, proof links, and timestamps. |
| 📂 **Proof Management** | Students upload screenshot proofs directly; Teachers view them side-by-side with code. |
| ⚡ **Real-time Tracking** | Live updates on student progress and submission status (Pending, Solved, Unverified). |

---

## 🛠️ Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-FD366E?style=for-the-badge&logo=appwrite&logoColor=white)

</div>

- **Frontend:** Next.js 15, React, Tailwind CSS, Shadcn/UI, Framer Motion
- **Backend:** Appwrite (Authentication, Database, Storage)
- **Database:** Appwrite Database
- **Deployment:** Vercel

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Appwrite Project (self-hosted or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/surajsinghbayas/LabSync.git

# Navigate to directory
cd LabSync

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# (Add your NEXT_PUBLIC_APPWRITE_PROJECT_ID and NEXT_PUBLIC_APPWRITE_ENDPOINT)

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
LabSync/
├── public/              # Static assets
├── scripts/             # Database initialization scripts
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── (auth)/      # Authentication routes
│   │   ├── (dashboard)/ # Student & Teacher dashboards
│   │   └── api/         # API routes (Verification logic)
│   ├── components/      # Reusable UI components
│   │   ├── landing/     # Landing page sections
│   │   └── ui/          # Shadcn/UI primitives
│   ├── lib/             # Utilities and Appwrite config
│   └── types/           # TypeScript definitions
└── package.json
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

<div align="center">

## 👨‍💻 Author

<img src="https://avatars.githubusercontent.com/surajsinghbayas" width="100" height="100" style="border-radius: 50%;" alt="Suraj Singh Bayas"/>

### **Suraj Singh Bayas**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/surajsinghbayas)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/surajbayas)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:surajyou45@gmail.com)

---

<p>
  Made with ❤️ in India
</p>

⭐ **Star this repo if you find it helpful!** ⭐

</div>
