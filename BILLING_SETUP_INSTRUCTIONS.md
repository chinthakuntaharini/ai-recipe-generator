# AWS Billing Alerts Setup Instructions
## AI Recipe Generator Project - Task 1.1.2

### Account Information
- **Account ID**: 972803002725
- **Account Name**: Vedanth Raj

## Quick Start Options

### Option 1: Automated Setup (Recommended)

#### For Windows (PowerShell):
```powershell
# Run the Python setup script
python setup-billing-alerts.py your-email@example.com
```

#### For Linux/macOS (Bash):
```bash
# Make script executable and run
chmod +x setup-billing-monitoring.sh
./setup-billing-monitoring.sh --email your-email@example.com
```

### Option 2: Manual Console Setup

Follow these step-by-step instructions if you prefer manual setup or if automated scripts fail.

## Step-by-Step Manual Setup

### Prerequisites
1. ✅ AWS CLI installed and configured
2. ✅ Appropriate IAM permissions for CloudWatch, SNS, and Budgets
3. ✅ Valid email address for notifications

### Step 1: Enable Billing Alerts (REQUIRED FIRST)

**⚠️ This step MUST be done manually in the AWS Console:**

1. Go to [AWS Billing Console](https://console.aws.amazon.com/billing/)
2. Click **"Billing preferences"** in the left navigation
3. Check **"Receive Billing Alerts"**
4. Click **"Save preferences"**
5. ⏰ Wait up to 24 hours for billing data to appear in CloudWatch

### Step 2: Create SNS Topic for Notifications

#### Console Method:
1. Go to [SNS Console](https://console.aws.amazon.com/sns/)
2. Click **"Create topic"**
3. Choose **"Standard"** type
4. Name: `AI-Recipe-Generator-Billing-Alerts`
5. Click **"Create topic"**
6. Click **"Create subscription"**
7. Protocol: **Email**
8. Endpoint: Your email address
9. Click **"Create subscription"**
10. ✉️ Check email and confirm subscription

#### CLI Method:
```bash
# Create SNS topic
aws sns create-topic --name AI-Recipe-Generator-Billing-Alerts --region us-east-1

# Subscribe email (replace with your email and topic ARN)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1
```

### Step 3: Create CloudWatch Billing Alarms

#### Main Cost Alert ($5 threshold):

**Console Method:**
1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
2. Click **"Alarms"** → **"Create alarm"**
3. Click **"Select metric"**
4. Choose **"Billing"** → **"Total Estimated Charge"**
5. Select **Currency: USD**
6. Click **"Select metric"**
7. Set **Threshold: $5.00**
8. Select your SNS topic
9. Name: `AI-Recipe-Generator-Total-Cost-Alert`
10. Click **"Create alarm"**

**CLI Method:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-Total-Cost-Alert" \
  --alarm-description "Alert when total AWS costs exceed $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 5.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1
```

#### Emergency Alert ($10 threshold):
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-Emergency-Alert" \
  --alarm-description "Emergency alert when costs exceed $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 10.0 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1
```

### Step 4: Create Service Usage Alarms

#### Lambda Usage Alert (800K invocations - 80% of free tier):
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-Lambda-Usage" \
  --alarm-description "Lambda invocations approaching free tier limit" \
  --metric-name Invocations \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 3600 \
  --threshold 800000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1
```

#### API Gateway Usage Alert (800K requests - 80% of free tier):
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-API-Gateway-Usage" \
  --alarm-description "API Gateway requests approaching free tier limit" \
  --metric-name Count \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 3600 \
  --threshold 800000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1
```

#### DynamoDB Read Capacity Alert (20 units - 80% of free tier):
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "AI-Recipe-Generator-DynamoDB-Read" \
  --alarm-description "DynamoDB read capacity approaching free tier limit" \
  --metric-name ConsumedReadCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 3600 \
  --threshold 20 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "arn:aws:sns:us-east-1:972803002725:AI-Recipe-Generator-Billing-Alerts" \
  --region us-east-1
```

### Step 5: Create AWS Budgets

#### Zero-Spend Budget:

**Console Method:**
1. Go to [AWS Budgets Console](https://console.aws.amazon.com/billing/home#/budgets)
2. Click **"Create budget"**
3. Select **"Cost budget"**
4. Budget name: `AI-Recipe-Generator-Zero-Spend`
5. Budget amount: `$0.01`
6. Set up email alerts at 100%
7. Click **"Create budget"**

**CLI Method:**
```bash
# Create budget JSON file
cat > zero-spend-budget.json << EOF
{
    "BudgetName": "AI-Recipe-Generator-Zero-Spend",
    "BudgetLimit": {
        "Amount": "0.01",
        "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostFilters": {}
}
EOF

# Create notification JSON file
cat > zero-spend-notification.json << EOF
[
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 100,
            "ThresholdType": "PERCENTAGE"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "your-email@example.com"
            }
        ]
    }
]
EOF

# Create the budget
aws budgets create-budget \
  --account-id 972803002725 \
  --budget file://zero-spend-budget.json \
  --notifications-with-subscribers file://zero-spend-notification.json
```

#### Monthly Budget ($5):
```bash
# Create monthly budget
cat > monthly-budget.json << EOF
{
    "BudgetName": "AI-Recipe-Generator-Monthly-Budget",
    "BudgetLimit": {
        "Amount": "5.00",
        "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST",
    "CostFilters": {}
}
EOF

aws budgets create-budget \
  --account-id 972803002725 \
  --budget file://monthly-budget.json \
  --notifications-with-subscribers file://zero-spend-notification.json
```

### Step 6: Create CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard \
  --dashboard-name "AI-Recipe-Generator-Monitoring" \
  --dashboard-body file://cloudwatch-dashboard.json \
  --region us-east-1
```

### Step 7: Set Up Free Tier Monitoring

#### Enable Cost Anomaly Detection:
1. Go to [Cost Anomaly Detection Console](https://console.aws.amazon.com/cost-management/home#/anomaly-detection)
2. Click **"Create monitor"**
3. Monitor type: **"AWS Services"**
4. Select services: Lambda, DynamoDB, API Gateway, Cognito, Amplify
5. Set minimum impact: **$1**
6. Add email notifications

## Free Tier Limits to Monitor

| Service | Free Tier Limit | Alert Threshold (80%) | Monthly Monitoring |
|---------|----------------|----------------------|-------------------|
| **Lambda** | 1M requests, 400K GB-seconds | 800K requests | ✅ |
| **DynamoDB** | 25 GB storage, 25 RCU/WCU | 20 RCU/WCU | ✅ |
| **Cognito** | 50K MAU | 40K MAU | Manual check |
| **API Gateway** | 1M requests | 800K requests | ✅ |
| **Amplify** | 1K build minutes, 15 GB served | 800 minutes, 12 GB | Manual check |
| **Bedrock** | No free tier | Any usage | ⚠️ Monitor closely |

## Daily Monitoring Tasks

### Check Current Usage:
```bash
# Check current month billing
aws cloudwatch get-metric-statistics \
  --namespace AWS/Billing \
  --metric-name EstimatedCharges \
  --dimensions Name=Currency,Value=USD \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Maximum \
  --region us-east-1

# Check Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum \
  --region us-east-1
```

### PowerShell Version (Windows):
```powershell
# Check current billing
aws cloudwatch get-metric-statistics `
  --namespace AWS/Billing `
  --metric-name EstimatedCharges `
  --dimensions Name=Currency,Value=USD `
  --start-time (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 86400 `
  --statistics Maximum `
  --region us-east-1
```

## Important URLs

- **Billing Console**: https://console.aws.amazon.com/billing/
- **CloudWatch Alarms**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:
- **Free Tier Usage**: https://console.aws.amazon.com/billing/home#/freetier
- **Cost Explorer**: https://console.aws.amazon.com/cost-management/home#/cost-explorer
- **Budgets**: https://console.aws.amazon.com/billing/home#/budgets
- **Dashboard**: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AI-Recipe-Generator-Monitoring

## Troubleshooting

### Common Issues:

1. **"No billing data available"**
   - Ensure billing alerts are enabled in console
   - Wait up to 24 hours for data to appear
   - Check that you're using us-east-1 region

2. **SNS subscription not confirmed**
   - Check spam folder for confirmation email
   - Resend confirmation from SNS console

3. **Alarms not triggering**
   - Verify SNS topic ARN is correct
   - Check alarm configuration in CloudWatch console
   - Ensure services are actually generating metrics

4. **Budget creation fails**
   - Verify account ID is correct (972803002725)
   - Check IAM permissions for budgets service
   - Ensure email format is valid

## Security Best Practices

1. **Least Privilege**: Only grant necessary permissions
2. **Regular Reviews**: Check billing weekly
3. **Multiple Alerts**: Set up redundant monitoring
4. **Emergency Procedures**: Have a plan for cost spikes
5. **Service Limits**: Consider setting service quotas

## Next Steps After Setup

1. ✅ Confirm SNS email subscription
2. ✅ Test alarms with small threshold temporarily
3. ✅ Set up weekly usage review schedule
4. ✅ Document emergency response procedures
5. ✅ Configure additional team member notifications

---

**⚠️ Critical Reminders:**
- Bedrock has NO free tier - every request costs money
- Monitor usage daily during development
- Set up multiple notification channels
- Have an emergency shutdown plan ready