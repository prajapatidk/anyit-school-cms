/**
 * School CMS section specs → DynamicSectionBuilder-compatible schemas.
 * Tuple: [fieldId, label, type, options?, relationTarget?]
 */

const SECTION_SPECS = [
  [
    'users',
    [
      ['roleId', 'Role', 'input', { required: true }, 'roles'],
      ['username', 'Username', 'input', { required: true }],
      ['email', 'Email', 'input', { required: true }],
      ['password', 'Password', 'input', { required: true }],
      ['status', 'Status', 'select', { options: ['Active', 'Inactive', 'Locked'], required: true }],
      ['lastLogin', 'Last Login', 'datepicker', {}],
    ],
    {
      roleId: 'ROLE-ADMIN',
      username: 'admin',
      email: 'admin@anyit.com',
      password: '(hashed in auth)',
      status: 'Active',
      lastLogin: '2026-05-20',
    },
  ],
]

module.exports = { SECTION_SPECS }
