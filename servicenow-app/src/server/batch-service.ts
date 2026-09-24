import { gs, GlideRecord, GlideDateTime } from '@servicenow/glide'

const BATCH_TABLE = 'x_nowrfid_scan_batch'
const ITEM_TABLE = 'x_nowrfid_scan_item'
const CAPTURE_TYPES = ['rfid', 'barcode', 'qr']
const OPERATIONS = ['read', 'write']

export interface BatchPayload {
    client_batch_id?: string
    device_id?: string
    reader_mac?: string
    captured_at?: string
    app_version?: string
    notes?: string
}

export interface ItemPayload {
    client_item_id?: string
    capture_type?: string
    operation?: string
    epc?: string
    tid?: string
    user_data?: string
    rssi?: string | number
    read_count?: number
    barcode_value?: string
    symbology?: string
    captured_at?: string
    raw_payload?: string | object
}

export interface SubmitResult {
    status: number
    body: {
        batch_sys_id?: string
        batch_number?: string
        items_created?: number
        duplicate?: boolean
        errors: { client_item_id: string; message: string }[]
        error?: string
    }
}

function str(value: unknown, max: number): string {
    if (value === undefined || value === null) return ''
    const s = typeof value === 'string' ? value : String(value)
    return s.length > max ? s.substring(0, max) : s
}

/** ISO8601 ("2026-09-24T18:30:00.123Z" or with offset) -> GlideDateTime in UTC. Empty string when unparseable. */
export function isoToGlideUtc(iso?: string): string {
    if (!iso) return ''
    const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/.exec(iso.trim())
    if (!m) return ''
    let ms = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
    const tz = m[7]
    if (tz && tz !== 'Z') {
        const sign = tz[0] === '-' ? -1 : 1
        const digits = tz.substring(1).replace(':', '')
        const offsetMin = parseInt(digits.substring(0, 2), 10) * 60 + parseInt(digits.substring(2, 4), 10)
        ms -= sign * offsetMin * 60000
    }
    const d = new Date(ms)
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    const value =
        d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' +
        pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds())
    const gdt = new GlideDateTime()
    gdt.setValueUTC(value, 'yyyy-MM-dd HH:mm:ss')
    return gdt.isValid() ? gdt.getValue() : ''
}

function findBatch(clientBatchId: string): GlideRecord | null {
    const gr = new GlideRecord(BATCH_TABLE)
    gr.addQuery('client_batch_id', clientBatchId)
    gr.setLimit(1)
    gr.query()
    return gr.next() ? gr : null
}

function countItems(batchSysId: string): number {
    const gr = new GlideRecord(ITEM_TABLE)
    gr.addQuery('batch', batchSysId)
    gr.query()
    return gr.getRowCount()
}

export function submitBatch(payload: any): SubmitResult {
    const errors: { client_item_id: string; message: string }[] = []
    if (!payload || typeof payload !== 'object') {
        return { status: 400, body: { errors, error: 'Body must be a JSON object' } }
    }
    const batch: BatchPayload = payload.batch || {}
    const items: ItemPayload[] = payload.items
    const clientBatchId = str(batch.client_batch_id, 64).trim()
    if (!clientBatchId) {
        return { status: 400, body: { errors, error: 'batch.client_batch_id is required' } }
    }
    if (!Array.isArray(items) || items.length === 0) {
        return { status: 400, body: { errors, error: 'items must be a non-empty array' } }
    }

    const existing = findBatch(clientBatchId)
    if (existing) {
        const sysId = existing.getUniqueValue()
        return {
            status: 200,
            body: {
                batch_sys_id: sysId,
                batch_number: existing.getValue('number'),
                items_created: countItems(sysId),
                duplicate: true,
                errors,
            },
        }
    }

    const b = new GlideRecord(BATCH_TABLE)
    b.initialize()
    b.setValue('client_batch_id', clientBatchId)
    b.setValue('device_id', str(batch.device_id, 100))
    b.setValue('reader_mac', str(batch.reader_mac, 40))
    b.setValue('app_version', str(batch.app_version, 40))
    b.setValue('notes', str(batch.notes, 1000))
    b.setValue('operator', gs.getUserID())
    b.setValue('status', 'new')
    const capturedAt = isoToGlideUtc(batch.captured_at)
    if (capturedAt) b.setValue('captured_at', capturedAt)
    b.setValue('received_at', new GlideDateTime().getValue())
    const batchSysId = b.insert()
    if (!batchSysId) {
        return { status: 500, body: { errors, error: 'Failed to create batch' } }
    }

    let created = 0
    for (let i = 0; i < items.length; i++) {
        const it = items[i] || {}
        const clientItemId = str(it.client_item_id, 64) || 'index:' + i
        const captureType = str(it.capture_type, 20).toLowerCase()
        const operation = str(it.operation || 'read', 20).toLowerCase()
        if (CAPTURE_TYPES.indexOf(captureType) < 0) {
            errors.push({ client_item_id: clientItemId, message: 'invalid capture_type: ' + captureType })
            continue
        }
        if (OPERATIONS.indexOf(operation) < 0) {
            errors.push({ client_item_id: clientItemId, message: 'invalid operation: ' + operation })
            continue
        }
        if (captureType === 'rfid' && !it.epc) {
            errors.push({ client_item_id: clientItemId, message: 'epc is required for rfid items' })
            continue
        }
        if (captureType !== 'rfid' && !it.barcode_value) {
            errors.push({ client_item_id: clientItemId, message: 'barcode_value is required for barcode/qr items' })
            continue
        }
        const gr = new GlideRecord(ITEM_TABLE)
        gr.initialize()
        gr.setValue('batch', batchSysId)
        gr.setValue('client_item_id', clientItemId)
        gr.setValue('capture_type', captureType)
        gr.setValue('operation', operation)
        gr.setValue('epc', str(it.epc, 128).toUpperCase())
        gr.setValue('tid', str(it.tid, 128).toUpperCase())
        gr.setValue('user_data', str(it.user_data, 1000))
        gr.setValue('rssi', str(it.rssi, 20))
        gr.setValue('read_count', typeof it.read_count === 'number' ? Math.floor(it.read_count) : 0)
        gr.setValue('barcode_value', str(it.barcode_value, 1000))
        gr.setValue('symbology', str(it.symbology, 60))
        const itemAt = isoToGlideUtc(it.captured_at)
        if (itemAt) gr.setValue('captured_at', itemAt)
        const raw = typeof it.raw_payload === 'string' ? it.raw_payload : it.raw_payload ? JSON.stringify(it.raw_payload) : ''
        gr.setValue('raw_payload', str(raw, 4000))
        gr.setValue('match_status', 'unmatched')
        if (gr.insert()) {
            created++
        } else {
            errors.push({ client_item_id: clientItemId, message: 'insert failed' })
        }
    }

    b.setValue('item_count', created)
    if (created === 0) b.setValue('status', 'error')
    b.update()

    return {
        status: 201,
        body: {
            batch_sys_id: batchSysId,
            batch_number: b.getValue('number'),
            items_created: created,
            duplicate: false,
            errors,
        },
    }
}
