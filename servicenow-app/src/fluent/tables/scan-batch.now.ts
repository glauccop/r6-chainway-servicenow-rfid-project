import {
    Table,
    StringColumn,
    ChoiceColumn,
    ReferenceColumn,
    DateTimeColumn,
    IntegerColumn,
} from '@servicenow/sdk/core'

export const x_nowrfid_scan_batch = Table({
    name: 'x_nowrfid_scan_batch',
    label: 'Scan Batch',
    display: 'number',
    allowWebServiceAccess: true,
    autoNumber: {
        prefix: 'RFB',
        number: 1000,
        numberOfDigits: 7,
    },
    index: [{ name: 'client_batch_id_idx', unique: true, element: 'client_batch_id' }],
    schema: {
        number: StringColumn({
            label: 'Number',
            maxLength: 40,
            readOnly: true,
            default: 'javascript:global.getNextObjNumberPadded();',
        }),
        client_batch_id: StringColumn({ label: 'Client Batch ID', maxLength: 64, mandatory: true, unique: true }),
        device_id: StringColumn({ label: 'Device ID', maxLength: 100 }),
        reader_mac: StringColumn({ label: 'Reader MAC', maxLength: 40 }),
        operator: ReferenceColumn({
            label: 'Operator',
            referenceTable: 'sys_user',
            default: 'javascript:gs.getUserID()',
        }),
        captured_at: DateTimeColumn({ label: 'Captured At' }),
        received_at: DateTimeColumn({ label: 'Received At' }),
        app_version: StringColumn({ label: 'App Version', maxLength: 40 }),
        notes: StringColumn({ label: 'Notes', maxLength: 1000 }),
        status: ChoiceColumn({
            label: 'Status',
            dropdown: 'dropdown_without_none',
            default: 'new',
            choices: {
                new: { label: 'New', sequence: 10 },
                processing: { label: 'Processing', sequence: 20 },
                processed: { label: 'Processed', sequence: 30 },
                error: { label: 'Error', sequence: 40 },
            },
        }),
        item_count: IntegerColumn({ label: 'Item Count', default: '0' }),
        location: ReferenceColumn({ label: 'Location', referenceTable: 'cmn_location' }),
        department: ReferenceColumn({ label: 'Department', referenceTable: 'cmn_department' }),
    },
})
