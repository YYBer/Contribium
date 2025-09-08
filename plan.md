## ✅ Testing & API Documentation

### 🔬 Testing Setup

#### 1. **Choose a Testing Framework**
- ✅ Install [Vitest](https://vitest.dev/) for unit and integration testing:
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
  ```

#### 2. **Configure Vitest**
- ✅ Add `vitest` config in `vite.config.ts`:
  ```ts
  test: {
    globals: true,
    environment: 'jsdom',
  },
  ```

#### 3. **Write Sample Tests**
- ✅ Create a `tests/` folder or colocate test files as `ComponentName.test.tsx`
- ✅ Example test for a React component:
  ```tsx
  import { render, screen } from '@testing-library/react'
  import { describe, it, expect } from 'vitest'
  import Home from '../pages/Home'

  describe('Home page', () => {
    it('renders correctly', () => {
      render(<Home />)
      expect(screen.getByText('Contribium')).toBeInTheDocument()
    })
  })
  ```

#### 4. **Add Test Scripts**
- ✅ Add to `package.json`:
  ```json
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
  ```

#### 5. **CI Integration**
- ✅ Add a test step in your CI (e.g., GitHub Actions):
  ```yaml
  - name: Run Tests
    run: npm run test
  ```

---

### 📘 Swagger API Documentation (For Supabase Edge Functions or REST Endpoints)

#### 1. **Install Swagger Tools**
  ```bash
  npm install swagger-jsdoc swagger-ui-express
  ```

#### 2. **Create Swagger Spec File**
- ✅ Create `swagger.js`:
  ```js
  const swaggerJSDoc = require('swagger-jsdoc')
  const swaggerUi = require('swagger-ui-express')

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Contribium API',
        version: '1.0.0',
        description: 'API documentation for Contribium edge functions',
      },
    },
    apis: ['./supabase/functions/**/*.ts'],
  }

  const swaggerSpec = swaggerJSDoc(options)
  module.exports = { swaggerSpec, swaggerUi }
  ```

#### 3. **Serve Swagger UI**
- ✅ In your Express app or local testing server:
  ```ts
  const express = require('express')
  const { swaggerSpec, swaggerUi } = require('./swagger')

  const app = express()
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  ```

#### 4. **Annotate API Functions**
- ✅ Use OpenAPI-style annotations in your edge functions:
  ```ts
  /**
   * @openapi
   * /hello:
   *   get:
   *     description: Returns a greeting
   *     responses:
   *       200:
   *         description: Successful response
   */
  ```

---

### ✅ Optional Enhancements

- [ ] Snapshot testing with `@testing-library/jest-dom`
- [ ] Code coverage with `c8` or `vitest --coverage`
- [ ] Lint and format checks in CI
- [ ] End-to-end testing with [Cypress](https://www.cypress.io/) or [Playwright](https://playwright.dev/)
- [ ] Type safety verification with `tsc --noEmit`
