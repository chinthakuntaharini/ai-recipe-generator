# PowerShell script to verify IAM user permissions for AI Recipe Generator
# Run this script after creating the IAM user to test access to required services

param(
    [string]$Profile = "ai-recipe-generator-dev",
    [string]$Region = "us-east-1"
)

Write-Host "Verifying IAM permissions for AI Recipe Generator development..." -ForegroundColor Green
Write-Host "Profile: $Profile" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

$testResults = @()

function Test-AWSService {
    param(
        [string]$ServiceName,
        [string]$TestCommand,
        [string]$Description
    )
    
    Write-Host "Testing $ServiceName..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Expression "aws $TestCommand --profile $Profile --region $Region --output json 2>&1"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $Description - SUCCESS" -ForegroundColor Green
            return @{
                Service = $ServiceName
                Test = $Description
                Status = "SUCCESS"
                Details = "Access verified"
            }
        } else {
            Write-Host "✗ $Description - FAILED" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
            return @{
                Service = $ServiceName
                Test = $Description
                Status = "FAILED"
                Details = $result
            }
        }
    } catch {
        Write-Host "✗ $Description - ERROR" -ForegroundColor Red
        Write-Host "  Exception: $_" -ForegroundColor Red
        return @{
            Service = $ServiceName
            Test = $Description
            Status = "ERROR"
            Details = $_.Exception.Message
        }
    }
}

# Test 1: Basic Identity
$testResults += Test-AWSService -ServiceName "STS" -TestCommand "sts get-caller-identity" -Description "Get caller identity"

# Test 2: Bedrock Access
$testResults += Test-AWSService -ServiceName "Bedrock" -TestCommand "bedrock list-foundation-models" -Description "List Bedrock foundation models"

# Test 3: Cognito Access
$testResults += Test-AWSService -ServiceName "Cognito" -TestCommand "cognito-idp list-user-pools --max-results 10" -Description "List Cognito user pools"

# Test 4: DynamoDB Access
$testResults += Test-AWSService -ServiceName "DynamoDB" -TestCommand "dynamodb list-tables" -Description "List DynamoDB tables"

# Test 5: Lambda Access
$testResults += Test-AWSService -ServiceName "Lambda" -TestCommand "lambda list-functions --max-items 10" -Description "List Lambda functions"

# Test 6: API Gateway Access
$testResults += Test-AWSService -ServiceName "API Gateway" -TestCommand "apigateway get-rest-apis" -Description "List REST APIs"

# Test 7: Amplify Access
$testResults += Test-AWSService -ServiceName "Amplify" -TestCommand "amplify list-apps --max-results 10" -Description "List Amplify apps"

# Test 8: CloudWatch Logs Access
$testResults += Test-AWSService -ServiceName "CloudWatch Logs" -TestCommand "logs describe-log-groups --limit 10" -Description "List CloudWatch log groups"

# Test 9: CloudFormation Access
$testResults += Test-AWSService -ServiceName "CloudFormation" -TestCommand "cloudformation list-stacks --max-items 10" -Description "List CloudFormation stacks"

# Test 10: IAM Access (limited)
$testResults += Test-AWSService -ServiceName "IAM" -TestCommand "iam list-roles --max-items 10" -Description "List IAM roles"

# Test 11: S3 Access
$testResults += Test-AWSService -ServiceName "S3" -TestCommand "s3api list-buckets" -Description "List S3 buckets"

Write-Host ""
Write-Host "=== VERIFICATION SUMMARY ===" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failedCount = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$errorCount = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$totalTests = $testResults.Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Failed: $failedCount" -ForegroundColor Red
Write-Host "Errors: $errorCount" -ForegroundColor Yellow

Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor Cyan

foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "SUCCESS" { "Green" }
        "FAILED" { "Red" }
        "ERROR" { "Yellow" }
    }
    
    Write-Host "[$($result.Status)] $($result.Service) - $($result.Test)" -ForegroundColor $color
    
    if ($result.Status -ne "SUCCESS") {
        Write-Host "  Details: $($result.Details)" -ForegroundColor Gray
    }
}

# Generate recommendations
Write-Host ""
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan

if ($failedCount -eq 0 -and $errorCount -eq 0) {
    Write-Host "✓ All permissions verified successfully!" -ForegroundColor Green
    Write-Host "You can proceed with AI Recipe Generator development." -ForegroundColor Green
} else {
    Write-Host "⚠ Some tests failed. Please review the following:" -ForegroundColor Yellow
    
    if ($failedCount -gt 0) {
        Write-Host "- Check IAM policy permissions for failed services" -ForegroundColor White
        Write-Host "- Verify resource ARNs in the policy match your account" -ForegroundColor White
    }
    
    if ($errorCount -gt 0) {
        Write-Host "- Verify AWS CLI configuration and credentials" -ForegroundColor White
        Write-Host "- Check network connectivity to AWS services" -ForegroundColor White
    }
}

# Service-specific recommendations
Write-Host ""
Write-Host "Service-Specific Notes:" -ForegroundColor Cyan

$bedrockTest = $testResults | Where-Object { $_.Service -eq "Bedrock" }
if ($bedrockTest.Status -ne "SUCCESS") {
    Write-Host "• Bedrock: You may need to request access to Claude 3 Sonnet model" -ForegroundColor Yellow
    Write-Host "  Visit AWS Console → Bedrock → Model access to request access" -ForegroundColor Gray
}

$amplifyTest = $testResults | Where-Object { $_.Service -eq "Amplify" }
if ($amplifyTest.Status -eq "SUCCESS") {
    Write-Host "• Amplify: Access verified - ready for frontend deployment" -ForegroundColor Green
}

$dynamoTest = $testResults | Where-Object { $_.Service -eq "DynamoDB" }
if ($dynamoTest.Status -eq "SUCCESS") {
    Write-Host "• DynamoDB: Access verified - ready for recipe storage setup" -ForegroundColor Green
}

# Save results to file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "iam-verification-report_$timestamp.json"

$report = @{
    Timestamp = Get-Date
    Profile = $Profile
    Region = $Region
    Summary = @{
        TotalTests = $totalTests
        Successful = $successCount
        Failed = $failedCount
        Errors = $errorCount
    }
    Results = $testResults
}

$report | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host ""
Write-Host "Verification report saved to: $reportFile" -ForegroundColor Green

# Exit with appropriate code
if ($failedCount -eq 0 -and $errorCount -eq 0) {
    Write-Host ""
    Write-Host "IAM permissions verification completed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host ""
    Write-Host "IAM permissions verification completed with issues. Please review the report." -ForegroundColor Yellow
    exit 1
}