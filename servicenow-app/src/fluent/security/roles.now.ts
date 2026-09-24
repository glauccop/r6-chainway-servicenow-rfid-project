import { Role } from '@servicenow/sdk/core'

export const integrationRole = Role({
    name: 'x_nowrfid.integration',
    description: 'NowRFID Android app integration user: can post scan batches and read staging records',
})

export const adminRole = Role({
    name: 'x_nowrfid.admin',
    description: 'NowRFID administrator: full access to scan batches and scan items',
    containsRoles: [integrationRole],
})
