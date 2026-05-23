require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Section = require('../models/Section')
const SectionEntry = require('../models/SectionEntry')
const { SECTION_DEFINITIONS } = require('./sectionDefinitions')

async function ensureSeedUser() {
  const seedEmail = process.env.SEED_USER_EMAIL || 'admin@anyit.com'
  const seedName = process.env.SEED_USER_NAME || 'Admin User'
  const seedPassword = process.env.SEED_USER_PASSWORD || 'Admin@123'

  let user = await User.findOne({ email: seedEmail })
  if (user) {
    console.log(`Seed user: ${seedEmail}`)
    return user
  }

  const passwordHash = await bcrypt.hash(seedPassword, 10)
  user = await User.create({
    name: seedName,
    email: seedEmail,
    password: passwordHash,
  })

  console.log('Seed user created:')
  console.log(`  Email:    ${seedEmail}`)
  console.log(`  Password: ${seedPassword}`)
  return user
}

async function seedAll() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anyit_cms'
  await mongoose.connect(MONGO_URI)

  console.log('Clearing sections and entries...')
  const entriesDeleted = await SectionEntry.deleteMany({})
  const sectionsDeleted = await Section.deleteMany({})
  console.log(
    `  Removed ${entriesDeleted.deletedCount} entries, ${sectionsDeleted.deletedCount} sections`,
  )

  const user = await ensureSeedUser()

  console.log(`\nSeeding ${SECTION_DEFINITIONS.length} School CMS sections...\n`)

  for (const definition of SECTION_DEFINITIONS) {
    const section = await Section.create({
      name: definition.name,
      userId: user._id,
      fields: definition.fields,
    })

    for (const entryData of definition.entries) {
      await SectionEntry.create({
        sectionId: section._id,
        userId: user._id,
        data: new Map(Object.entries(entryData)),
      })
    }

    const entryNote = definition.entries.length ? ` +${definition.entries.length} entry` : ''
    console.log(`  + ${definition.name} (${definition.fields.length} fields)${entryNote}`)
  }

  console.log('\nDone. Open /dashboard after sign-in.')
  await mongoose.connection.close()
}

seedAll()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
