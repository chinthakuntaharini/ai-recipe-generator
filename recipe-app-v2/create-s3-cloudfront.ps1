# Create S3 Bucket and CloudFront Distribution for Recipe App
# Run this first, then build and upload separately

param(
    [string]$BucketName = "recipe-app-frontend-$(Get-Random -Minimum 1000 -Maximum 9999)",
    [string]$Region = "us-east-1"
)

Write-Host "=== Creating S3 + CloudFront Infrastructure ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create S3 bucket
Write-Host "Step 1: Creating S3 bucket: $BucketName..." -ForegroundColor Yellow
aws s3 mb s3://$BucketName --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Bucket might already exist, continuing..." -ForegroundColor Yellow
}

# Step 2: Configure bucket policy for public read
Write-Host "Step 2: Configuring bucket policy..." -ForegroundColor Yellow
$bucketPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BucketName/*"
    }
  ]
}
"@

$bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding ASCII -NoNewline
aws s3api put-bucket-policy --bucket $BucketName --policy file://bucket-policy.json
Remove-Item "bucket-policy.json"

# Step 3: Enable static website hosting
Write-Host "Step 3: Enabling static website hosting..." -ForegroundColor Yellow
aws s3 website s3://$BucketName --index-document index.html --error-document index.html

# Step 4: Disable block public access
Write-Host "Step 4: Configuring public access..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Step 5: Create CloudFront distribution
Write-Host "Step 5: Creating CloudFront distribution..." -ForegroundColor Yellow

$websiteEndpoint = "$BucketName.s3-website-$Region.amazonaws.com"

$distributionConfig = @"
{
  "CallerReference": "recipe-app-$(Get-Date -Format 'yyyyMMddHHmmss')",
  "Comment": "Recipe App Frontend",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-Website-$BucketName",
        "DomainName": "$websiteEndpoint",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultRootObject": "index.html",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-Website-$BucketName",
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
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
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

$distributionConfig | Out-File -FilePath "cloudfront-config.json" -Encoding ASCII -NoNewline

$distribution = aws cloudfront create-distribution --distribution-config file://cloudfront-config.json | ConvertFrom-Json
Remove-Item "cloudfront-config.json"

if ($LASTEXITCODE -eq 0) {
    $distributionId = $distribution.Distribution.Id
    $domainName = $distribution.Distribution.DomainName
    
    Write-Host ""
    Write-Host "=== Infrastructure Created Successfully! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "S3 Bucket: $BucketName" -ForegroundColor Cyan
    Write-Host "S3 Website URL: http://$websiteEndpoint" -ForegroundColor Cyan
    Write-Host "CloudFront Distribution ID: $distributionId" -ForegroundColor Cyan
    Write-Host "CloudFront URL: https://$domainName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Build your app: npm run build" -ForegroundColor White
    Write-Host "2. Upload to S3: aws s3 sync ./out s3://$BucketName --delete" -ForegroundColor White
    Write-Host "3. Invalidate CloudFront: aws cloudfront create-invalidation --distribution-id $distributionId --paths '/*'" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: CloudFront distribution takes 10-15 minutes to deploy globally." -ForegroundColor Yellow
    Write-Host ""
    
    # Save deployment info
    @"
Recipe App Deployment Information
==================================
Created: $(Get-Date)

S3 Bucket: $BucketName
Region: $Region
S3 Website URL: http://$websiteEndpoint
CloudFront Distribution ID: $distributionId
CloudFront URL: https://$domainName

Quick Commands:
---------------
# Build the app
npm run build

# Upload to S3
aws s3 sync ./out s3://$BucketName --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"

# Check CloudFront status
aws cloudfront get-distribution --id $distributionId --query "Distribution.Status"
"@ | Out-File -FilePath "deployment-info.txt"
    
    Write-Host "Deployment info saved to deployment-info.txt" -ForegroundColor Green
} else {
    Write-Host "Failed to create CloudFront distribution" -ForegroundColor Red
    exit 1
}
