/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

export class MainInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    void request;
    void response;

    return data;
  }
}

export async function fetchRequest(request: Request): Promise<string> {
  const [response, data] = await Application.scheduleRequest(request);

  const status = response.status;
  if (status === 503 || status === 403) {
    throw new CloudflareError(request, `Cloudflare bypass required (Status: ${status})`);
  }
  if (status < 200 || status >= 300) {
    throw new Error(`HTTP Error: ${status} for url: ${request.url}`);
  }

  return Application.arrayBufferToUTF8String(data);
}
