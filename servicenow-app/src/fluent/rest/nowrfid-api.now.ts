import { RestApi } from '@servicenow/sdk/core'
import { ping, postBatch } from '../../server/rest/handlers'
import { restApiAcl } from '../security/acls.now'

RestApi({
    $id: Now.ID['nowrfid-api'],
    name: 'NowRFID API',
    serviceId: 'nowrfid',
    shortDescription: 'Receives RFID / barcode / QR capture batches from the NowRFID Android app',
    consumes: 'application/json',
    produces: 'application/json',
    enforceAcl: [restApiAcl],
    routes: [
        {
            $id: Now.ID['nowrfid-api-ping'],
            name: 'ping',
            method: 'GET',
            path: '/ping',
            script: ping,
            authentication: true,
            authorization: true,
            enforceAcl: [restApiAcl],
            shortDescription: 'Connectivity / credential check',
        },
        {
            $id: Now.ID['nowrfid-api-batch'],
            name: 'batch',
            method: 'POST',
            path: '/batch',
            script: postBatch,
            authentication: true,
            authorization: true,
            enforceAcl: [restApiAcl],
            consumes: 'application/json',
            produces: 'application/json',
            shortDescription: 'Create a scan batch with its items (idempotent on batch.client_batch_id)',
            requestExample:
                '{"batch":{"client_batch_id":"4f1c...","device_id":"pixel-7","reader_mac":"D7:3B:AA:46:B4:E0","captured_at":"2026-09-24T18:30:00Z","app_version":"0.1.0","notes":""},"items":[{"client_item_id":"a1","capture_type":"rfid","operation":"read","epc":"E2004000780600801570752E","rssi":"-55.3","read_count":3,"captured_at":"2026-09-24T18:29:58Z"}]}',
        },
    ],
})
