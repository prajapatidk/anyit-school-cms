require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')

async function seedUser() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anyit_cms'

  const seedEmail = process.env.SEED_USER_EMAIL || 'admin@anyit.com'
  const seedName = process.env.SEED_USER_NAME || 'Admin User'
  const seedPassword = process.env.SEED_USER_PASSWORD || 'Admin@123'

  await mongoose.connect(MONGO_URI)

  const existingUser = await User.findOne({ email: seedEmail })
  if (existingUser) {
    console.log(`Seed user already exists: ${seedEmail}`)
    await mongoose.connection.close()
    return
  }

  const passwordHash = await bcrypt.hash(seedPassword, 10)
  await User.create({
    name: seedName,
    email: seedEmail,
    password: passwordHash,
  })

  console.log('Seed user created successfully:')
  console.log(`Email: ${seedEmail}`)
  console.log(`Password: ${seedPassword}`)

  await mongoose.connection.close()
}

seedUser()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to seed user:', error)
    process.exit(1)
  })
