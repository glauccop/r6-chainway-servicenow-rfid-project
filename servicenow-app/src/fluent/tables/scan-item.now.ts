import {
    Table,
    StringColumn,
    ChoiceColumn,
    ReferenceColumn,
    DateTimeColumn,
    IntegerColumn,
} from '@servicenow/sdk/core'

export const x_nowrfid_scan_item = Table({
    name: 'x_nowrfid_scan_item',
    label: 'Scan Item',
    display: 'epc',
    allowWebServiceAccess: true,
    index: [
        { name: 'epc_idx', unique: false, element: 'epc' },
        { name: 'barcode_value_idx', unique: false, element: 'barcode_value' },
    ],
    schema: {
        batch: ReferenceColumn({
            label: 'Batch',
            referenceTable: 'x_nowrfid_scan_batch',
            mandatory: true,
            cascadeRule: 'delete',
        }),
        client_item_id: StringColumn({ label: 'Client Item ID', maxLength: 64 }),
        capture_type: ChoiceColumn({
            label: 'Capture Type',
            dropdown: 'dropdown_without_none',
            default: 'rfid',
            choices: {
                rfid: { label: 'RFID', sequence: 10 },
                barcode: { label: 'Barcode', sequence: 20 },
                qr: { label: 'QR Code', sequence: 30 },
            },
        }),
        operation: ChoiceColumn({
            label: 'Operation',
            dropdown: 'dropdown_without_none',
            default: 'read',
            choices: {
                read: { label: 'Read', sequence: 10 },
                write: { label: 'Write', sequence: 20 },
            },
        }),
        epc: StringColumn({ label: 'EPC', maxLength: 128 }),
        tid: StringColumn({ label: 'TID', maxLength: 128 }),
        user_data: StringColumn({ label: 'User Data', maxLength: 1000 }),
        rssi: StringColumn({ label: 'RSSI', maxLength: 20 }),
        read_count: IntegerColumn({ label: 'Read Count', default: '0' }),
        barcode_value: StringColumn({ label: 'Barcode Value', maxLength: 1000 }),
        symbology: StringColumn({ label: 'Symbology', maxLength: 60 }),
        captured_at: DateTimeColumn({ label: 'Captured At' }),
        raw_payload: StringColumn({ label: 'Raw Payload', maxLength: 4000 }),
        match_status: ChoiceColumn({
            label: 'Match Status',
            dropdown: 'dropdown_without_none',
            default: 'unmatched',
            choices: {
                unmatched: { label: 'Unmatched', sequence: 10 },
                matched: { label: 'Matched', sequence: 20 },
                created: { label: 'Created', sequence: 30 },
            },
        }),
        matched_asset: ReferenceColumn({ label: 'Matched Asset', referenceTable: 'alm_asset' }),
    },
})
