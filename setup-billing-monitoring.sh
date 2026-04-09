#!/bin/bash

# AWS Billing Monitoring Setup Script for AI Recipe Generator
# This script provides both automated setup and manual instructions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EMAIL=""
ACCOUNT_ID=""
REGION="us-east-1"  # Billing metrics are only available in us-east-1

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  AWS Billing Monitoring Setup${NC}"
    echo -e "${BLUE}  AI Recipe Generator Project${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo
}

print_step() {
    echo -e "${YELLOW}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_success "AWS CLI configured for account: $ACCOUNT_ID"
    
    # Check if Python is available for the setup script
    if ! command -v python3 &> /dev/null; then
        print_warning "Python3 not found. Manual setup will be required."
    else
        print_success "Python3 available for automated setup"
    fi
}

get_email() {
    if [ -z "$EMAIL" ]; then
        echo -n "Enter your email address for billing alerts: "
        read EMAIL
        
        if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            print_error "Invalid email format"
            exit 1
        fi
    fi
    
    print_success "Email set to: $EMAIL"
}

enable_billing_alerts() {
    print_step "Step 1: Enable Billing Alerts"
    echo
    echo "🔧 Manual steps required in AWS Console:"
    echo "1. Go to AWS Billing Console: https://console.aws.amazon.com/billing/"
    echo "2. Click 'Billing preferences' in the left navigation"
    echo "3. Check 'Receive Billing Alerts'"
    echo "4. Click 'Save preferences'"
    echo
    print_warning "This step must be done manually in the AWS Console"
    echo -n "Press Enter when you have completed this step..."
    read
}

create_sns_topic() {
    print_step "Step 2: Creating SNS Topic for Notifications"
    
    local topic_name="AI-Recipe-Generator-Billing-Alerts"
    
    # Create SNS topic
    local topic_arn=$(aws sns create-topic \
        --name "$topic_name" \
        --region "$REGION" \
        --query TopicArn \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$topic_arn" ]; then
        print_success "Created SNS topic: $topic_name"
        echo "Topic ARN: $topic_arn"
        
        # Subscribe email to topic
        aws sns subscribe \
            --topic-arn "$topic_arn" \
            --protocol email \
            --notification-endpoint "$EMAIL" \
            --region "$REGION" > /dev/null
        
        print_success "Subscribed $EMAIL to notifications"
        print_warning "Please check your email and confirm the subscription!"
        
        echo "$topic_arn" > .sns-topic-arn
    else
        print_error "Failed to create SNS topic"
        exit 1
    fi
}

create_billing_alarms() {
    print_step "Step 3: Creating CloudWatch Billing Alarms"
    
    local topic_arn=$(cat .sns-topic-arn 2>/dev/null || echo "")
    if [ -z "$topic_arn" ]; then
        print_error "SNS topic ARN not found"
        exit 1
    fi
    
    # Main billing alarm - $5 threshold
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
        --alarm-actions "$topic_arn" \
        --region "$REGION"
    
    print_success "Created main billing alarm (threshold: \$5)"
    
    # Emergency billing alarm - $10 threshold
    aws cloudwatch put-metric-alarm \
        --alarm-name "AI-Recipe-Generator-Emergency-Alert" \
        --alarm-description "Emergency alert when total AWS costs exceed $10" \
        --metric-name EstimatedCharges \
        --namespace AWS/Billing \
        --statistic Maximum \
        --period 86400 \
        --threshold 10.0 \
        --comparison-operator GreaterThanThreshold \
        --dimensions Name=Currency,Value=USD \
        --evaluation-periods 1 \
        --alarm-actions "$topic_arn" \
        --region "$REGION"
    
    print_success "Created emergency billing alarm (threshold: \$10)"
}

create_service_alarms() {
    print_step "Step 4: Creating Service Usage Alarms"
    
    local topic_arn=$(cat .sns-topic-arn 2>/dev/null || echo "")
    
    print_warning "Service alarms will be created but may not trigger until services are actively used"
    
    # Lambda invocations alarm (80% of 1M free tier)
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
        --alarm-actions "$topic_arn" \
        --region "$REGION" 2>/dev/null || print_warning "Lambda alarm creation skipped (service not active)"
    
    print_success "Lambda usage alarm configured"
    
    # API Gateway requests alarm (80% of 1M free tier)
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
        --alarm-actions "$topic_arn" \
        --region "$REGION" 2>/dev/null || print_warning "API Gateway alarm creation skipped (service not active)"
    
    print_success "API Gateway usage alarm configured"
}

create_budgets() {
    print_step "Step 5: Creating AWS Budgets"
    
    # Zero-spend budget
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
                "Address": "$EMAIL"
            }
        ]
    }
]
EOF

    aws budgets create-budget \
        --account-id "$ACCOUNT_ID" \
        --budget file://zero-spend-budget.json \
        --notifications-with-subscribers file://zero-spend-notification.json
    
    print_success "Created zero-spend budget"
    
    # Monthly budget
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

    cat > monthly-notification.json << EOF
[
    {
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 80,
            "ThresholdType": "PERCENTAGE"
        },
        "Subscribers": [
            {
                "SubscriptionType": "EMAIL",
                "Address": "$EMAIL"
            }
        ]
    }
]
EOF

    aws budgets create-budget \
        --account-id "$ACCOUNT_ID" \
        --budget file://monthly-budget.json \
        --notifications-with-subscribers file://monthly-notification.json
    
    print_success "Created monthly budget (\$5)"
    
    # Clean up temporary files
    rm -f zero-spend-budget.json zero-spend-notification.json
    rm -f monthly-budget.json monthly-notification.json
}

create_dashboard() {
    print_step "Step 6: Creating CloudWatch Dashboard"
    
    if [ -f "cloudwatch-dashboard.json" ]; then
        aws cloudwatch put-dashboard \
            --dashboard-name "AI-Recipe-Generator-Monitoring" \
            --dashboard-body file://cloudwatch-dashboard.json \
            --region "$REGION"
        
        print_success "Created CloudWatch dashboard"
        echo "Dashboard URL: https://$REGION.console.aws.amazon.com/cloudwatch/home?region=$REGION#dashboards:name=AI-Recipe-Generator-Monitoring"
    else
        print_warning "Dashboard configuration file not found"
    fi
}

setup_monitoring_scripts() {
    print_step "Step 7: Setting up Monitoring Scripts"
    
    # Create daily usage check script
    cat > daily-usage-check.sh << 'EOF'
#!/bin/bash

echo "=== Daily AWS Usage Report ==="
echo "Date: $(date)"
echo

# Check current month billing
echo "💰 Current Month Estimated Charges:"
aws cloudwatch get-metric-statistics \
    --namespace AWS/Billing \
    --metric-name EstimatedCharges \
    --dimensions Name=Currency,Value=USD \
    --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Maximum \
    --region us-east-1 \
    --query 'Datapoints[0].Maximum' \
    --output text 2>/dev/null || echo "No billing data available yet"

echo

# Check Lambda invocations (if any)
echo "🔧 Lambda Invocations (last 24h):"
aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "No Lambda data available yet"

echo

# Check API Gateway requests (if any)
echo "🌐 API Gateway Requests (last 24h):"
aws cloudwatch get-metric-statistics \
    --namespace AWS/ApiGateway \
    --metric-name Count \
    --start-time $(date -d '1 day ago' -u +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "No API Gateway data available yet"

echo
echo "=== End Report ==="
EOF

    chmod +x daily-usage-check.sh
    print_success "Created daily usage check script"
    
    # Create free tier usage checker
    cat > check-free-tier.sh << 'EOF'
#!/bin/bash

echo "=== AWS Free Tier Usage Check ==="
echo "Note: This script provides estimates. Check AWS Console for official usage."
echo

# Function to get metric value
get_metric() {
    local namespace=$1
    local metric=$2
    local dimensions=$3
    
    aws cloudwatch get-metric-statistics \
        --namespace "$namespace" \
        --metric-name "$metric" \
        --start-time $(date -d '1 month ago' -u +%Y-%m-%dT%H:%M:%S) \
        --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
        --period 2592000 \
        --statistics Sum \
        $dimensions \
        --query 'Datapoints[0].Sum' \
        --output text 2>/dev/null || echo "0"
}

# Lambda usage
lambda_invocations=$(get_metric "AWS/Lambda" "Invocations" "")
lambda_percentage=$(echo "scale=2; $lambda_invocations / 1000000 * 100" | bc -l 2>/dev/null || echo "0")
echo "🔧 Lambda Invocations: $lambda_invocations / 1,000,000 (${lambda_percentage}%)"

# API Gateway usage
api_requests=$(get_metric "AWS/ApiGateway" "Count" "")
api_percentage=$(echo "scale=2; $api_requests / 1000000 * 100" | bc -l 2>/dev/null || echo "0")
echo "🌐 API Gateway Requests: $api_requests / 1,000,000 (${api_percentage}%)"

echo
echo "💡 Tip: Run 'aws billing get-free-tier-usage' for official free tier usage data"
echo "📊 Dashboard: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AI-Recipe-Generator-Monitoring"
EOF

    chmod +x check-free-tier.sh
    print_success "Created free tier usage checker"
}

print_next_steps() {
    echo
    print_step "🎉 Setup Complete! Next Steps:"
    echo
    echo "1. 📧 Check your email ($EMAIL) and confirm SNS subscription"
    echo "2. 📊 Visit CloudWatch dashboard to monitor usage"
    echo "3. 🔍 Run './daily-usage-check.sh' for daily usage reports"
    echo "4. 📈 Run './check-free-tier.sh' to check free tier usage"
    echo "5. 💰 Visit AWS Billing Console to review budgets"
    echo
    echo "📋 Important URLs:"
    echo "• Billing Console: https://console.aws.amazon.com/billing/"
    echo "• CloudWatch Alarms: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
    echo "• Free Tier Usage: https://console.aws.amazon.com/billing/home#/freetier"
    echo
    print_warning "Remember: Bedrock has no free tier - monitor usage carefully!"
}

cleanup() {
    rm -f .sns-topic-arn
}

main() {
    print_header
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--email EMAIL_ADDRESS]"
                echo "Sets up comprehensive billing monitoring for AI Recipe Generator"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    check_prerequisites
    get_email
    enable_billing_alerts
    create_sns_topic
    create_billing_alarms
    create_service_alarms
    create_budgets
    create_dashboard
    setup_monitoring_scripts
    print_next_steps
    cleanup
    
    print_success "Billing monitoring setup completed successfully!"
}

# Run main function
main "$@"