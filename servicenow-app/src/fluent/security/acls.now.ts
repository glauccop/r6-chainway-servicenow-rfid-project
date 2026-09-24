import { Acl } from '@servicenow/sdk/core'
import { integrationRole, adminRole } from './roles.now'

// Integration role: read + create (the Android app only inserts). Admin: full CRUD.
Acl({
    $id: Now.ID['x_nowrfid_scan_batch-read'],
    type: 'record',
    table: 'x_nowrfid_scan_batch',
    operation: 'read',
    roles: [integrationRole, adminRole],
    description: 'NowRFID: read x_nowrfid_scan_batch',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_batch-create'],
    type: 'record',
    table: 'x_nowrfid_scan_batch',
    operation: 'create',
    roles: [integrationRole, adminRole],
    description: 'NowRFID: create x_nowrfid_scan_batch',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_batch-write'],
    type: 'record',
    table: 'x_nowrfid_scan_batch',
    operation: 'write',
    roles: [adminRole],
    description: 'NowRFID: write x_nowrfid_scan_batch',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_batch-delete'],
    type: 'record',
    table: 'x_nowrfid_scan_batch',
    operation: 'delete',
    roles: [adminRole],
    description: 'NowRFID: delete x_nowrfid_scan_batch',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_item-read'],
    type: 'record',
    table: 'x_nowrfid_scan_item',
    operation: 'read',
    roles: [integrationRole, adminRole],
    description: 'NowRFID: read x_nowrfid_scan_item',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_item-create'],
    type: 'record',
    table: 'x_nowrfid_scan_item',
    operation: 'create',
    roles: [integrationRole, adminRole],
    description: 'NowRFID: create x_nowrfid_scan_item',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_item-write'],
    type: 'record',
    table: 'x_nowrfid_scan_item',
    operation: 'write',
    roles: [adminRole],
    description: 'NowRFID: write x_nowrfid_scan_item',
})

Acl({
    $id: Now.ID['x_nowrfid_scan_item-delete'],
    type: 'record',
    table: 'x_nowrfid_scan_item',
    operation: 'delete',
    roles: [adminRole],
    description: 'NowRFID: delete x_nowrfid_scan_item',
})

export const restApiAcl = Acl({
    $id: Now.ID['nowrfid-rest-execute'],
    type: 'rest_endpoint',
    name: 'NowRFID API',
    operation: 'execute',
    roles: [integrationRole, adminRole],
    description: 'NowRFID Scripted REST API access',
})
