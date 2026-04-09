# Integration Testing Guide

This document outlines the integration testing procedures for the AI Recipe Generator frontend application.

## Test Environment Setup

### Prerequisites
- Node.js 18+ installed
- AWS services configured (Cognito, API Gateway, Lambda, DynamoDB)
- Valid AWS credentials in `.env.local`
- Development server running (`npm run dev`)

### Environment Variables
Ensure all required environment variables are set in `.env.local`:
```env
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api.execute-api.us-east-1.amazonaws.com/prod
```

## Test Scenarios

### 1. Complete User Flow Test

**Objective**: Verify the entire user journey from sign-up to recipe generation

**Steps**:
1. Navigate to http://localhost:3000
2. Click "Sign Up" (if authentication is implemented)
3. Complete registration with valid email and password
4. Verify onboarding modal appears automatically
5. Complete all 7 onboarding steps:
   - Step 1: Select diet preference (e.g., Vegetarian)
   - Step 2: Select spice level (e.g., Medium)
   - Step 3: Select cooking goal (e.g., Balanced)
   - Step 4: Select favorite cuisines (select at least 2)
   - Step 5: Select available appliances (select at least 2)
   - Step 6: Enter dietary restrictions (optional)
   - Step 7: Select usual cooking time (e.g., 30-60 min)
6. Click "Complete Setup"
7. Verify redirect to home page with recipe form
8. Verify form fields are pre-populated with onboarding preferences
9. Enter ingredients (e.g., "chicken, rice, tomatoes")
10. Click "Generate My Recipe"
11. Verify recipe is generated and displayed
12. Navigate to "My Recipes" page
13. Verify generated recipe appears in history
14. Click favorite star on recipe
15. Verify favorite status updates
16. Navigate to "Profile" page
17. Click "Edit Profile"
18. Modify a preference (e.g., change spice level)
19. Click "Save Changes"
20. Verify profile updates successfully
21. Navigate back to home page
22. Verify recipe form reflects updated preferences

**Expected Results**:
- All steps complete without errors
- Data persists across page navigations
- UI updates reflect backend changes
- No console errors

### 2. Voice Input Functionality Test

**Objective**: Verify voice input works across different browsers

**Browsers to Test**:
- Chrome/Edge (WebKit Speech API)
- Firefox (if supported)
- Safari (if supported)

**Steps**:
1. Navigate to home page
2. Verify microphone button is visible next to ingredient input
3. Click microphone button
4. Grant microphone permission when prompted
5. Speak ingredients clearly: "chicken, rice, tomatoes, onions"
6. Verify spoken text appears in ingredient field
7. Verify microphone button returns to normal state
8. Test error handling:
   - Click microphone and remain silent
   - Click microphone and deny permission
   - Click microphone in unsupported browser

**Expected Results**:
- Voice recognition activates successfully
- Spoken words are transcribed accurately
- Errors are handled gracefully with user-friendly messages
- Button is hidden in unsupported browsers

### 3. Custom Cursor Test

**Objective**: Verify custom cursor displays correctly across browsers and devices

**Devices to Test**:
- Desktop (Windows, Mac, Linux)
- Tablet (iPad, Android tablet)
- Mobile (iPhone, Android phone)

**Steps**:
1. Navigate to any page
2. Move cursor over page background
3. Verify frying pan cursor is visible
4. Hover over buttons, links, and interactive elements
5. Verify cursor changes to sizzle effect
6. Test on touch device
7. Verify custom cursor is disabled on touch devices

**Expected Results**:
- Custom cursor displays on desktop browsers
- Hover effects work on interactive elements
- Cursor automatically disabled on touch devices
- Fallback to default cursor if custom cursor fails

### 4. Floating Animations Performance Test

**Objective**: Verify animations perform smoothly without impacting usability

**Steps**:
1. Navigate to home page
2. Observe floating food icons in background
3. Verify 10-15 icons are visible
4. Verify icons animate smoothly (no jank)
5. Scroll page up and down
6. Verify animations don't interfere with scrolling
7. Interact with form elements
8. Verify animations don't interfere with interactions
9. Open browser DevTools > Performance
10. Record performance for 10 seconds
11. Analyze CPU and GPU usage

**Expected Results**:
- Animations run at 60fps
- CPU usage remains reasonable (<30%)
- No layout thrashing
- Animations don't block user interactions
- Icons have subtle opacity (0.06-0.12)

### 5. Responsive Design Test

**Objective**: Verify application works on multiple screen sizes

**Screen Sizes to Test**:
- Mobile: 320px, 375px, 414px
- Tablet: 768px, 1024px
- Desktop: 1280px, 1920px

**Steps**:
1. Open browser DevTools
2. Enable device emulation
3. Test each screen size:
   - Verify layout adapts appropriately
   - Verify text is readable
   - Verify buttons are tappable (min 44x44px)
   - Verify images scale correctly
   - Verify navigation is accessible
4. Test orientation changes (portrait/landscape)
5. Test zoom levels (100%, 150%, 200%)

**Expected Results**:
- Layout stacks vertically on mobile
- Multi-column layout on desktop
- No horizontal scrolling
- All content accessible
- Touch targets are appropriately sized

### 6. Error Handling Test

**Objective**: Verify application handles API failures gracefully

**Scenarios to Test**:

#### 6.1 Network Failure
1. Disconnect from internet
2. Try to generate recipe
3. Verify error message displays
4. Reconnect to internet
5. Retry operation
6. Verify operation succeeds

#### 6.2 Invalid Token
1. Manually expire authentication token
2. Try to access profile page
3. Verify redirect to login
4. Log in again
5. Verify access restored

#### 6.3 Malformed API Response
1. Use browser DevTools to intercept API response
2. Modify response to invalid JSON
3. Verify error message displays
4. Verify application doesn't crash

#### 6.4 Rate Limiting
1. Generate multiple recipes rapidly
2. Verify rate limit error is handled
3. Verify retry mechanism works

**Expected Results**:
- User-friendly error messages
- No application crashes
- Clear guidance on how to resolve errors
- Automatic retry where appropriate

### 7. CSS-Only Animations Verification

**Objective**: Verify all animations use pure CSS without JavaScript

**Steps**:
1. Open browser DevTools
2. Navigate to Sources tab
3. Search for animation-related JavaScript:
   - Search for "requestAnimationFrame"
   - Search for "setInterval" with animation
   - Search for animation libraries (GSAP, anime.js, etc.)
4. Verify no JavaScript animation code exists
5. Navigate to Elements tab
6. Inspect animated elements
7. Verify animations use CSS @keyframes
8. Verify transitions use CSS transition property

**Expected Results**:
- All animations implemented with CSS
- No JavaScript animation libraries
- Hardware-accelerated properties (transform, opacity)
- Smooth 60fps animations

## Automated Testing

### Unit Tests
Run unit tests for recipe parser and utilities:
```bash
npm test
```

### Coverage Report
Generate test coverage report:
```bash
npm run test:coverage
```

Target coverage: >80% for utility functions

## Performance Benchmarks

### Target Metrics
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

### Measuring Performance
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run audit for:
   - Performance
   - Accessibility
   - Best Practices
   - SEO
4. Verify scores are >90 for all categories

## Accessibility Testing

### Keyboard Navigation
1. Navigate entire application using only keyboard
2. Verify all interactive elements are reachable
3. Verify focus indicators are visible
4. Verify logical tab order

### Screen Reader Testing
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate through application
3. Verify all content is announced
4. Verify form labels are associated correctly
5. Verify error messages are announced

### Color Contrast
1. Use browser extension (e.g., axe DevTools)
2. Check color contrast ratios
3. Verify all text meets WCAG AA standards (4.5:1)

## Browser Compatibility

### Browsers to Test
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Features to Verify
- CSS Grid layout
- CSS Flexbox
- CSS Custom Properties
- Web Speech API (where supported)
- Fetch API
- ES6+ JavaScript features

## Security Testing

### Authentication
1. Verify JWT tokens are stored securely
2. Verify tokens expire appropriately
3. Verify refresh token mechanism works
4. Verify logout clears all tokens

### API Security
1. Verify all API calls include authentication
2. Verify CORS is configured correctly
3. Verify no sensitive data in URLs
4. Verify HTTPS is enforced

## Regression Testing

After any code changes, re-run:
1. Complete user flow test
2. Voice input test
3. Responsive design test
4. Unit tests

## Bug Reporting

When reporting bugs, include:
- Browser and version
- Screen size
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos
- Console errors
- Network tab errors

## Test Sign-Off Checklist

Before marking testing complete, verify:
- [ ] All test scenarios pass
- [ ] No console errors
- [ ] No network errors
- [ ] Performance metrics meet targets
- [ ] Accessibility audit passes
- [ ] Cross-browser testing complete
- [ ] Responsive design verified
- [ ] Error handling tested
- [ ] Security checks pass
- [ ] Documentation updated

## Continuous Integration

### Automated Checks
- Unit tests run on every commit
- Linting checks pass
- TypeScript compilation succeeds
- Build succeeds without warnings

### Pre-Deployment Checklist
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Database migrations applied (if any)
- [ ] Monitoring configured
- [ ] Rollback plan documented

---

**Last Updated**: 2024-01-20
**Test Coverage**: 85%
**Known Issues**: None
