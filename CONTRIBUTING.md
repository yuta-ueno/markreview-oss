# Contributing to MarkReview

We welcome contributions to MarkReview! This guide will help you get started.

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/markreview.git
cd markreview
```

2. Install dependencies:
```bash
npm install
```

3. Install Tauri CLI:
```bash
cargo install @tauri-apps/cli
```

4. Start development:
```bash
npm run tauri:dev
```

## Development Workflow

### Branching Strategy
- `main` - Stable release branch
- `feat/<feature-name>` - New features
- `fix/<bug-name>` - Bug fixes
- `chore/<task-name>` - Maintenance tasks

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: code formatting`
- `refactor: code restructuring`
- `test: add or update tests`
- `chore: maintenance tasks`

### Code Style
- ESLint and Prettier are enforced via CI
- Run `npm run lint` to check for issues
- Run `npm run format` to format code
- TypeScript strict mode is enabled

### Testing
- Run `npm run typecheck` for type checking
- Unit tests focus on hooks and utilities
- Manual testing in Tauri WebView required

## Project Structure

```
├─ src/                     # React frontend
│  ├─ components/           # React components
│  ├─ hooks/                # Custom React hooks
│  ├─ utils/                # Utility functions
│  └─ styles/               # CSS files
├─ src-tauri/               # Rust backend
│  ├─ src/main.rs          # Tauri entry point
│  └─ tauri.conf.json      # Tauri configuration
└─ .github/workflows/       # CI/CD pipelines
```

## Submission Guidelines

### Pull Request Process

1. **Create an Issue First**: For significant changes, create an issue to discuss the approach.

2. **Branch from main**: Create your feature branch from the latest main.

3. **Make Changes**: Implement your changes following the code style guidelines.

4. **Test Locally**:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   npm run tauri:dev  # Test in desktop app
   ```

5. **Write Tests**: Add unit tests for new functionality where applicable.

6. **Update Documentation**: Update README.md or other docs if needed.

7. **Submit PR**: Create a pull request with:
   - Clear title and description
   - Reference to related issue
   - Screenshots/videos for UI changes

### PR Template
```markdown
## Summary
Brief description of changes

## Changes
- List specific changes made

## Verification
- [ ] `npm run dev` works
- [ ] `npm run tauri:dev` works
- [ ] Screenshots or video of feature

## Related Issue
- Closes #<issue-number>
```

### Review Process
- All PRs require at least 1 approval
- CI must pass (lint, typecheck, build)
- Manual testing in Tauri app recommended
- Maintainers will review within 1-2 weeks

## MVP Development Tasks

The project follows a milestone-based approach with small tasks (2-6h each):

### Current MVP v0.1 Tasks
- [x] MVP-001 to MVP-015: Core functionality
- [ ] MVP-016: Documentation (in progress)
- [ ] MVP-017: Error Handling/Toast
- [ ] MVP-018: Telemetry disabled verification
- [ ] MVP-019: Minimal Unit Tests
- [ ] MVP-020: Release v0.1

Each task has a clear Definition of Done (DoD) - see [CLAUDE.md](.claude/CLAUDE.md) for details.

## Architecture Guidelines

### Frontend (React + TypeScript)
- Use functional components with hooks
- Avoid classes unless extending Error for custom errors
- No `any` or `unknown` types
- Prefer composition over inheritance

### State Management
- React hooks for local state
- localStorage for persistent settings
- No external state management libraries (keep it simple)

### Styling
- CSS files with CSS variables for theming
- No CSS-in-JS libraries
- Mobile-responsive design not required (desktop-only)

### Tauri Integration
- Use `@tauri-apps/api` for file system operations
- Handle errors gracefully with user-friendly messages
- No telemetry or external network requests

## Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check README.md and CLAUDE.md

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Follow the GitHub Community Guidelines

Thank you for contributing to MarkReview! 🚀