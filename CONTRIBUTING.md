# 🤝 Contributing to Chattrix

Thank you for your interest in contributing to Chattrix! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Questions & Discussions](#questions--discussions)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

**Our Pledge**: We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

**Our Standards**: Examples of behavior that contributes to a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Git** 2.0 or higher
- **MongoDB** (local or Atlas)

### Fork and Clone

1. **Fork the repository**
   - Go to [https://github.com/yourusername/chattrix](https://github.com/yourusername/chattrix)
   - Click the "Fork" button in the top-right corner

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/chattrix.git
   cd chattrix
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/yourusername/chattrix.git
   ```

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

```bash
cp env.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

- **Local MongoDB**: Install and start MongoDB locally
- **MongoDB Atlas**: Create a free cluster and get your connection string

### 4. Start Development Server

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Reports**: Help us identify and fix issues
- **💡 Feature Requests**: Suggest new features or improvements
- **📚 Documentation**: Improve or add documentation
- **🎨 UI/UX Improvements**: Enhance the user interface
- **🔒 Security Enhancements**: Improve security features
- **🧪 Testing**: Add tests or improve test coverage
- **🚀 Performance**: Optimize performance and efficiency

### Before You Start

1. **Check existing issues** to avoid duplicates
2. **Discuss major changes** in an issue before implementing
3. **Keep changes focused** - one feature/fix per PR
4. **Follow the existing code style** and patterns

## 🎨 Code Style

### TypeScript

- Use **TypeScript** for all new code
- Follow **strict mode** guidelines
- Use **interfaces** for object shapes
- Prefer **const assertions** for immutable data
- Use **optional chaining** and **nullish coalescing**

### React/Next.js

- Use **functional components** with hooks
- Follow **Next.js 13+ app directory** conventions
- Use **TypeScript** for all components
- Implement **proper error boundaries**
- Use **React.memo** for performance optimization when needed

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Follow **mobile-first** responsive design
- Use **CSS variables** for theming
- Implement **dark/light mode** support
- Ensure **accessibility** compliance

### File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSocket.ts`)
- **Utilities**: camelCase (e.g., `encryption.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### Code Organization

```
src/
├── app/                    # Next.js app directory
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript definitions
└── styles/               # Global styles
```

## 🧪 Testing

### Testing Guidelines

- **Write tests** for new features
- **Update tests** when modifying existing code
- **Test edge cases** and error scenarios
- **Use descriptive test names**
- **Follow AAA pattern**: Arrange, Act, Assert

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=useSocket
```

### Test Structure

```typescript
describe('useSocket Hook', () => {
  describe('when connecting to a room', () => {
    it('should establish connection successfully', () => {
      // Arrange
      const roomId = 'test-room';
      const userId = 'test-user';
      
      // Act
      const result = renderHook(() => useSocket(roomId, userId));
      
      // Assert
      expect(result.result.current.isConnected).toBe(true);
    });
  });
});
```

## 🔄 Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
# or
git checkout -b fix/bug-description
```

### 2. Make Your Changes

- Write clean, readable code
- Add appropriate tests
- Update documentation if needed
- Follow the established patterns

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature

- Add new functionality for user management
- Include comprehensive tests
- Update documentation
- Fix related bugs

Closes #123"
```

### 4. Push to Your Fork

```bash
git push origin feature/amazing-feature
```

### 5. Create a Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Select the base branch (usually `main`)
- Fill out the PR template
- Submit the PR

### Pull Request Template

```markdown
## 📝 Description

Brief description of changes made.

## 🎯 Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## 🧪 Testing

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## 📱 Screenshots

If applicable, add screenshots to help explain your changes.

## 🔗 Related Issues

Closes #123
Related to #456
```

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
## 🐛 Bug Description

A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## ✅ Expected Behavior

A clear and concise description of what you expected to happen.

## ❌ Actual Behavior

A clear and concise description of what actually happened.

## 📱 Environment

- **OS**: [e.g. Windows 10, macOS 12.0]
- **Browser**: [e.g. Chrome 100, Safari 15]
- **Device**: [e.g. Desktop, iPhone 13]
- **Chattrix Version**: [e.g. 1.0.0]

## 📸 Screenshots

If applicable, add screenshots to help explain your problem.

## 📋 Additional Context

Add any other context about the problem here.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## 💡 Feature Description

A clear and concise description of the feature you'd like to see.

## 🎯 Problem Statement

A clear and concise description of what problem this feature would solve.

## 💭 Proposed Solution

A clear and concise description of what you want to happen.

## 🔄 Alternative Solutions

A clear and concise description of any alternative solutions or features you've considered.

## 📱 Use Cases

Describe specific use cases where this feature would be beneficial.

## 📋 Additional Context

Add any other context or screenshots about the feature request here.
```

## ❓ Questions & Discussions

### Getting Help

- **GitHub Issues**: Use issues for bugs and feature requests
- **GitHub Discussions**: Use discussions for questions and general topics
- **Discord**: Join our community server for real-time help

### Asking Good Questions

1. **Search first** - Check if your question has been answered
2. **Be specific** - Include relevant code and error messages
3. **Provide context** - Explain what you're trying to accomplish
4. **Show effort** - Demonstrate what you've already tried

## 🏆 Recognition

Contributors will be recognized in several ways:

- **Contributors list** on the main README
- **Special badges** for significant contributions
- **Mention in release notes** for major features
- **Community spotlight** for outstanding work

## 📚 Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Learning Resources

- [Next.js Learn](https://nextjs.org/learn)
- [React Tutorial](https://react.dev/learn)
- [TypeScript Tutorial](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🎉 Thank You!

Thank you for contributing to Chattrix! Your contributions help make this project better for everyone.

---

**Questions?** Feel free to open an issue or join our Discord community!
