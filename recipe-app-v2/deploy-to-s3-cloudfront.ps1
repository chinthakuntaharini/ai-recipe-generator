# Deploy Next.js Static Export to S3 + CloudFront
# This script builds and deploys the recipe app to AWS S3 with CloudFront CDN

param(
    [string]$BucketName = "recipe-app-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)",
    [string]$Region = "us-east-1"
)

Write-Host "=== Recipe App Deployment to S3 + CloudFront ===" -ForegroundColor Cyan
Write-Host ""

# Step 0: Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Step 0: Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Build the Next.js app
Write-Host "Step 1: Building Next.js static export..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Create S3 bucket
Write-Host "Step 2: Creating S3 bucket: $BucketName..." -ForegroundColor Yellow
aws s3 mb s3://$BucketName --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create bucket. It might already exist." -ForegroundColor Yellow
}

# Configure bucket for static website hosting
Write-Host "Configuring bucket for static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$BucketName --index-document index.html --error-document 404.html

# Step 3: Upload files to S3
Write-Host "Step 3: Uploading files to S3..." -ForegroundColor Yellow
aws s3 sync ./out s3://$BucketName --delete --cache-control "public,max-age=31536000,immutable" --exclude "*.html"
aws s3 sync ./out s3://$BucketName --delete --cache-control "public,max-age=0,must-revalidate" --include "*.html" --exclude "*"
Write-Host "Files uploaded successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Create CloudFront distribution
Write-Host "Step 4: Creating CloudFront distribution..." -ForegroundColor Yellow

# Create distribution config
$distributionConfig = @"
{
  "CallerReference": "recipe-app-$(Get-Date -Format 'yyyyMMddHHmmss')",
  "Comment": "Recipe App Frontend Distribution",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BucketName",
        "DomainName": "$BucketName.s3.$Region.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BucketName",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
"@

$distributionConfig | Out-File -FilePath "cloudfront-config.json" -Encoding UTF8

Write-Host "Creating CloudFront distribution (this may take a few minutes)..." -ForegroundColor Yellow
$distribution = aws cloudfront create-distribution --distribution-config file://cloudfront-config.json | ConvertFrom-Json

if ($LASTEXITCODE -eq 0) {
    $distributionId = $distribution.Distribution.Id
    $domainName = $distribution.Distribution.DomainName
    
    Write-Host ""
    Write-Host "=== Deployment Successful! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "S3 Bucket: $BucketName" -ForegroundColor Cyan
    Write-Host "CloudFront Distribution ID: $distributionId" -ForegroundColor Cyan
    Write-Host "CloudFront URL: https://$domainName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Note: CloudFront distribution is being deployed. It may take 10-15 minutes to be fully available." -ForegroundColor Yellow
    Write-Host ""
    
    # Save deployment info
    @"
Deployment Information
=====================
Date: $(Get-Date)
S3 Bucket: $BucketName
Region: $Region
CloudFront Distribution ID: $distributionId
CloudFront URL: https://$domainName

To update the deployment:
1. Make changes to your code
2. Run: npm run build
3. Run: aws s3 sync ./out s3://$BucketName --delete
4. Run: aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
"@ | Out-File -FilePath "deployment-info.txt"
    
    Write-Host "Deployment information saved to deployment-info.txt" -ForegroundColor Green
} else {
    Write-Host "Failed to create CloudFront distribution" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item "cloudfront-config.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
