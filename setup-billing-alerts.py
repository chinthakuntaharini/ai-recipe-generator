#!/usr/bin/env python3
"""
AWS Billing Alerts Setup Script for AI Recipe Generator
This script automates the creation of billing alerts and budgets for monitoring free tier usage.
"""

import boto3
import json
import sys
from botocore.exceptions import ClientError

class BillingAlertsSetup:
    def __init__(self, email_address, region='us-east-1'):
        """
        Initialize the billing alerts setup
        
        Args:
            email_address (str): Email address for notifications
            region (str): AWS region (billing metrics are only in us-east-1)
        """
        self.email = email_address
        self.region = region
        
        # Initialize AWS clients
        self.cloudwatch = boto3.client('cloudwatch', region_name=region)
        self.sns = boto3.client('sns', region_name=region)
        self.budgets = boto3.client('budgets', region_name=region)
        
        # Get account ID
        sts = boto3.client('sts')
        self.account_id = sts.get_caller_identity()['Account']
        
    def create_sns_topic(self, topic_name):
        """Create SNS topic for billing alerts"""
        try:
            response = self.sns.create_topic(Name=topic_name)
            topic_arn = response['TopicArn']
            
            # Subscribe email to topic
            self.sns.subscribe(
                TopicArn=topic_arn,
                Protocol='email',
                Endpoint=self.email
            )
            
            print(f"✓ Created SNS topic: {topic_name}")
            print(f"  Topic ARN: {topic_arn}")
            print(f"  ⚠️  Please check your email and confirm the subscription!")
            
            return topic_arn
            
        except ClientError as e:
            print(f"✗ Error creating SNS topic: {e}")
            return None
    
    def create_billing_alarm(self, alarm_name, threshold, topic_arn, comparison='GreaterThanThreshold'):
        """Create CloudWatch billing alarm"""
        try:
            self.cloudwatch.put_metric_alarm(
                AlarmName=alarm_name,
                ComparisonOperator=comparison,
                EvaluationPeriods=1,
                MetricName='EstimatedCharges',
                Namespace='AWS/Billing',
                Period=86400,  # 24 hours
                Statistic='Maximum',
                Threshold=threshold,
                ActionsEnabled=True,
                AlarmActions=[topic_arn],
                AlarmDescription=f'Billing alarm for {alarm_name}',
                Dimensions=[
                    {
                        'Name': 'Currency',
                        'Value': 'USD'
                    }
                ]
            )
            
            print(f"✓ Created billing alarm: {alarm_name} (threshold: ${threshold})")
            
        except ClientError as e:
            print(f"✗ Error creating billing alarm {alarm_name}: {e}")
    
    def create_service_alarm(self, service_name, namespace, metric_name, threshold, topic_arn):
        """Create service-specific usage alarm"""
        try:
            alarm_name = f"AI-Recipe-Generator-{service_name}-Usage"
            
            self.cloudwatch.put_metric_alarm(
                AlarmName=alarm_name,
                ComparisonOperator='GreaterThanThreshold',
                EvaluationPeriods=1,
                MetricName=metric_name,
                Namespace=namespace,
                Period=3600,  # 1 hour
                Statistic='Sum',
                Threshold=threshold,
                ActionsEnabled=True,
                AlarmActions=[topic_arn],
                AlarmDescription=f'Usage alarm for {service_name} in AI Recipe Generator'
            )
            
            print(f"✓ Created service alarm: {alarm_name} (threshold: {threshold})")
            
        except ClientError as e:
            print(f"✗ Error creating service alarm {alarm_name}: {e}")
    
    def create_budget(self, budget_name, amount, time_unit='MONTHLY'):
        """Create AWS Budget"""
        try:
            budget = {
                'BudgetName': budget_name,
                'BudgetLimit': {
                    'Amount': str(amount),
                    'Unit': 'USD'
                },
                'TimeUnit': time_unit,
                'BudgetType': 'COST',
                'CostFilters': {}
            }
            
            # Create notification for 80% threshold
            notification = {
                'NotificationType': 'ACTUAL',
                'ComparisonOperator': 'GREATER_THAN',
                'Threshold': 80,
                'ThresholdType': 'PERCENTAGE',
                'NotificationState': 'ALARM'
            }
            
            subscriber = {
                'SubscriptionType': 'EMAIL',
                'Address': self.email
            }
            
            self.budgets.create_budget(
                AccountId=self.account_id,
                Budget=budget,
                NotificationsWithSubscribers=[
                    {
                        'Notification': notification,
                        'Subscribers': [subscriber]
                    }
                ]
            )
            
            print(f"✓ Created budget: {budget_name} (${amount})")
            
        except ClientError as e:
            print(f"✗ Error creating budget {budget_name}: {e}")
    
    def setup_all_alerts(self):
        """Set up all billing alerts and budgets"""
        print("🚀 Setting up AWS billing alerts for AI Recipe Generator...")
        print(f"📧 Email notifications will be sent to: {self.email}")
        print()
        
        # Create SNS topic
        topic_arn = self.create_sns_topic("AI-Recipe-Generator-Billing-Alerts")
        if not topic_arn:
            print("❌ Failed to create SNS topic. Exiting.")
            return False
        
        print()
        
        # Create main billing alarms
        print("📊 Creating billing alarms...")
        self.create_billing_alarm("AI-Recipe-Generator-Total-Cost-Alert", 5.0, topic_arn)
        self.create_billing_alarm("AI-Recipe-Generator-Emergency-Alert", 10.0, topic_arn)
        
        print()
        
        # Create service-specific alarms
        print("🔧 Creating service usage alarms...")
        
        # Note: These alarms will only work once the services are actually being used
        service_alarms = [
            ("Lambda", "AWS/Lambda", "Invocations", 800000),  # 80% of 1M free tier
            ("API-Gateway", "AWS/ApiGateway", "Count", 800000),  # 80% of 1M free tier
            ("DynamoDB-Read", "AWS/DynamoDB", "ConsumedReadCapacityUnits", 20),  # 80% of 25 units
            ("DynamoDB-Write", "AWS/DynamoDB", "ConsumedWriteCapacityUnits", 20),  # 80% of 25 units
        ]
        
        for service, namespace, metric, threshold in service_alarms:
            self.create_service_alarm(service, namespace, metric, threshold, topic_arn)
        
        print()
        
        # Create budgets
        print("💰 Creating budgets...")
        self.create_budget("AI-Recipe-Generator-Zero-Spend", 0.01)
        self.create_budget("AI-Recipe-Generator-Monthly-Budget", 5.0)
        self.create_budget("AI-Recipe-Generator-Bedrock-Budget", 2.0)  # Bedrock has no free tier
        
        print()
        print("✅ Billing alerts setup completed!")
        print()
        print("📋 Next steps:")
        print("1. Check your email and confirm SNS subscription")
        print("2. Monitor the CloudWatch dashboard regularly")
        print("3. Review AWS Free Tier usage dashboard weekly")
        print("4. Set up the monitoring scripts for automated checks")
        
        return True

def main():
    """Main function"""
    if len(sys.argv) != 2:
        print("Usage: python setup-billing-alerts.py <email-address>")
        print("Example: python setup-billing-alerts.py your-email@example.com")
        sys.exit(1)
    
    email = sys.argv[1]
    
    # Validate email format (basic check)
    if '@' not in email or '.' not in email:
        print("❌ Please provide a valid email address")
        sys.exit(1)
    
    try:
        # Initialize and run setup
        setup = BillingAlertsSetup(email)
        success = setup.setup_all_alerts()
        
        if success:
            print("\n🎉 Setup completed successfully!")
        else:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()