/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request, Response } from "@paperback/types";
import { CloudflareError, PaperbackInterceptor } from "@paperback/types";
import { isCloudflareChallenge, parseJsonOrCloudflare } from "../../common/cloudflare";

import { DOMAIN } from "../implementations/shared/models";

export class QiScansInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
      },
    };
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    if (isCloudflareChallenge(response, data)) {
      throw new CloudflareError({
        url: request.url,
        method: request.method ?? "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }

    return data;
  }
}

export async function fetchJSON<T>(request: Request): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  return parseJsonOrCloudflare<T>(response, buffer, request.url);
}
