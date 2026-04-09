# AI Recipe Generator - Frontend Redesign V2

A modern, feature-rich recipe generation application with animated UI, comprehensive user profiles, and AI-powered recipe generation.

## Features

- 🎨 **Animated UI**: Floating food icons and smooth hover effects
- 🖱️ **Custom Cursor**: Themed frying pan cursor with sizzle effects
- 📝 **7-Step Onboarding**: Personalized user preferences
- 🍳 **Advanced Recipe Form**: 10+ customization options
- 👤 **User Profiles**: Manage preferences and dietary information
- 📚 **Recipe History**: Save, favorite, and filter recipes
- 🎯 **AI-Powered**: Enhanced Bedrock prompts for better recipes
- 📱 **Responsive**: Works on mobile and desktop

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: CSS Modules with custom animations
- **Backend**: AWS Lambda + API Gateway
- **Auth**: Amazon Cognito
- **AI**: Amazon Bedrock (Claude 3 / Titan)
- **Database**: Amazon DynamoDB

## Getting Started

### Prerequisites

- Node.js 18+ installed
- AWS account with configured services
- AWS Cognito User Pool and Client ID
- API Gateway endpoint URL

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Update `.env.local` with your AWS credentials:
   ```env
   NEXT_PUBLIC_AWS_REGION=us-east-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
   NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
recipe-app-v2/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with floating background
│   └── page.tsx           # Home page with recipe form
├── components/            # React components
│   ├── FloatingBackground.tsx
│   ├── RecipeForm.tsx
│   └── onboarding/        # Onboarding step components
│       ├── OnboardingModal.tsx
│       ├── Step1DietPreference.tsx
│       ├── Step2SpiceLevel.tsx
│       ├── Step3CookingGoal.tsx
│       ├── Step4FavoriteCuisines.tsx
│       ├── Step5Appliances.tsx
│       ├── Step6Restrictions.tsx
│       └── Step7CookTime.tsx
├── lib/                   # Utility libraries
│   ├── api-client.ts     # API client for backend
│   └── onboarding-machine.ts
├── types/                 # TypeScript type definitions
│   └── index.ts
├── styles/               # Global styles
│   └── globals.css
└── .env.local           # Environment variables

```

## Features in Detail

### 1. Floating Background Animation

- 12 animated food/cooking icons
- CSS-only animations (no JavaScript)
- Subtle opacity (0.06-0.12) for non-intrusive effect
- Varied speeds (8-20 seconds) and rotations

### 2. Custom Cursor

- Frying pan icon for default cursor
- Sizzle effect on hover over interactive elements
- Automatically disabled on touch devices
- Base64-encoded SVG for performance

### 3. Onboarding Quiz

7-step personalized setup:
1. Diet preference (Veg/Non-Veg/Vegan/Eggetarian)
2. Spice level (Mild to Very Spicy)
3. Cooking goal (Taste/Fitness/Quick/Balanced)
4. Favorite cuisines (multi-select)
5. Available appliances (multi-select)
6. Dietary restrictions (multi-select)
7. Usual cooking time

### 4. Recipe Form

Comprehensive controls:
- Diet type toggle
- Meal type selector
- Cuisine chips (15+ options)
- Cooking style selector
- Appliance multi-select
- Pantry staples toggles
- Spice level slider
- Health goal selector
- Cook time slider (10-120 min)
- Ingredient input with voice support

### 5. Enhanced Bedrock Prompts

Dynamic prompt construction including:
- All form parameters
- User preferences from profile
- Dietary restrictions
- Appliance constraints
- Time limitations

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## API Endpoints

The app expects the following backend endpoints:

- `POST /profile/onboarding` - Create user profile from onboarding
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /recipes` - Get user's recipe history
- `GET /recipes/:id` - Get single recipe
- `PUT /recipes/:id/favorite` - Toggle favorite status
- `DELETE /recipes/:id` - Delete recipe
- `POST /generate-recipe` - Generate new recipe

## Troubleshooting

### npm SSL Error

If you encounter SSL errors during `npm install`:
```bash
npm config set strict-ssl false
```

### Custom Cursor Not Showing

- Check browser console for SVG encoding errors
- Verify cursor size is 28x28px
- Ensure fallback cursor is set

### Floating Elements Not Animating

- Check that CSS animations are enabled in browser
- Verify `--float-*` CSS variables are set correctly
- Check browser DevTools for animation performance

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js and AWS**
