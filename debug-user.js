const mongoose = require('mongoose');

// Connect to MongoDB
async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyht');
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    
    // Find the user (assuming you're the most recent user or have a specific email)
    const users = await User.find({}).sort({ createdAt: -1 }).limit(5);
    
    console.log('Recent users:');
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Stripe Customer ID:', user.stripeCustomerId);
      console.log('Active Subscription:', JSON.stringify(user.activeSubscription, null, 2));
      console.log('Last Paid At:', user.lastPaidAt);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUser();