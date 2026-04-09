# PowerShell script to test Amazon Bedrock access for AI Recipe Generator
# This script verifies Bedrock service access and Claude 3 Sonnet model availability

param(
    [string]$Profile = "ai-recipe-generator-dev",
    [string]$Region = "us-east-1",
    [string]$ModelId = "anthropic.claude-3-sonnet-20240229-v1:0"
)

Write-Host "🤖 Testing Amazon Bedrock Access for AI Recipe Generator" -ForegroundColor Cyan
Write-Host "Profile: $Profile" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Target Model: $ModelId" -ForegroundColor Yellow
Write-Host ""

# Function to test AWS service access
function Test-BedrockService {
    param([string]$TestName, [string]$Command, [string]$Description)
    
    Write-Host "Testing $TestName..." -ForegroundColor Yellow
    
    try {
        $result = Invoke-Expression "aws $Command --profile $Profile --region $Region --output json 2>&1"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description - SUCCESS" -ForegroundColor Green
            return @{
                Test = $TestName
                Status = "SUCCESS"
                Details = $result
            }
        } else {
            Write-Host "❌ $Description - FAILED" -ForegroundColor Red
            Write-Host "   Error: $result" -ForegroundColor Red
            return @{
                Test = $TestName
                Status = "FAILED"
                Details = $result
            }
        }
    } catch {
        Write-Host "❌ $Description - ERROR" -ForegroundColor Red
        Write-Host "   Exception: $_" -ForegroundColor Red
        return @{
            Test = $TestName
            Status = "ERROR"
            Details = $_.Exception.Message
        }
    }
}

# Test results array
$testResults = @()

# Test 1: Basic Bedrock service access
$testResults += Test-BedrockService -TestName "Bedrock Service" -Command "bedrock list-foundation-models" -Description "List foundation models"

# Test 2: Check for Claude models
Write-Host "Checking for Claude models..." -ForegroundColor Yellow
try {
    $models = aws bedrock list-foundation-models --profile $Profile --region $Region --output json 2>$null | ConvertFrom-Json
    $claudeModels = $models.modelSummaries | Where-Object { $_.modelId -like "*claude*" }
    
    if ($claudeModels) {
        Write-Host "✅ Claude models found:" -ForegroundColor Green
        foreach ($model in $claudeModels) {
            $status = if ($model.modelId -eq $ModelId) { "🎯 TARGET MODEL" } else { "📋 Available" }
            Write-Host "   - $($model.modelId) ($($model.modelName)) - $status" -ForegroundColor White
        }
        
        $testResults += @{
            Test = "Claude Models"
            Status = "SUCCESS"
            Details = "Found $($claudeModels.Count) Claude models"
        }
    } else {
        Write-Host "⚠️  No Claude models found - may need to request access" -ForegroundColor Yellow
        $testResults += @{
            Test = "Claude Models"
            Status = "WARNING"
            Details = "No Claude models available"
        }
    }
} catch {
    Write-Host "❌ Error checking Claude models: $_" -ForegroundColor Red
    $testResults += @{
        Test = "Claude Models"
        Status = "ERROR"
        Details = $_.Exception.Message
    }
}

# Test 3: Check specific Claude 3 Sonnet model
Write-Host "Checking Claude 3 Sonnet model access..." -ForegroundColor Yellow
try {
    $sonnetModel = aws bedrock list-foundation-models --profile $Profile --region $Region --output json 2>$null | ConvertFrom-Json | 
                   Select-Object -ExpandProperty modelSummaries | 
                   Where-Object { $_.modelId -eq $ModelId }
    
    if ($sonnetModel) {
        Write-Host "✅ Claude 3 Sonnet model is available!" -ForegroundColor Green
        Write-Host "   Model ID: $($sonnetModel.modelId)" -ForegroundColor White
        Write-Host "   Model Name: $($sonnetModel.modelName)" -ForegroundColor White
        Write-Host "   Provider: $($sonnetModel.providerName)" -ForegroundColor White
        Write-Host "   Input Modalities: $($sonnetModel.inputModalities -join ', ')" -ForegroundColor White
        Write-Host "   Output Modalities: $($sonnetModel.outputModalities -join ', ')" -ForegroundColor White
        
        $testResults += @{
            Test = "Claude 3 Sonnet"
            Status = "SUCCESS"
            Details = "Model available and accessible"
        }
    } else {
        Write-Host "❌ Claude 3 Sonnet model not found" -ForegroundColor Red
        Write-Host "   You may need to request access to this model" -ForegroundColor Yellow
        
        $testResults += @{
            Test = "Claude 3 Sonnet"
            Status = "FAILED"
            Details = "Model not available - access may need to be requested"
        }
    }
} catch {
    Write-Host "❌ Error checking Claude 3 Sonnet: $_" -ForegroundColor Red
    $testResults += @{
        Test = "Claude 3 Sonnet"
        Status = "ERROR"
        Details = $_.Exception.Message
    }
}

# Test 4: Test model invocation (if model is available)
$sonnetAvailable = ($testResults | Where-Object { $_.Test -eq "Claude 3 Sonnet" -and $_.Status -eq "SUCCESS" }) -ne $null

if ($sonnetAvailable) {
    Write-Host "Testing model invocation..." -ForegroundColor Yellow
    
    # Create test request
    $testRequest = @{
        anthropic_version = "bedrock-2023-05-31"
        max_tokens = 100
        messages = @(
            @{
                role = "user"
                content = "Generate a very simple recipe using chicken and rice in 2-3 sentences."
            }
        )
    } | ConvertTo-Json -Depth 3
    
    $testRequest | Out-File -FilePath "temp-test-request.json" -Encoding UTF8
    
    try {
        $invokeResult = aws bedrock-runtime invoke-model --model-id $ModelId --body file://temp-test-request.json --profile $Profile --region $Region temp-response.json 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Model invocation successful!" -ForegroundColor Green
            
            # Read and display response
            $response = Get-Content "temp-response.json" | ConvertFrom-Json
            Write-Host "   Sample Response:" -ForegroundColor Cyan
            Write-Host "   $($response.content[0].text)" -ForegroundColor White
            
            $testResults += @{
                Test = "Model Invocation"
                Status = "SUCCESS"
                Details = "Successfully invoked Claude 3 Sonnet model"
            }
        } else {
            Write-Host "❌ Model invocation failed: $invokeResult" -ForegroundColor Red
            $testResults += @{
                Test = "Model Invocation"
                Status = "FAILED"
                Details = $invokeResult
            }
        }
    } catch {
        Write-Host "❌ Error during model invocation: $_" -ForegroundColor Red
        $testResults += @{
            Test = "Model Invocation"
            Status = "ERROR"
            Details = $_.Exception.Message
        }
    } finally {
        # Clean up temporary files
        Remove-Item -Path "temp-test-request.json", "temp-response.json" -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "⏭️  Skipping model invocation test (model not available)" -ForegroundColor Yellow
    $testResults += @{
        Test = "Model Invocation"
        Status = "SKIPPED"
        Details = "Claude 3 Sonnet model not available"
    }
}

# Summary
Write-Host ""
Write-Host "=== TEST SUMMARY ===" -ForegroundColor Cyan

$successCount = ($testResults | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failedCount = ($testResults | Where-Object { $_.Status -eq "FAILED" }).Count
$errorCount = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$warningCount = ($testResults | Where-Object { $_.Status -eq "WARNING" }).Count
$skippedCount = ($testResults | Where-Object { $_.Status -eq "SKIPPED" }).Count

Write-Host "✅ Successful: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failedCount" -ForegroundColor Red
Write-Host "⚠️  Warnings: $warningCount" -ForegroundColor Yellow
Write-Host "❗ Errors: $errorCount" -ForegroundColor Red
Write-Host "⏭️  Skipped: $skippedCount" -ForegroundColor Gray

# Detailed results
Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor Cyan
foreach ($result in $testResults) {
    $color = switch ($result.Status) {
        "SUCCESS" { "Green" }
        "FAILED" { "Red" }
        "ERROR" { "Red" }
        "WARNING" { "Yellow" }
        "SKIPPED" { "Gray" }
    }
    
    Write-Host "[$($result.Status)] $($result.Test)" -ForegroundColor $color
    if ($result.Status -ne "SUCCESS") {
        Write-Host "   $($result.Details)" -ForegroundColor Gray
    }
}

# Recommendations
Write-Host ""
Write-Host "=== RECOMMENDATIONS ===" -ForegroundColor Cyan

if ($successCount -eq ($testResults.Count - $skippedCount)) {
    Write-Host "🎉 All tests passed! Bedrock is ready for AI Recipe Generator." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Proceed to task 1.2.2: Set up Amazon Cognito user pool" -ForegroundColor White
    Write-Host "2. Begin developing recipe generation Lambda function" -ForegroundColor White
    Write-Host "3. Implement prompt engineering for recipe generation" -ForegroundColor White
} else {
    Write-Host "⚠️  Some issues detected. Please address the following:" -ForegroundColor Yellow
    
    if ($failedCount -gt 0 -or $errorCount -gt 0) {
        Write-Host ""
        Write-Host "Required Actions:" -ForegroundColor Red
        
        $claudeTest = $testResults | Where-Object { $_.Test -eq "Claude 3 Sonnet" }
        if ($claudeTest.Status -ne "SUCCESS") {
            Write-Host "• Request access to Claude 3 Sonnet model:" -ForegroundColor White
            Write-Host "  1. Go to AWS Console → Bedrock → Model access" -ForegroundColor Gray
            Write-Host "  2. Click 'Request model access'" -ForegroundColor Gray
            Write-Host "  3. Select 'Claude 3 Sonnet' and submit request" -ForegroundColor Gray
            Write-Host "  4. Wait for approval (can take up to 24 hours)" -ForegroundColor Gray
        }
        
        $serviceTest = $testResults | Where-Object { $_.Test -eq "Bedrock Service" }
        if ($serviceTest.Status -ne "SUCCESS") {
            Write-Host "• Check IAM permissions for Bedrock service" -ForegroundColor White
            Write-Host "• Verify AWS CLI configuration and credentials" -ForegroundColor White
        }
    }
}

# Cost monitoring reminder
Write-Host ""
Write-Host "💰 Cost Monitoring Reminder:" -ForegroundColor Yellow
Write-Host "• Bedrock has no free tier - monitor usage carefully" -ForegroundColor White
Write-Host "• Estimated cost per recipe: $0.01-0.03" -ForegroundColor White
Write-Host "• Set up usage alerts in CloudWatch" -ForegroundColor White
Write-Host "• Review billing dashboard regularly" -ForegroundColor White

# Save results
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "bedrock-test-report_$timestamp.json"

$report = @{
    Timestamp = Get-Date
    Profile = $Profile
    Region = $Region
    ModelId = $ModelId
    TestResults = $testResults
    Summary = @{
        Successful = $successCount
        Failed = $failedCount
        Errors = $errorCount
        Warnings = $warningCount
        Skipped = $skippedCount
    }
}

$report | ConvertTo-Json -Depth 4 | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host ""
Write-Host "Test report saved to: $reportFile" -ForegroundColor Green