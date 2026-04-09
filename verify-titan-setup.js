// Verify Titan setup is ready for deployment
console.log('🔍 Verifying Amazon Titan Setup...\n');

const fs = require('fs');
const path = require('path');

// Check if all required files exist and are updated
const checks = [
    {
        name: 'Bedrock Service Updated',
        file: 'ai-recipe-generator-backend/src/utils/bedrock-service.ts',
        check: (content) => content.includes('amazon.titan-text-express-v1'),
        status: false
    },
    {
        name: 'CloudFormation IAM Updated',
        file: 'ai-recipe-generator-backend/cloudformation/recipe-generation-stack.yaml',
        check: (content) => content.includes('amazon.titan-text-express-v1'),
        status: false
    },
    {
        name: 'Deployment Guide Created',
        file: 'TITAN_DEPLOYMENT_GUIDE.md',
        check: (content) => content.includes('Amazon Titan'),
        status: false
    },
    {
        name: 'JavaScript Version Ready',
        file: 'bedrock-service-titan.js',
        check: (content) => content.includes('amazon.titan-text-express-v1'),
        status: false
    }
];

console.log('📋 Checking Files...\n');

checks.forEach(check => {
    try {
        if (fs.existsSync(check.file)) {
            const content = fs.readFileSync(check.file, 'utf8');
            check.status = check.check(content);
            console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
            if (check.status) {
                console.log(`   📁 ${check.file}`);
            } else {
                console.log(`   ⚠️  File exists but content not updated`);
            }
        } else {
            console.log(`❌ ${check.name}`);
            console.log(`   ⚠️  File not found: ${check.file}`);
        }
    } catch (error) {
        console.log(`❌ ${check.name}`);
        console.log(`   ⚠️  Error reading file: ${error.message}`);
    }
});

const allPassed = checks.every(check => check.status);

console.log('\n📊 Setup Status:');
if (allPassed) {
    console.log('✅ All files are ready for Amazon Titan deployment!');
    console.log('\n🚀 Next Steps:');
    console.log('1. Follow the TITAN_DEPLOYMENT_GUIDE.md');
    console.log('2. Update Lambda function via AWS Console');
    console.log('3. Update CloudFormation stack');
    console.log('4. Test with: node test-titan-deployment.js');
    console.log('\n🎯 Expected Result:');
    console.log('• No more "use case details" errors');
    console.log('• Recipe generation working immediately');
    console.log('• Amazon Titan model responses');
} else {
    console.log('⚠️  Some files need attention');
    console.log('\n🔧 Manual Steps:');
    console.log('1. Copy content from bedrock-service-titan.js');
    console.log('2. Paste into Lambda console editor');
    console.log('3. Update IAM permissions for Titan model');
    console.log('4. Test the deployment');
}

console.log('\n📱 Web Application:');
console.log('http://ai-recipe-generator-web-app-914877613.s3-website-us-east-1.amazonaws.com');

console.log('\n🧪 Test Commands:');
console.log('node test-titan-deployment.js  # Test current status');
console.log('node test-complete-flow.js     # Test full authentication flow');

console.log('\n💡 Key Changes Made:');
console.log('• Switched from Claude 3 Haiku to Amazon Titan Text Express');
console.log('• Updated request format for Titan API');
console.log('• Updated response parsing for Titan responses');
console.log('• Added fallback recipe generation');
console.log('• Enhanced error handling');
console.log('• Added IAM permissions for Titan model');

console.log('\n🎉 Benefits:');
console.log('• No use case form required');
console.log('• Immediate availability');
console.log('• Cost-effective solution');
console.log('• Good text generation quality');