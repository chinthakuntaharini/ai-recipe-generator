# AWS Billing Alerts Setup Guide for AI Recipe Generator

## Overview

This guide provides step-by-step instructions for setting up comprehensive billing alerts to monitor AWS free tier usage for the AI Recipe Generator project. The system will use multiple AWS services, and proper monitoring is essential to stay within free tier limits.

## AWS Services to Monitor

Based on the requirements, the following services need monitoring:

- **Lambda**: 1M free requests/month, 400,000 GB-seconds compute time
- **DynamoDB**: 25 GB storage, 25 read/write capacity units
- **Cognito**: 50,000 monthly active users
- **API Gateway**: 1M API calls/month
- **Amplify**: 1,000 build minutes, 15 GB served/month
- **Bedrock**: Pay-per-use (no free tier)
- **CloudWatch**: 10 custom metrics, 5 GB log ingestion
- **CloudFormation**: 1,000 handler operations/month

## Step 1: Enable Billing Alerts

### 1.1 Access Billing Dashboard
1. Sign in to AWS Management Console
2. Click on your account name (top right)
3. Select "Billing and Cost Management"
4. In the left navigation, click "Billing preferences"

### 1.2 Enable Billing Alerts
1. Check "Receive Billing Alerts"
2. Click "Save preferences"
3. Note: It may take up to 24 hours for billing data to appear in CloudWatch

## Step 2: Create CloudWatch Billing Alarms

### 2.1 Overall Account Spending Alert
1. Go to CloudWatch console
2. Click "Alarms" → "Create alarm"
3. Click "Select metric"
4. Choose "Billing" → "Total Estimated Charge"
5. Select "Currency: USD"
6. Click "Select metric"
7. Set threshold: $5 (safety buffer before any charges)
8. Create SNS topic for notifications
9. Name the alarm: "Total-Account-Spending-Alert"

### 2.2 Service-Specific Alerts

#### Lambda Usage Alert
1. Create alarm for Lambda invocations
2. Metric: AWS/Lambda → Invocations
3. Threshold: 800,000 (80% of 1M free tier limit)
4. Name: "Lambda-Invocations-Alert"

#### DynamoDB Usage Alert
1. Create alarm for DynamoDB consumed read capacity
2. Metric: AWS/DynamoDB → ConsumedReadCapacityUnits
3. Threshold: 20 (80% of 25 free tier limit)
4. Name: "DynamoDB-Read-Capacity-Alert"

#### API Gateway Usage Alert
1. Create alarm for API Gateway requests
2. Metric: AWS/ApiGateway → Count
3. Threshold: 800,000 (80% of 1M free tier limit)
4. Name: "API-Gateway-Requests-Alert"

## Step 3: Set Up AWS Budgets

### 3.1 Create Zero-Spend Budget
1. Go to AWS Budgets console
2. Click "Create budget"
3. Select "Cost budget"
4. Budget name: "AI-Recipe-Generator-Zero-Spend"
5. Budget amount: $0.01
6. Set up email alerts at 80% and 100%

### 3.2 Create Service-Specific Budgets
1. Create separate budgets for each service
2. Set small amounts ($1-2) as early warning system
3. Configure alerts at 50%, 80%, and 100%

## Step 4: Configure Cost Anomaly Detection

### 4.1 Enable Cost Anomaly Detection
1. Go to Cost Anomaly Detection console
2. Click "Create monitor"
3. Monitor type: "AWS Services"
4. Select specific services used in the project
5. Set up email notifications

### 4.2 Configure Detection Settings
1. Set minimum impact threshold: $1
2. Enable notifications for all anomalies
3. Add multiple email recipients

## Step 5: Set Up Free Tier Usage Alerts

### 5.1 Access Free Tier Dashboard
1. Go to Billing console
2. Click "Free Tier" in left navigation
3. Review current usage for all services

### 5.2 Configure Free Tier Alerts
1. Enable alerts for each service at 80% usage
2. Set up email notifications
3. Monitor daily usage patterns

## Step 6: Create Custom Monitoring Dashboard

### 6.1 CloudWatch Dashboard Setup
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations"],
          ["AWS/DynamoDB", "ConsumedReadCapacityUnits"],
          ["AWS/ApiGateway", "Count"],
          ["AWS/Billing", "EstimatedCharges", "Currency", "USD"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "AI Recipe Generator - Service Usage"
      }
    }
  ]
}
```

### 6.2 Dashboard Configuration
1. Create new CloudWatch dashboard
2. Name: "AI-Recipe-Generator-Monitoring"
3. Add widgets for each service metric
4. Include cost tracking widgets

## Step 7: Automated Monitoring Scripts

### 7.1 Daily Usage Check Script
```bash
#!/bin/bash
# daily-usage-check.sh

# Check Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum

# Check API Gateway requests
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum

# Check current month billing
aws cloudwatch get-metric-statistics \
  --namespace AWS/Billing \
  --metric-name EstimatedCharges \
  --dimensions Name=Currency,Value=USD \
  --start-time $(date -d '1 month ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Maximum
```

### 7.2 Weekly Usage Report
```python
import boto3
import json
from datetime import datetime, timedelta

def generate_usage_report():
    cloudwatch = boto3.client('cloudwatch')
    
    # Get metrics for the past week
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)
    
    services = {
        'Lambda': {'namespace': 'AWS/Lambda', 'metric': 'Invocations'},
        'DynamoDB': {'namespace': 'AWS/DynamoDB', 'metric': 'ConsumedReadCapacityUnits'},
        'API Gateway': {'namespace': 'AWS/ApiGateway', 'metric': 'Count'}
    }
    
    report = {}
    
    for service, config in services.items():
        response = cloudwatch.get_metric_statistics(
            Namespace=config['namespace'],
            MetricName=config['metric'],
            StartTime=start_time,
            EndTime=end_time,
            Period=604800,  # 1 week
            Statistics=['Sum']
        )
        
        if response['Datapoints']:
            report[service] = response['Datapoints'][0]['Sum']
        else:
            report[service] = 0
    
    return report

if __name__ == "__main__":
    report = generate_usage_report()
    print(json.dumps(report, indent=2))
```

## Step 8: Emergency Response Procedures

### 8.1 Cost Spike Response
1. Immediately check CloudWatch metrics
2. Identify the service causing the spike
3. Review recent deployments or configuration changes
4. Implement temporary service limits if necessary
5. Contact AWS support if needed

### 8.2 Free Tier Limit Approach
1. Monitor daily usage trends
2. Implement usage optimization strategies
3. Consider service alternatives within free tier
4. Plan for potential service suspension

## Step 9: Optimization Strategies

### 9.1 Lambda Optimization
- Optimize function memory allocation
- Reduce cold start times
- Implement efficient error handling
- Use provisioned concurrency sparingly

### 9.2 DynamoDB Optimization
- Design efficient partition keys
- Use on-demand billing for unpredictable workloads
- Implement proper indexing strategies
- Monitor read/write capacity usage

### 9.3 API Gateway Optimization
- Implement caching where appropriate
- Use request validation to reduce Lambda invocations
- Monitor and optimize request patterns

## Step 10: Regular Monitoring Tasks

### 10.1 Daily Tasks
- [ ] Check CloudWatch dashboard
- [ ] Review any triggered alarms
- [ ] Monitor free tier usage percentages
- [ ] Check for any cost anomalies

### 10.2 Weekly Tasks
- [ ] Generate usage report
- [ ] Review trends and patterns
- [ ] Optimize resource usage if needed
- [ ] Update budgets if necessary

### 10.3 Monthly Tasks
- [ ] Comprehensive cost analysis
- [ ] Review and adjust alert thresholds
- [ ] Plan for next month's usage
- [ ] Document lessons learned

## Conclusion

This comprehensive monitoring setup ensures that the AI Recipe Generator project stays within AWS free tier limits while providing early warnings for any potential cost overruns. Regular monitoring and optimization are key to maintaining cost-effective operations.

## Important Notes

1. **Bedrock Costs**: Amazon Bedrock has no free tier, so monitor usage carefully
2. **Data Transfer**: Monitor data transfer costs, especially for Amplify hosting
3. **CloudWatch Logs**: Be mindful of log retention and storage costs
4. **Regional Considerations**: Some free tier benefits are region-specific

## Emergency Contacts

- AWS Support: Available through AWS Console
- Billing Support: Available 24/7 for billing inquiries
- Technical Support: Based on your support plan level