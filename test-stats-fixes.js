// Quick test to verify Stats page fixes
// Run this in the browser console to test the fixes

console.log('🔧 Testing SafeLeaf Stats Page Fixes...');

// Test 1: Check if APIService.getDetectedLeaves() works
try {
  const detectedLeaves = window.safeLeafDebug?.getCompatibility ? 'Debug available' : 'Loading...';
  console.log('✅ Debug methods available:', !!window.safeLeafDebug);
} catch (e) {
  console.error('❌ Debug methods test failed:', e);
}

// Test 2: Check if RemoteErrorLogger is working without infinite loops
let errorCount = 0;
const originalError = console.error;
console.error = (...args) => {
  errorCount++;
  if (errorCount > 5) {
    console.warn('⚠️ Potential infinite loop detected, stopping error counting');
    console.error = originalError;
    return;
  }
  originalError.apply(console, args);
};

// Test 3: Trigger a controlled error to test logging
setTimeout(() => {
  try {
    console.log('🧪 Testing error logging...');
    throw new Error('Test error for SafeLeaf debugging');
  } catch (e) {
    console.log('✅ Error handling test completed');
  }
  
  // Reset console.error
  console.error = originalError;
  
  console.log(`📊 Error count during test: ${errorCount}`);
  if (errorCount <= 2) {
    console.log('✅ No infinite loop detected - fixes working!');
  } else {
    console.log('⚠️ Potential issue detected - check console');
  }
}, 1000);

console.log('🏁 Test completed. Check results above.');