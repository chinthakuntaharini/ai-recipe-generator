# AI Recipe Generator

A serverless AI-powered recipe generation application built on AWS services. Generate personalized recipes based on your available ingredients using Amazon Bedrock's Titan AI model.

## 🚀 Features

- **AI-Powered Recipe Generation**: Uses Amazon Bedrock with Titan Text Express model
- **User Authentication**: Secure authentication with Amazon Cognito
- **Serverless Architecture**: Built entirely on AWS Lambda for scalability
- **JWT Token Validation**: Secure API endpoints with JWT middleware
- **Responsive Web Interface**: Clean, mobile-friendly frontend
- **Recipe History**: Store and retrieve your generated recipes (coming soon)
- **Cost-Optimized**: Designed to run within AWS free tier limits

## 🏗️ Architecture

```
User Browser
    ↓
[Frontend Web App]
    ↓
[Amazon Cognito] ← Authentication
    ↓
[API Gateway] ← JWT Token Validation
    ↓
[Lambda Functions]
    ↓
[Amazon Bedrock] ← AI Recipe Generation
    ↓
[DynamoDB] ← Recipe Storage (planned)
```

## 🛠️ Technology Stack

### Frontend
- HTML5/CSS3/JavaScript
- Responsive design
- AWS Amplify (hosting - planned)

### Backend
- Node.js 18.x with TypeScript
- AWS Lambda (serverless functions)
- Amazon API Gateway (REST API)
- Amazon Cognito (authentication)
- Amazon Bedrock with Titan Text Express (AI)
- Amazon DynamoDB (storage - planned)

### Infrastructure
- AWS CloudFormation (IaC)
- AWS CloudWatch (monitoring)
- AWS IAM (security)

## 📋 Prerequisites

- AWS Account
- Node.js 18.x or later
- AWS CLI configured
- Git

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/chinthakuntaharini/ai-recipe-generator.git
cd ai-recipe-generator
```

### 2. Backend Setup

```bash
cd ai-recipe-generator-backend
npm install
npm run build
```

### 3. Configure Environment Variables

Set these in your Lambda function:

```bash
COGNITO_REGION=us-east-1
USER_POOL_ID=your-user-pool-id
USER_POOL_CLIENT_ID=your-client-id
```

### 4. Deploy to AWS

```bash
# Package Lambda function
zip -r function.zip dist/ node_modules/

# Deploy using AWS CLI
aws lambda update-function-code \
  --function-name recipe-generator \
  --zip-file fileb://function.zip
```

### 5. Frontend Setup

Open `ai-recipe-generator-web/index.html` in your browser or deploy to AWS Amplify.

## 📖 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Recipe Endpoints

#### Generate Recipe
```http
POST /generate-recipe
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "ingredients": ["chicken", "rice", "vegetables"],
  "servings": 4
}
```

**Response:**
```json
{
  "id": "recipe-1234567890",
  "title": "Delicious Chicken Recipe",
  "ingredients": [
    {
      "name": "Chicken",
      "amount": "1 lb",
      "unit": ""
    }
  ],
  "instructions": [
    "Prepare the chicken...",
    "Heat oil in a pan...",
    "Cook until golden brown..."
  ],
  "prepTime": 15,
  "cookTime": 25,
  "servings": 4,
  "nutritionInfo": {
    "calories": 350,
    "protein": 25,
    "carbohydrates": 30,
    "fat": 12
  }
}
```

## 🔒 Security

- All API endpoints use HTTPS/TLS encryption
- JWT token validation on protected routes
- User data isolation (users can only access their own data)
- Input validation and sanitization
- AWS Cognito security features (password policies, account lockout)

## 💰 Cost Optimization

Designed to operate within AWS free tier:
- **Lambda**: 1M requests/month, 400,000 GB-seconds
- **DynamoDB**: 25 GB storage, 25 RCU/WCU
- **Cognito**: 50,000 MAU
- **API Gateway**: 1M API calls/month
- **Bedrock**: Pay-per-use (minimal cost)

**Estimated Monthly Cost**: $0-5 (within free tier)

## 📁 Project Structure

```
ai-recipe-generator/
├── ai-recipe-generator-backend/
│   ├── src/
│   │   ├── handlers/          # Lambda handlers
│   │   ├── middleware/        # JWT authentication
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript types
│   ├── cloudformation/        # IaC templates
│   └── package.json
├── ai-recipe-generator-web/
│   └── index.html             # Frontend application
├── .kiro/specs/               # Project specifications
│   └── ai-recipe-generator/
│       ├── requirements.md    # Functional requirements
│       ├── design.md          # System design
│       └── tasks.md           # Implementation tasks
└── README.md
```

## 🧪 Testing

### Run Unit Tests
```bash
cd ai-recipe-generator-backend
npm test
```

### Run Integration Tests
```bash
npm run test:integration
```

### Test Recipe Generation
```bash
node debug-lambda-error.js
```

## 📝 Documentation

- [Requirements Document](.kiro/specs/ai-recipe-generator/requirements.md)
- [Design Document](.kiro/specs/ai-recipe-generator/design.md)
- [Implementation Tasks](.kiro/specs/ai-recipe-generator/tasks.md)
- [Deployment Guide](ai-recipe-generator-backend/DEPLOYMENT.md)
- [Backend README](ai-recipe-generator-backend/README.md)

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ User authentication system
- ✅ JWT token validation
- ✅ Recipe generation with Titan AI
- ✅ Basic web interface

### Phase 2 (Planned)
- [ ] DynamoDB integration for recipe storage
- [ ] Recipe history dashboard
- [ ] Favorite recipes functionality
- [ ] Advanced search and filtering

### Phase 3 (Future)
- [ ] Dietary restrictions and preferences
- [ ] Nutritional analysis
- [ ] Meal planning features
- [ ] Social sharing capabilities

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Harini Chinthakunta** - [GitHub](https://github.com/chinthakuntaharini)

## 🙏 Acknowledgments

- AWS for providing excellent cloud services
- Amazon Bedrock for AI capabilities
- The open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using AWS Serverless Technologies**
