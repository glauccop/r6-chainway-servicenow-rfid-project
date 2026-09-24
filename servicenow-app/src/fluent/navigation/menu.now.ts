import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { adminRole, integrationRole } from '../security/roles.now'

export const nowRfidMenu = ApplicationMenu({
    $id: Now.ID['nowrfid-menu'],
    title: 'NowRFID',
    hint: 'RFID / barcode / QR capture staging',
    description: 'Staging area for captures sent by the NowRFID Android app (Chainway R6)',
    roles: [adminRole, integrationRole],
    active: true,
})

Record({
    $id: Now.ID['nowrfid-module-batches'],
    table: 'sys_app_module',
    data: {
        title: 'Scan Batches',
        application: nowRfidMenu,
        link_type: 'LIST',
        name: 'x_nowrfid_scan_batch',
        roles: [adminRole, integrationRole],
        active: true,
        order: 100,
    },
})

Record({
    $id: Now.ID['nowrfid-module-items'],
    table: 'sys_app_module',
    data: {
        title: 'Scan Items',
        application: nowRfidMenu,
        link_type: 'LIST',
        name: 'x_nowrfid_scan_item',
        roles: [adminRole, integrationRole],
        active: true,
        order: 200,
    },
})
