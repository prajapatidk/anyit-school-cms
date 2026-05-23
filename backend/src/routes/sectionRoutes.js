const express = require('express')
const mongoose = require('mongoose')
const { body, validationResult } = require('express-validator')
const authMiddleware = require('../middleware/authMiddleware')
const Section = require('../models/Section')
const SectionEntry = require('../models/SectionEntry')

const router = express.Router()

router.use(authMiddleware)

router.get('/', async (req, res) => {
  const userId = req.user.id
  const sections = await Section.find({ userId }).sort({ order: 1, createdAt: 1 }).lean()
  const entryCounts = await SectionEntry.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$sectionId', entryCount: { $sum: 1 } } },
  ])
  const countBySectionId = Object.fromEntries(
    entryCounts.map((row) => [row._id.toString(), row.entryCount]),
  )
  return res.json(
    sections.map((section) => ({
      ...section,
      entryCount: countBySectionId[section._id.toString()] ?? 0,
    })),
  )
})

router.post(
  '/',
  [body('name').notEmpty(), body('fields').isArray({ min: 1 })],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    const lastSection = await Section.findOne({ userId: req.user.id })
      .sort({ order: -1 })
      .select('order')
      .lean()
    const nextOrder = (lastSection?.order ?? -1) + 1

    const section = await Section.create({
      name: req.body.name,
      fields: req.body.fields,
      userId: req.user.id,
      order: nextOrder,
    })

    return res.status(201).json(section)
  },
)

router.patch(
  '/reorder',
  [body('orderedIds').isArray({ min: 1 }), body('orderedIds.*').isString().notEmpty()],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() })
    }

    try {
      const userId = req.user.id
      const orderedIds = req.body.orderedIds

      const ownedCount = await Section.countDocuments({
        userId,
        _id: { $in: orderedIds },
      })

      if (ownedCount !== orderedIds.length) {
        return res.status(400).json({ message: 'One or more sections are invalid' })
      }

      await Promise.all(
        orderedIds.map((sectionId, index) =>
          Section.updateOne({ _id: sectionId, userId }, { order: index }),
        ),
      )

      const sections = await Section.find({ userId }).sort({ order: 1, createdAt: 1 }).lean()
      return res.json(sections)
    } catch (error) {
      return res.status(500).json({ message: 'Error reordering sections', error: error.message })
    }
  },
)

router.get('/:sectionId/entries', async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.sectionId,
      userId: req.user.id,
    })

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    const entries = await SectionEntry.find({
      sectionId: req.params.sectionId,
      userId: req.user.id,
    }).sort({ createdAt: -1 })

    return res.json(
      entries.map((entry) => ({
        _id: entry._id,
        sectionId: entry.sectionId,
        ...Object.fromEntries(entry.data),
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
    )
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching entries', error: error.message })
  }
})

// Update a section (modify name and fields)
router.put('/:sectionId', async (req, res) => {
  try {
    const section = await Section.findOneAndUpdate(
      {
        _id: req.params.sectionId,
        userId: req.user.id,
      },
      {
        name: req.body.name,
        fields: req.body.fields,
      },
      { new: true },
    )

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    return res.json(section)
  } catch (error) {
    return res.status(500).json({ message: 'Error updating section', error: error.message })
  }
})

router.delete('/:sectionId', async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.sectionId,
      userId: req.user.id,
    })

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    const entryCount = await SectionEntry.countDocuments({
      sectionId: req.params.sectionId,
      userId: req.user.id,
    })

    if (entryCount > 0) {
      return res.status(409).json({
        message: `Cannot delete section "${section.name}" because it has ${entryCount} record(s). Delete all entries in View Data first.`,
        entryCount,
      })
    }

    await Section.findByIdAndDelete(section._id)
    return res.json({ message: 'Section deleted successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting section', error: error.message })
  }
})

// Create a new entry for a section
router.post('/:sectionId/entries', async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.sectionId,
      userId: req.user.id,
    })

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    const entry = await SectionEntry.create({
      sectionId: req.params.sectionId,
      userId: req.user.id,
      data: new Map(Object.entries(req.body)),
    })

    const entryObject = Object.fromEntries(entry.data)
    return res.status(201).json({
      _id: entry._id,
      sectionId: entry.sectionId,
      ...entryObject,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error creating entry', error: error.message })
  }
})

// Update an entry
router.put('/:sectionId/entries/:entryId', async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.sectionId,
      userId: req.user.id,
    })

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    const entry = await SectionEntry.findOneAndUpdate(
      {
        _id: req.params.entryId,
        sectionId: req.params.sectionId,
        userId: req.user.id,
      },
      { data: new Map(Object.entries(req.body)) },
      { new: true },
    )

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' })
    }

    const entryObject = Object.fromEntries(entry.data)
    return res.json({
      _id: entry._id,
      sectionId: entry.sectionId,
      ...entryObject,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error updating entry', error: error.message })
  }
})

// Delete an entry
router.delete('/:sectionId/entries/:entryId', async (req, res) => {
  try {
    const section = await Section.findOne({
      _id: req.params.sectionId,
      userId: req.user.id,
    })

    if (!section) {
      return res.status(404).json({ message: 'Section not found' })
    }

    const entry = await SectionEntry.findOneAndDelete({
      _id: req.params.entryId,
      sectionId: req.params.sectionId,
      userId: req.user.id,
    })

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' })
    }

    return res.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting entry', error: error.message })
  }
})

module.exports = router
