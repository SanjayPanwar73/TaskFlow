const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const [nameArg, emailArg, passwordArg] = process.argv.slice(2);

const name = nameArg || process.env.ADMIN_NAME;
const email = emailArg || process.env.ADMIN_EMAIL;
const password = passwordArg || process.env.ADMIN_PASSWORD;

const run = async () => {
  if (!name || !email || !password) {
    console.error(
      'Usage: npm run create-admin -- "Admin Name" admin@example.com StrongPassword123'
    );
    process.exit(1);
  }

  await connectDB();

  const existingUser = await User.findOne({ email }).select('+password');

  if (existingUser) {
    existingUser.name = name;
    existingUser.role = 'Admin';
    existingUser.password = password;
    await existingUser.save();
    console.log(`Updated existing user ${email} to Admin.`);
  } else {
    await User.create({
      name,
      email,
      password,
      role: 'Admin',
    });
    console.log(`Created admin user ${email}.`);
  }

  process.exit(0);
};

run().catch((error) => {
  console.error('Failed to create admin user:', error.message);
  process.exit(1);
});
