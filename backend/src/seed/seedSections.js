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
  if (!user) {
    const passwordHash = await bcrypt.hash(seedPassword, 10)
    user = await User.create({
      name: seedName,
      email: seedEmail,
      password: passwordHash,
    })
    console.log(`Created seed user: ${seedEmail}`)
  } else {
    console.log(`Using seed user: ${seedEmail}`)
  }

  return user
}

async function seedSections({ reset = true } = {}) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anyit_cms'
  await mongoose.connect(MONGO_URI)

  if (reset) {
    console.log('Clearing existing sections and entries...')
    await SectionEntry.deleteMany({})
    await Section.deleteMany({})
  }

  const user = await ensureSeedUser()
  let sectionsCreated = 0
  let entriesCreated = 0

  console.log(`\nCreating ${SECTION_DEFINITIONS.length} School CMS sections...\n`)

  for (const definition of SECTION_DEFINITIONS) {
    const section = await Section.create({
      name: definition.name,
      userId: user._id,
      fields: definition.fields,
    })
    sectionsCreated += 1
    console.log(`  + ${definition.name} (${definition.fields.length} fields)`)

    for (const entryData of definition.entries) {
      await SectionEntry.create({
        sectionId: section._id,
        userId: user._id,
        data: new Map(Object.entries(entryData)),
      })
      entriesCreated += 1
    }
  }

  console.log('\nSeed summary:')
  console.log(`  Sections: ${sectionsCreated}`)
  console.log(`  Entries:  ${entriesCreated}`)
  console.log('\nSign in at /dashboard — sidebar lists all School CMS sections.')

  await mongoose.connection.close()
}

const reset = process.argv.includes('--no-reset') ? false : true

seedSections({ reset })
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed sections:', error)
    process.exit(1)
  })
