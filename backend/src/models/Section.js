const mongoose = require('mongoose')

const dynamicFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    grid: { type: Number, min: 1, max: 12, required: true },
    type: {
      type: String,
      enum: ['input', 'textarea', 'number', 'datepicker', 'profile_upload', 'select', 'relation'],
      required: true,
    },
    required: { type: Boolean, default: false },
    min: { type: Number },
    max: { type: Number },
    minDate: { type: String },
    maxDate: { type: String },
    options: [{ type: String }],
    targetSection: { type: String },
    displayFields: [{ type: String }],
    valueField: { type: String },
    multiple: { type: Boolean, default: false },
  },
  { _id: false },
)

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fields: { type: [dynamicFieldSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Section', sectionSchema)
