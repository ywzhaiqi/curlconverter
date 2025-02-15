// Author: ssi-anik (sirajul.islam.anik@gmail.com)

import * as util from "../util.js";
import type { Request, QueryDict } from "../util.js";

import querystring from "query-string";

type JSONOutput = {
  url: string;
  raw_url: string;
  method: string;
  cookies?: { [key: string]: string };
  headers?: { [key: string]: string | null };
  queries?: QueryDict;
  data?: { [key: string]: string };
  // raw_data?: string[],
  files?: { [key: string]: string };
  // raw_files: string[],
  insecure?: boolean;
  auth?: { user: string; password: string };
};

function getDataString(request: Request): {
  data?: { [key: string]: string | string[] };
} {
  if (!request.data) {
    return {};
  }
  /*
    if ( !request.isDataRaw && request.data.startsWith('@') ) {
   var filePath = request.data.slice(1);
   return filePath;
   }
   */

  const parsedQueryString = querystring.parse(request.data, { sort: false });
  const keyCount = Object.keys(parsedQueryString).length;
  const singleKeyOnly =
    keyCount === 1 && !parsedQueryString[Object.keys(parsedQueryString)[0]];
  const singularData = request.isDataBinary || singleKeyOnly;
  if (singularData) {
    const data: { [key: string]: string } = {};
    // TODO: dataRaw = request.data ?
    data[request.data] = "";
    return { data };
  } else {
    return getMultipleDataString(request, parsedQueryString);
  }
}

function getMultipleDataString(
  request: Request,
  parsedQueryString: querystring.ParsedQuery<string>
) {
  const data: { [key: string]: string | string[] } = {};

  for (const key in parsedQueryString) {
    const value = parsedQueryString[key];
    if (Array.isArray(value)) {
      data[key] = value.map((v: string | null) => (v ? v : ""));
    } else {
      data[key] = value ? value : "";
    }
  }

  return { data };
}

function getFilesString(
  request: Request
):
  | { files?: { [key: string]: string }; data?: { [key: string]: string } }
  | undefined {
  if (!request.multipartUploads) {
    return undefined;
  }
  const data: {
    files: { [key: string]: string };
    data: { [key: string]: string };
  } = {
    files: {},
    data: {},
  };

  for (const [multipartKey, multipartValue] of request.multipartUploads) {
    if (multipartValue.startsWith("@")) {
      const fileName = multipartValue.slice(1);
      data.files[multipartKey] = fileName;
    } else {
      data.data[multipartKey] = multipartValue;
    }
  }

  return {
    files: Object.keys(data.files).length ? data.files : undefined,
    data: Object.keys(data.data).length ? data.data : undefined,
  };
}

export const _toJsonString = (request: Request) => {
  // curl automatically prepends 'http' if the scheme is missing, but python fails and returns an error
  // we tack it on here to mimic curl
  if (!request.url.match(/https?:/)) {
    request.url = "http://" + request.url;
  }
  if (!request.urlWithoutQuery.match(/https?:/)) {
    request.urlWithoutQuery = "http://" + request.urlWithoutQuery;
  }

  const requestJson: JSONOutput = {
    url: (request.queryDict ? request.urlWithoutQuery : request.url).replace(
      /\/$/,
      ""
    ),
    // url: request.queryDict ? request.urlWithoutQuery : request.url,
    raw_url: request.url,
    // TODO: move this after .query?
    method: request.method.toLowerCase(), // lowercase for backwards compatibility
  };
  // if (request.queryDict) {
  //   requestJson.query = request.queryDict
  // }

  if (request.cookies) {
    // TODO: repeated cookies
    requestJson.cookies = Object.fromEntries(request.cookies);
    // Normally when a generator uses .cookies, it should delete it from
    // headers, but users of the JSON output would expect to have all the
    // headers in .headers.
  }

  if (request.headers) {
    // TODO: what if Object.keys().length !== request.headers.length?
    requestJson.headers = Object.fromEntries(request.headers);
  }

  if (request.queryDict) {
    // TODO: rename
    requestJson.queries = request.queryDict;
  }

  // TODO: not Object.assign, doesn't work with type system
  if (request.data && typeof request.data === "string") {
    Object.assign(requestJson, getDataString(request));
  } else if (request.multipartUploads) {
    Object.assign(requestJson, getFilesString(request));
  }

  if (request.insecure) {
    requestJson.insecure = false;
  }

  if (request.auth) {
    const [user, password] = request.auth;
    requestJson.auth = {
      user: user,
      password: password,
    };
  }

  return (
    JSON.stringify(
      Object.keys(requestJson).length ? requestJson : "{}",
      null,
      4
    ) + "\n"
  );
};
export const toJsonString = (curlCommand: string | string[]) => {
  const request = util.parseCurlCommand(curlCommand);
  return _toJsonString(request);
};
