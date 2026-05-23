const { field, rel } = require('./fieldHelpers')
const { SECTION_SPECS } = require('./schoolSectionSpecs')

function buildField([id, label, type, options = {}, relationTarget]) {
  if (relationTarget) {
    return rel(id, label, relationTarget, { fieldType: type, ...options })
  }
  return field(id, label, type, options)
}

const SECTION_DEFINITIONS = SECTION_SPECS.map(([name, fieldSpecs, sampleEntry]) => ({
  name,
  fields: fieldSpecs.map(buildField),
  entries: sampleEntry ? [sampleEntry] : [],
}))

module.exports = { SECTION_DEFINITIONS, field, rel }
