const mongoose = require('mongoose')

const sectionEntrySchema = new mongoose.Schema(
  {
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
)

// Create a compound index for efficient queries
sectionEntrySchema.index({ sectionId: 1, userId: 1 })

module.exports = mongoose.model('SectionEntry', sectionEntrySchema)
