# AWS Billing Alerts Setup Script for Windows PowerShell
# AI Recipe Generator Project - Task 1.1.2

param(
    [Parameter(Mandatory=$true)]
    [string]$EmailAddress,
    
    [string]$Region = "us-east-1"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Header {
    Write-Host "================================================" -ForegroundColor $Blue
    Write-Host "  AWS Billing Monitoring Setup" -ForegroundColor $Blue
    Write-Host "  AI Recipe Generator Project" -ForegroundColor $Blue
    Write-Host "================================================" -ForegroundColor $Blue
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor $Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

function Test-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    try {
        $null = aws --version
        Write-Success "AWS CLI is installed"
    }
    catch {
        Write-Error "AWS CLI is not installed. Please install it first."
        Write-Host "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    }
    
    # Check if AWS CLI is configured
    try {
        $accountId = aws sts get-caller-identity --query Account --output text
        Write-Success "AWS CLI configured for account: $accountId"
        return $accountId
    }
    catch {
        Write-Error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    }
}

function New-SNSTopic {
    param([string]$Email)
    
    Write-Step "Creating SNS Topic for Notifications"
    
    $topicName = "AI-Recipe-Generator-Billing-Alerts"
    
    try {
        # Create SNS topic
        $topicArn = aws sns create-topic --name $topicName --region $Region --query TopicArn --output text
        
        if ($topicArn) {
            Write-Success "Created SNS topic: $topicName"
            Write-Host "Topic ARN: $topicArn"
            
            # Subscribe email to topic
            aws sns subscribe --topic-arn $topicArn --protocol email --notification-endpoint $Email --region $Region | Out-Null
            
            Write-Success "Subscribed $Email to notifications"
            Write-Warning "Please check your email and confirm the subscription!"
            
            return $topicArn
        }
        else {
            Write-Error "Failed to create SNS topic"
            exit 1
        }
    }
    catch {
        Write-Error "Error creating SNS topic: $_"
        exit 1
    }
}

function New-BillingAlarms {
    param([string]$TopicArn)
    
    Write-Step "Creating CloudWatch Billing Alarms"
    
    # Main billing alarm - $5 threshold
    try {
        aws cloudwatch put-metric-alarm `
            --alarm-name "AI-Recipe-Generator-Total-Cost-Alert" `
            --alarm-description "Alert when total AWS costs exceed `$5" `
            --metric-name EstimatedCharges `
            --namespace AWS/Billing `
            --statistic Maximum `
            --period 86400 `
            --threshold 5.0 `
            --comparison-operator GreaterThanThreshold `
            --dimensions Name=Currency,Value=USD `
            --evaluation-periods 1 `
            --alarm-actions $TopicArn `
            --region $Region
        
        Write-Success "Created main billing alarm (threshold: `$5)"
    }
    catch {
        Write-Error "Failed to create main billing alarm: $_"
    }
    
    # Emergency billing alarm - $10 threshold
    try {
        aws cloudwatch put-metric-alarm `
            --alarm-name "AI-Recipe-Generator-Emergency-Alert" `
            --alarm-description "Emergency alert when total AWS costs exceed `$10" `
            --metric-name EstimatedCharges `
            --namespace AWS/Billing `
            --statistic Maximum `
            --period 86400 `
            --threshold 10.0 `
            --comparison-operator GreaterThanThreshold `
            --dimensions Name=Currency,Value=USD `
            --evaluation-periods 1 `
            --alarm-actions $TopicArn `
            --region $Region
        
        Write-Success "Created emergency billing alarm (threshold: `$10)"
    }
    catch {
        Write-Error "Failed to create emergency billing alarm: $_"
    }
}

function New-ServiceAlarms {
    param([string]$TopicArn)
    
    Write-Step "Creating Service Usage Alarms"
    
    Write-Warning "Service alarms will be created but may not trigger until services are actively used"
    
    # Lambda invocations alarm (80% of 1M free tier)
    try {
        aws cloudwatch put-metric-alarm `
            --alarm-name "AI-Recipe-Generator-Lambda-Usage" `
            --alarm-description "Lambda invocations approaching free tier limit" `
            --metric-name Invocations `
            --namespace AWS/Lambda `
            --statistic Sum `
            --period 3600 `
            --threshold 800000 `
            --comparison-operator GreaterThanThreshold `
            --evaluation-periods 1 `
            --alarm-actions $TopicArn `
            --region $Region 2>$null
        
        Write-Success "Lambda usage alarm configured"
    }
    catch {
        Write-Warning "Lambda alarm creation skipped (service not active)"
    }
    
    # API Gateway requests alarm (80% of 1M free tier)
    try {
        aws cloudwatch put-metric-alarm `
            --alarm-name "AI-Recipe-Generator-API-Gateway-Usage" `
            --alarm-description "API Gateway requests approaching free tier limit" `
            --metric-name Count `
            --namespace AWS/ApiGateway `
            --statistic Sum `
            --period 3600 `
            --threshold 800000 `
            --comparison-operator GreaterThanThreshold `
            --evaluation-periods 1 `
            --alarm-actions $TopicArn `
            --region $Region 2>$null
        
        Write-Success "API Gateway usage alarm configured"
    }
    catch {
        Write-Warning "API Gateway alarm creation skipped (service not active)"
    }
}

function New-Budgets {
    param([string]$AccountId, [string]$Email)
    
    Write-Step "Creating AWS Budgets"
    
    # Zero-spend budget
    $zeroSpendBudget = @{
        BudgetName = "AI-Recipe-Generator-Zero-Spend"
        BudgetLimit = @{
            Amount = "0.01"
            Unit = "USD"
        }
        TimeUnit = "MONTHLY"
        BudgetType = "COST"
        CostFilters = @{}
    } | ConvertTo-Json -Depth 3
    
    $zeroSpendNotification = @(
        @{
            Notification = @{
                NotificationType = "ACTUAL"
                ComparisonOperator = "GREATER_THAN"
                Threshold = 100
                ThresholdType = "PERCENTAGE"
            }
            Subscribers = @(
                @{
                    SubscriptionType = "EMAIL"
                    Address = $Email
                }
            )
        }
    ) | ConvertTo-Json -Depth 4
    
    # Save to temporary files
    $zeroSpendBudget | Out-File -FilePath "zero-spend-budget.json" -Encoding UTF8
    $zeroSpendNotification | Out-File -FilePath "zero-spend-notification.json" -Encoding UTF8
    
    try {
        aws budgets create-budget --account-id $AccountId --budget file://zero-spend-budget.json --notifications-with-subscribers file://zero-spend-notification.json
        Write-Success "Created zero-spend budget"
    }
    catch {
        Write-Error "Failed to create zero-spend budget: $_"
    }
    
    # Monthly budget
    $monthlyBudget = @{
        BudgetName = "AI-Recipe-Generator-Monthly-Budget"
        BudgetLimit = @{
            Amount = "5.00"
            Unit = "USD"
        }
        TimeUnit = "MONTHLY"
        BudgetType = "COST"
        CostFilters = @{}
    } | ConvertTo-Json -Depth 3
    
    $monthlyBudget | Out-File -FilePath "monthly-budget.json" -Encoding UTF8
    
    try {
        aws budgets create-budget --account-id $AccountId --budget file://monthly-budget.json --notifications-with-subscribers file://zero-spend-notification.json
        Write-Success "Created monthly budget (`$5)"
    }
    catch {
        Write-Error "Failed to create monthly budget: $_"
    }
    
    # Clean up temporary files
    Remove-Item -Path "zero-spend-budget.json", "zero-spend-notification.json", "monthly-budget.json" -ErrorAction SilentlyContinue
}

function New-Dashboard {
    Write-Step "Creating CloudWatch Dashboard"
    
    if (Test-Path "cloudwatch-dashboard.json") {
        try {
            aws cloudwatch put-dashboard --dashboard-name "AI-Recipe-Generator-Monitoring" --dashboard-body file://cloudwatch-dashboard.json --region $Region
            Write-Success "Created CloudWatch dashboard"
            Write-Host "Dashboard URL: https://$Region.console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=AI-Recipe-Generator-Monitoring"
        }
        catch {
            Write-Error "Failed to create dashboard: $_"
        }
    }
    else {
        Write-Warning "Dashboard configuration file not found"
    }
}

function New-MonitoringScripts {
    Write-Step "Creating Monitoring Scripts"
    
    # Create daily usage check script
    $dailyScript = @'
# Daily AWS Usage Check Script
Write-Host "=== Daily AWS Usage Report ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date)" -ForegroundColor Cyan
Write-Host ""

# Check current month billing
Write-Host "💰 Current Month Estimated Charges:" -ForegroundColor Yellow
try {
    $yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
    $today = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    
    $billing = aws cloudwatch get-metric-statistics `
        --namespace AWS/Billing `
        --metric-name EstimatedCharges `
        --dimensions Name=Currency,Value=USD `
        --start-time $yesterday `
        --end-time $today `
        --period 86400 `
        --statistics Maximum `
        --region us-east-1 `
        --query 'Datapoints[0].Maximum' `
        --output text 2>$null
    
    if ($billing -and $billing -ne "None") {
        Write-Host "`$$billing" -ForegroundColor Green
    } else {
        Write-Host "No billing data available yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error retrieving billing data" -ForegroundColor Red
}

Write-Host ""

# Check Lambda invocations
Write-Host "🔧 Lambda Invocations (last 24h):" -ForegroundColor Yellow
try {
    $lambda = aws cloudwatch get-metric-statistics `
        --namespace AWS/Lambda `
        --metric-name Invocations `
        --start-time $yesterday `
        --end-time $today `
        --period 86400 `
        --statistics Sum `
        --query 'Datapoints[0].Sum' `
        --output text 2>$null
    
    if ($lambda -and $lambda -ne "None") {
        Write-Host "$lambda invocations" -ForegroundColor Green
    } else {
        Write-Host "No Lambda data available yet" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error retrieving Lambda data" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== End Report ===" -ForegroundColor Cyan
'@
    
    $dailyScript | Out-File -FilePath "daily-usage-check.ps1" -Encoding UTF8
    Write-Success "Created daily usage check script (daily-usage-check.ps1)"
    
    # Create free tier checker
    $freeTierScript = @'
# AWS Free Tier Usage Check Script
Write-Host "=== AWS Free Tier Usage Check ===" -ForegroundColor Cyan
Write-Host "Note: This script provides estimates. Check AWS Console for official usage." -ForegroundColor Yellow
Write-Host ""

$startTime = (Get-Date).AddMonths(-1).ToString("yyyy-MM-ddTHH:mm:ss")
$endTime = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")

# Lambda usage
try {
    $lambdaInvocations = aws cloudwatch get-metric-statistics `
        --namespace AWS/Lambda `
        --metric-name Invocations `
        --start-time $startTime `
        --end-time $endTime `
        --period 2592000 `
        --statistics Sum `
        --query 'Datapoints[0].Sum' `
        --output text 2>$null
    
    if ($lambdaInvocations -and $lambdaInvocations -ne "None") {
        $lambdaPercentage = [math]::Round(($lambdaInvocations / 1000000) * 100, 2)
        Write-Host "🔧 Lambda Invocations: $lambdaInvocations / 1,000,000 ($lambdaPercentage%)" -ForegroundColor Green
    } else {
        Write-Host "🔧 Lambda Invocations: 0 / 1,000,000 (0%)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "🔧 Lambda Invocations: Error retrieving data" -ForegroundColor Red
}

# API Gateway usage
try {
    $apiRequests = aws cloudwatch get-metric-statistics `
        --namespace AWS/ApiGateway `
        --metric-name Count `
        --start-time $startTime `
        --end-time $endTime `
        --period 2592000 `
        --statistics Sum `
        --query 'Datapoints[0].Sum' `
        --output text 2>$null
    
    if ($apiRequests -and $apiRequests -ne "None") {
        $apiPercentage = [math]::Round(($apiRequests / 1000000) * 100, 2)
        Write-Host "🌐 API Gateway Requests: $apiRequests / 1,000,000 ($apiPercentage%)" -ForegroundColor Green
    } else {
        Write-Host "🌐 API Gateway Requests: 0 / 1,000,000 (0%)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "🌐 API Gateway Requests: Error retrieving data" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Tip: Visit AWS Free Tier Console for official usage data" -ForegroundColor Cyan
Write-Host "📊 Dashboard: https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=AI-Recipe-Generator-Monitoring" -ForegroundColor Cyan
'@
    
    $freeTierScript | Out-File -FilePath "check-free-tier.ps1" -Encoding UTF8
    Write-Success "Created free tier usage checker (check-free-tier.ps1)"
}

function Show-NextSteps {
    param([string]$Email)
    
    Write-Host ""
    Write-Step "🎉 Setup Complete! Next Steps:"
    Write-Host ""
    Write-Host "1. 📧 Check your email ($Email) and confirm SNS subscription" -ForegroundColor White
    Write-Host "2. 📊 Visit CloudWatch dashboard to monitor usage" -ForegroundColor White
    Write-Host "3. 🔍 Run '.\daily-usage-check.ps1' for daily usage reports" -ForegroundColor White
    Write-Host "4. 📈 Run '.\check-free-tier.ps1' to check free tier usage" -ForegroundColor White
    Write-Host "5. 💰 Visit AWS Billing Console to review budgets" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Important URLs:" -ForegroundColor Cyan
    Write-Host "• Billing Console: https://console.aws.amazon.com/billing/" -ForegroundColor White
    Write-Host "• CloudWatch Alarms: https://console.aws.amazon.com/cloudwatch/home?region=$Region#alarmsV2:" -ForegroundColor White
    Write-Host "• Free Tier Usage: https://console.aws.amazon.com/billing/home#/freetier" -ForegroundColor White
    Write-Host ""
    Write-Warning "Remember: Bedrock has no free tier - monitor usage carefully!"
}

# Main execution
try {
    Write-Header
    
    # Validate email format
    if ($EmailAddress -notmatch "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$") {
        Write-Error "Invalid email format: $EmailAddress"
        exit 1
    }
    
    Write-Success "Email set to: $EmailAddress"
    Write-Host ""
    
    $accountId = Test-Prerequisites
    Write-Host ""
    
    Write-Warning "IMPORTANT: You must first enable billing alerts in the AWS Console!"
    Write-Host "1. Go to: https://console.aws.amazon.com/billing/" -ForegroundColor White
    Write-Host "2. Click 'Billing preferences'" -ForegroundColor White
    Write-Host "3. Check 'Receive Billing Alerts'" -ForegroundColor White
    Write-Host "4. Click 'Save preferences'" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Have you completed this step? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Warning "Please complete the billing alerts enablement first, then run this script again."
        exit 0
    }
    
    Write-Host ""
    $topicArn = New-SNSTopic -Email $EmailAddress
    Write-Host ""
    
    New-BillingAlarms -TopicArn $topicArn
    Write-Host ""
    
    New-ServiceAlarms -TopicArn $topicArn
    Write-Host ""
    
    New-Budgets -AccountId $accountId -Email $EmailAddress
    Write-Host ""
    
    New-Dashboard
    Write-Host ""
    
    New-MonitoringScripts
    
    Show-NextSteps -Email $EmailAddress
    
    Write-Success "Billing monitoring setup completed successfully!"
}
catch {
    Write-Error "Setup failed: $_"
    exit 1
}