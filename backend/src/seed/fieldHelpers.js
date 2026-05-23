/** Helpers matching DynamicSectionBuilder field shape. */

function field(id, label, type, options = {}) {
  const { grid = 6, required = false, ...rest } = options

  return { id, label, grid, type, required, ...rest }
}

const RELATION_DISPLAY_DEFAULTS = {
  staff: ['firstName', 'lastName'],

  students: ['firstName', 'lastName'],

  parents: ['firstName', 'lastName'],

  classes: ['className'],

  sections: ['sectionName'],

  subjects: ['subjectName'],

  departments: ['departmentName'],

  designations: ['designationName'],

  roles: ['roleName'],

  buses: ['busNumber'],

  routes: ['routeName'],

  feeTypes: ['feeTypeName'],

  exams: ['examName'],

  events: ['eventTitle'],
}

const RELATION_VALUE_DEFAULTS = {
  staff: 'employeeCode',

  students: 'admissionNumber',

  parents: 'parentCode',

  classes: 'className',

  sections: 'sectionName',

  subjects: 'subjectCode',

  departments: 'departmentName',

  designations: 'designationName',

  roles: 'roleName',
}

/** Searchable dropdown backed by another section's entries. */

function rel(id, label, targetSection, options = {}) {
  const {
    displayFields = RELATION_DISPLAY_DEFAULTS[targetSection] ?? [],

    valueField = RELATION_VALUE_DEFAULTS[targetSection] ?? '_id',

    multiple = false,

    grid = 6,

    required = false,

    ...rest
  } = options

  return {
    id,

    label,

    grid,

    type: 'relation',

    required,

    targetSection,

    displayFields,

    valueField,

    multiple,

    ...rest,
  }
}

function statusField(id, label, options = ['Active', 'Inactive']) {
  return field(id, label, 'select', { required: true, options, ...arguments[2] })
}

/**

 * @param {string} name - Section key (sidebar name)

 * @param {import('mongoose').Document[]} fields

 * @param {Record<string, unknown>[]} [entries]

 */

function defineSection(name, fields, entries = []) {
  return { name, fields, entries }
}

module.exports = { field, rel, statusField, defineSection }
