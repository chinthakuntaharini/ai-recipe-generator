# AWS Setup Verification Script for AI Recipe Generator
# Verifies AWS CLI configuration and service access

param(
    [Parameter(Mandatory=$false)]
    [string]$ProfileName = "ai-recipe-generator",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🔍 AWS Setup Verification for AI Recipe Generator" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Function to test service access
function Test-AWSService {
    param($ServiceName, $Command, $ProfileName)
    
    try {
        $result = Invoke-Expression "$Command --profile $ProfileName 2>$null"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $ServiceName" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $ServiceName - Access denied or service unavailable" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $ServiceName - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check AWS CLI installation
try {
    $awsVersion = aws --version 2>$null
    Write-Host "✅ AWS CLI installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not installed" -ForegroundColor Red
    exit 1
}

# Check current identity
Write-Host ""
Write-Host "🔐 Current AWS Identity:" -ForegroundColor Cyan
try {
    $identity = aws sts get-caller-identity --profile $ProfileName --output json 2>$null | ConvertFrom-Json
    
    Write-Host "Account ID: $($identity.Account)" -ForegroundColor $(if ($identity.Account -eq "972803002725") {"Green"} else {"Yellow"})
    Write-Host "User ARN: $($identity.Arn)" -ForegroundColor White
    Write-Host "User ID: $($identity.UserId)" -ForegroundColor White
    
    if ($identity.Account -ne "972803002725") {
        Write-Host "⚠️  Warning: Not configured for target account (972803002725)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Cannot retrieve AWS identity. Check credentials." -ForegroundColor Red
    exit 1
}

# Check region configuration
Write-Host ""
Write-Host "🌍 Region Configuration:" -ForegroundColor Cyan
try {
    $configuredRegion = aws configure get region --profile $ProfileName 2>$null
    Write-Host "Configured region: $configuredRegion" -ForegroundColor $(if ($configuredRegion -eq $Region) {"Green"} else {"Yellow"})
    
    if ($configuredRegion -ne $Region) {
        Write-Host "⚠️  Recommended region for Bedrock: $Region" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Cannot retrieve region configuration" -ForegroundColor Red
}

# Test service access
Write-Host ""
Write-Host "🧪 Service Access Tests:" -ForegroundColor Cyan

$serviceTests = @(
    @{
        Name = "Amazon Bedrock"
        Command = "aws bedrock list-foundation-models --region $Region --output json"
        Critical = $true
    },
    @{
        Name = "Amazon Cognito"
        Command = "aws cognito-idp list-user-pools --max-results 1 --region $Region --output json"
        Critical = $true
    },
    @{
        Name = "Amazon DynamoDB"
        Command = "aws dynamodb list-tables --region $Region --output json"
        Critical = $true
    },
    @{
        Name = "AWS API Gateway"
        Command = "aws apigateway get-rest-apis --region $Region --output json"
        Critical = $true
    },
    @{
        Name = "AWS Lambda"
        Command = "aws lambda list-functions --region $Region --output json"
        Critical = $true
    },
    @{
        Name = "AWS Amplify"
        Command = "aws amplify list-apps --region $Region --output json"
        Critical = $false
    },
    @{
        Name = "Amazon CloudWatch"
        Command = "aws logs describe-log-groups --region $Region --limit 1 --output json"
        Critical = $false
    }
)

$passedTests = 0
$criticalTests = 0

foreach ($test in $serviceTests) {
    $result = Test-AWSService -ServiceName $test.Name -Command $test.Command -ProfileName $ProfileName
    if ($result) { $passedTests++ }
    if ($test.Critical) { $criticalTests++ }
}

# Check Bedrock model access specifically
Write-Host ""
Write-Host "🤖 Bedrock Model Access:" -ForegroundColor Cyan
try {
    $models = aws bedrock list-foundation-models --region $Region --profile $ProfileName --output json 2>$null | ConvertFrom-Json
    $claudeModels = $models.modelSummaries | Where-Object { $_.modelId -like "*claude*" }
    
    if ($claudeModels) {
        Write-Host "✅ Claude models available:" -ForegroundColor Green
        foreach ($model in $claudeModels) {
            Write-Host "   - $($model.modelId)" -ForegroundColor White
        }
        
        # Check specifically for Claude 3 Sonnet
        $claude3Sonnet = $claudeModels | Where-Object { $_.modelId -like "*claude-3-sonnet*" }
        if ($claude3Sonnet) {
            Write-Host "✅ Claude 3 Sonnet model available" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Claude 3 Sonnet model not found - may need to request access" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  No Claude models found - may need to request model access" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Cannot check Bedrock models" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "📊 Verification Summary:" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Services tested: $($serviceTests.Count)" -ForegroundColor White
Write-Host "Services accessible: $passedTests" -ForegroundColor $(if ($passedTests -eq $serviceTests.Count) {"Green"} else {"Yellow"})
Write-Host "Critical services: $criticalTests" -ForegroundColor White

if ($passedTests -eq $serviceTests.Count) {
    Write-Host ""
    Write-Host "🎉 All services accessible! AWS CLI is properly configured." -ForegroundColor Green
} elseif ($passedTests -ge $criticalTests) {
    Write-Host ""
    Write-Host "✅ Critical services accessible. Some optional services may need attention." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Some critical services are not accessible. Check IAM permissions." -ForegroundColor Red
}

# Next steps
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. If Bedrock access failed: Request model access in AWS Console"
Write-Host "2. If other services failed: Check IAM user permissions"
Write-Host "3. Continue with Task 1.2.1: Enable Amazon Bedrock service"
Write-Host "4. Set up Cognito user pool (Task 1.2.2)"
Write-Host ""
Write-Host "💡 Tip: Use --profile $ProfileName with all AWS CLI commands" -ForegroundColor Yellow