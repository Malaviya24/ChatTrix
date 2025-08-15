# 🚀 Chattrix - Secure Chat Made Simple

<div align="center">

![Chattrix Logo](https://img.shields.io/badge/Chattrix-Secure%20Chat-blue?style=for-the-badge&logo=shield-check)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Socket.io](https://img.shields.io/badge/Socket.io-4.0-black?style=for-the-badge&logo=socket.io)

**Secure, real-time chat application with unlimited rooms and automatic message expiry**


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[🚀 Live Demo](#) • [📖 Documentation](#) • [🐛 Report Bug](#) • [💡 Request Feature](#)

</div>

---

## ✨ Overview

**Chattrix** is a modern, secure chat application that prioritizes user privacy and real-time communication. Built with Next.js and Socket.IO, it provides unlimited chat rooms with automatic message expiry, invisible messaging, and admin controls - all without requiring user registration.

### 🌟 Key Features

- **🔐 Password-Protected Rooms** - Secure access with SHA-256 hashing
- **⏰ Auto-Expiring Messages** - Messages automatically delete after 10 minutes
- **👻 Invisible Mode** - Hide messages until user interaction
- **👑 Admin Controls** - Room creators can manage participants
- **📱 Fully Responsive** - Optimized for all devices with smooth scrolling
- **🎨 Modern UI/UX** - Beautiful design with Framer Motion animations
- **📱 QR Code Sharing** - Easy room sharing via generated QR codes
- **♾️ Unlimited Rooms** - Create as many rooms as you want

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Malaviya24/ChatTrix.git
   cd chattrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend** | Next.js | 15.0 |
| **Language** | TypeScript | 5.0 |
| **Styling** | Tailwind CSS | 3.0 |
| **Animations** | Framer Motion | 10.0 |
| **Smooth Scrolling** | Lenis | Latest |
| **Real-time** | Socket.io | 4.0 |
| **In-Memory Storage** | Map Objects | Native |

### Project Structure

```
chattrix-nextjs/
├── src/
│   ├── app/                    # Next.js 13+ app directory
│   │   ├── api/               # API routes
│   │   │   ├── rooms/         # Room management APIs
│   │   │   └── socket.ts      # Socket.io server (Pages Router)
│   │   ├── chat/[roomId]/     # Dynamic chat room pages
│   │   ├── create-room/       # Room creation page
│   │   ├── join-room/         # Room joining page
│   │   └── room-created/      # Room success page
│   ├── components/            # Reusable components
│   │   ├── LenisProvider.tsx  # Smooth scrolling provider
│   │   ├── QRCodeGenerator.tsx
│   │   └── ResponsiveLayout.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useSocket.ts       # Socket.io client hook
│   │   ├── useLenis.ts        # Smooth scrolling hooks
│   │   └── useSmoothScroll.ts # Scroll utilities
│   ├── lib/                   # Utility libraries
│   │   ├── roomStorage.ts     # In-memory room storage
│   │   └── security.ts        # Security utilities
│   └── types/                 # TypeScript type definitions
├── pages/                     # Pages Router for Socket.IO
│   └── api/
│       └── socket.ts          # Persistent Socket.IO server
├── public/                    # Static assets
└── package.json               # Dependencies and scripts
```

---

## 🔒 Security Features

### Core Security

| Feature | Description | Status |
|---------|-------------|--------|
| **🔑 Password Protection** | Secure room access with SHA-256 hashing | ✅ Implemented |
| **⏰ Message Expiration** | Auto-delete after exactly 10 minutes | ✅ Implemented |
| **👤 Anonymous Users** | Random nicknames and emoji avatars | ✅ Implemented |
| **💾 In-Memory Storage** | Temporary data with automatic cleanup | ✅ Implemented |
| **👥 Participant Limits** | Configurable room capacity (2-50 users) | ✅ Implemented |
| **🛡️ Input Validation** | Comprehensive server-side validation | ✅ Implemented |
| **🚫 Rate Limiting** | Protection against abuse (unlimited room creation) | ✅ Implemented |
| **🔒 Room Privacy** | Password-protected room access | ✅ Implemented |

### Advanced Features

| Feature | Description | Status |
|---------|-------------|--------|
| **👻 Invisible Mode** | Hide messages until user interaction | ✅ Implemented |
| **📱 QR Code Sharing** | Secure room sharing mechanism | ✅ Implemented |
| **👑 Admin Controls** | Room creators can kick users | ✅ Implemented |
| **♾️ Unlimited Rooms** | No room creation limits | ✅ Implemented |
| **🔄 Persistent Admin** | Admin status maintained on refresh | ✅ Implemented |
| **📱 Mobile Optimized** | Responsive design for all devices | ✅ Implemented |
| **🎯 Smooth Scrolling** | Lenis-powered smooth animations | ✅ Implemented |

---

## 🎨 User Experience Features

### Core UX

| Feature | Description | Status |
|---------|-------------|--------|
| **📱 Responsive Design** | Mobile-first, works on all devices | ✅ Implemented |
| **⚡ Real-time Updates** | Live messaging via Socket.IO | ✅ Implemented |
| **⌨️ Typing Indicators** | See when others are typing | ✅ Implemented |
| **🎨 Smooth Animations** | Framer Motion + Lenis smooth scrolling | ✅ Implemented |
| **👆 Touch Optimized** | Mobile-friendly interactions | ✅ Implemented |
| **♿ Accessibility** | High contrast and readable text | ✅ Implemented |
| **🌙 Dark Theme** | Beautiful dark mode interface | ✅ Implemented |

---

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check
```

---

## 📱 Features in Detail

### 🔐 Room Management

- **Create Unlimited Rooms**: Generate password-protected chat rooms (no limits)
- **Join Existing Rooms**: Enter room ID and password
- **Room Persistence**: Rooms never expire (unlimited duration)
- **Creator Privileges**: Room creators can kick users and manage participants
- **QR Code Sharing**: Easy room sharing via generated QR codes

### 💬 Real-time Chat

- **Live Messaging**: Instant message delivery via Socket.IO
- **Typing Indicators**: See when others are typing
- **Message Expiration**: Auto-delete after exactly 10 minutes
- **Invisible Mode**: Hide messages until revealed
- **Admin Controls**: Room creators can remove participants

### 🛡️ Security Features

- **Anonymous Users**: Random nicknames and avatars
- **Password Protection**: SHA-256 hashed room passwords
- **Input Validation**: Server-side security validation
- **Rate Limiting**: Protection against abuse
- **Session Management**: Secure session handling

---

## 🎨 Design System

### Visual Theme

Chattrix features a modern, beautiful design with:

- **Clean Typography**: Modern, readable fonts
- **Smooth Animations**: Framer Motion powered transitions
- **Smooth Scrolling**: Lenis-powered scroll animations
- **Responsive Layout**: Mobile-first design approach
- **Accessibility**: High contrast and readable text

### Color Palette

- **Primary**: Blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale (#F9FAFB to #111827)

---

## 🔧 API Reference

### Room Management

#### Create Room
```http
POST /api/rooms
Content-Type: application/json

{
  "roomName": "My Chat Room",
  "password": "secure123",
  "maxParticipants": 10
}
```

#### Join Room
```http
POST /api/rooms/join
Content-Type: application/json

{
  "roomId": "ABC12345",
  "password": "secure123",
  "nickname": "User123",
  "avatar": "🚀"
}
```

#### Validate Room
```http
POST /api/rooms/validate
Content-Type: application/json

{
  "roomId": "ABC12345"
}
```

### Chat API

#### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-room` | Client → Server | Join a chat room |
| `send-message` | Client → Server | Send a message |
| `new-message` | Server → Client | Receive new message |
| `user-typing` | Bidirectional | Typing indicators |
| `user-joined` | Server → Client | User joined notification |
| `user-left` | Server → Client | User left notification |
| `kick-user` | Client → Server | Kick user (creator only) |
| `room-participants` | Server → Client | Update participant list |

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

### Netlify Deployment

1. **Connect Repository**
   - Link your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `.next`

2. **Build Settings**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "18"
   ```

---

## 🤝 Contributing

We welcome contributions! Please read our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- **Code Style**: Follow TypeScript and ESLint rules
- **Testing**: Add tests for new features
- **Documentation**: Update docs for API changes
- **Security**: Follow security best practices

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations
- **Lenis** for smooth scrolling
- **Socket.io** for real-time communication

---

## 📞 Support

- **🐛 Issues**: [GitHub Issues](https://github.com/Malaviya24/ChatTrix/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Malaviya24/ChatTrix/discussions)
- **📖 Docs**: [Documentation](https://docs.chattrix.com)

---

<div align="center">

**Made with ❤️ by the Chattrix Team**

[![GitHub stars](https://img.shields.io/github/stars/Malaviya24/ChatTrix?style=social)](https://github.com/Malaviya24/ChatTrix)
[![GitHub forks](https://img.shields.io/github/forks/Malaviya24/ChatTrix?style=social)](https://github.com/Malaviya24/ChatTrix)
[![GitHub issues](https://img.shields.io/github/issues/Malaviya24/ChatTrix)](https://github.com/Malaviya24/ChatTrix/issues)

</div>
