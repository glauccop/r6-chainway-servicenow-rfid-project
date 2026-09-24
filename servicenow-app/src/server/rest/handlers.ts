import { gs, GlideDateTime } from '@servicenow/glide'
import { RESTAPIRequest, RESTAPIResponse } from '@servicenow/glide/sn_ws_int'
import { submitBatch } from '../batch-service'

export function ping(_request: RESTAPIRequest, response: RESTAPIResponse) {
    response.setStatus(200)
    response.setBody({
        ok: true,
        user: gs.getUserName(),
        scope: 'x_nowrfid',
        time: new GlideDateTime().getValue(),
    } as any)
}

export function postBatch(request: RESTAPIRequest, response: RESTAPIResponse) {
    let payload: any
    try {
        payload = request.body.data
        if (typeof payload === 'string') payload = JSON.parse(payload)
    } catch (e) {
        response.setStatus(400)
        response.setBody({ errors: [], error: 'Invalid JSON body' } as any)
        return
    }
    const result = submitBatch(payload)
    response.setStatus(result.status)
    response.setBody(result.body as any)
}
