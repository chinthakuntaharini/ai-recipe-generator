# IAM User Setup - Quick Reference

## Task 1.1.4: Create IAM User with Programmatic Access

### Quick Setup Commands

```bash
# 1. Create IAM user
aws iam create-user --user-name ai-recipe-generator-dev --path /developers/

# 2. Create and attach policy (use the provided policy JSON)
aws iam create-policy --policy-name ai-recipe-generator-dev-policy --policy-document file://policy.json
aws iam attach-user-policy --user-name ai-recipe-generator-dev --policy-arn arn:aws:iam::972803002725:policy/ai-recipe-generator-dev-policy

# 3. Create access keys
aws iam create-access-key --user-name ai-recipe-generator-dev
```

### Automated Setup

```powershell
# Run the automation script
.\create-iam-user.ps1

# Verify permissions
.\verify-iam-permissions.ps1
```

### Required AWS Services & Permissions

| Service | Purpose | Key Permissions |
|---------|---------|----------------|
| **Bedrock** | AI recipe generation | `bedrock:InvokeModel` for Claude 3 Sonnet |
| **Cognito** | User authentication | User pool management, JWT validation |
| **DynamoDB** | Recipe storage | Table operations, read/write access |
| **API Gateway** | REST API endpoints | API management, CORS configuration |
| **Lambda** | Serverless functions | Function management, execution |
| **Amplify** | Frontend hosting | App deployment, branch management |
| **CloudWatch** | Monitoring & logging | Log groups, metrics, dashboards |
| **CloudFormation** | Infrastructure as Code | Stack management, resource deployment |
| **IAM** | Role management | Service role creation for Lambda/API Gateway |
| **S3** | Deployment artifacts | Bucket operations for build artifacts |

### Security Configuration

- **User Name**: `ai-recipe-generator-dev`
- **Path**: `/developers/`
- **Policy**: Custom policy with least privilege access
- **Access Type**: Programmatic access only (no console access)
- **Resource Scope**: Limited to `ai-recipe-generator-*` resources

### Environment Setup

```bash
# Set environment variables
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-1"
export AWS_ACCOUNT_ID="972803002725"

# Configure AWS CLI profile
aws configure --profile ai-recipe-generator-dev
```

### Verification Checklist

- [ ] IAM user created successfully
- [ ] Custom policy attached
- [ ] Access keys generated and stored securely
- [ ] AWS CLI configured
- [ ] Basic service access tested
- [ ] Bedrock model access requested (if needed)

### Next Steps

1. **Enable Bedrock** (Task 1.2.1)
   - Request Claude 3 Sonnet model access
   - Test model invocation

2. **Set up Cognito** (Task 1.2.2)
   - Create user pool
   - Configure authentication

3. **Create DynamoDB table** (Task 1.2.3)
   - Design schema for recipe storage
   - Set up indexes

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Access denied errors | Verify policy attachment and resource ARNs |
| Bedrock access issues | Request model access in AWS Console |
| CLI configuration problems | Check credentials and region settings |

### Cost Monitoring

- All services configured to stay within AWS Free Tier limits
- Monitor usage through billing alerts (already set up)
- Use CloudWatch to track resource consumption

### Security Best Practices

- Rotate access keys every 90 days
- Never commit credentials to version control
- Use environment variables for credential storage
- Monitor API usage through CloudTrail
- Review permissions regularly

---

**Files Created:**
- `iam-user-setup-guide.md` - Detailed setup instructions
- `create-iam-user.ps1` - Automated setup script
- `verify-iam-permissions.ps1` - Permission verification script
- `iam-setup-quick-reference.md` - This quick reference