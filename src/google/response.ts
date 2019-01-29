export interface FulfillResponse<T = FulfillPayload> {
    requestId: string;
    payload: T;
}

export interface FulfillPayload {
    errorCode?: string;
    debugString?: string;
}
