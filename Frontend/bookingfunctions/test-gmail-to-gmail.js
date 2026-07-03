// Save this as test-gmail-to-gmail.js in functions folder
const nodemailer = require('nodemailer');

async function testGmailDelivery() {
  console.log('🔍 Gmail-to-Gmail Diagnostic Test\\n');
  
  // Your Gmail credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'cabworkpune@gmail.com',
      pass: 'jprbiffnzihctmbw'
    }
  });

  // Test different recipient types
  const testCases = [
    { 
      email: 'shraddhasj0602@gmail.com', 
      name: 'Shraddha Personal (Gmail)',
      expected: 'Currently FAILING'
    },
    { 
      email: 'shraddhasj622005@gmail.com', 
      name: 'Shraddha Alternate (Gmail)',
      expected: 'Currently WORKING'
    },
    { 
      email: 'test@gmail.com', 
      name: 'Random Gmail',
      expected: 'Unknown'
    }
  ];

  console.log('Testing emails from: cabworkpune@gmail.com');
  console.log('===============================================\\n');

  for (const test of testCases) {
    console.log(`📧 Test: ${test.name}`);
    console.log(`   Email: ${test.email}`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const timestamp = Date.now();
      const result = await transporter.sendMail({
        from: 'cabworkpune@gmail.com',
        to: test.email,
        subject: `Gmail Test ${timestamp}`,
        text: `This is a test email sent at ${new Date(timestamp).toLocaleTimeString()}`,
        
        // Add headers similar to your invoice emails
        headers: {
          'X-Test-Type': 'diagnostic',
          'X-Timestamp': timestamp.toString()
        }
      });

      console.log(`   ✅ RESULT: ACCEPTED by Gmail`);
      console.log(`   📨 Message ID: ${result.messageId}`);
      console.log(`   ⏰ Time: ${new Date().toLocaleTimeString()}`);
      
      // Check if email will actually deliver
      console.log(`   📝 Action: Check ${test.email} inbox NOW`);
      console.log(`            • Check main inbox`);
      console.log(`            • Check spam folder`);
      console.log(`            • Wait 30 seconds`);
      
    } catch (error) {
      console.log(`   ❌ RESULT: REJECTED by Gmail`);
      console.log(`   💥 Error: ${error.message}`);
      console.log(`   🔧 Code: ${error.code}`);
      
      if (error.response) {
        console.log(`   📨 Response: ${error.response.substring(0, 100)}...`);
      }
    }
    
    console.log('\\n--- Waiting 5 seconds ---\\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('✅ Test completed!');
  console.log('\\n🎯 ANALYSIS:');
  console.log('If emails show "ACCEPTED" but not received:');
  console.log('• Gmail is silently discarding them');
  console.log('• This is Gmail-to-Gmail filtering');
  console.log('\\n🚀 SOLUTION: Use different domain (Zoho/Resend)');
}

// Run the test
testGmailDelivery().catch(console.error);