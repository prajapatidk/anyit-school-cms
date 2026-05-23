require('dotenv').config()
const mongoose = require('mongoose')
const Section = require('../models/Section')
const SectionEntry = require('../models/SectionEntry')

async function clearDatabase() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anyit_cms'
  await mongoose.connect(MONGO_URI)

  const entriesResult = await SectionEntry.deleteMany({})
  const sectionsResult = await Section.deleteMany({})

  console.log(`Removed ${entriesResult.deletedCount} section entries`)
  console.log(`Removed ${sectionsResult.deletedCount} sections`)

  await mongoose.connection.close()
}

if (require.main === module) {
  clearDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Clear failed:', error)
      process.exit(1)
    })
}

module.exports = { clearDatabase }
