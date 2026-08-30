import { parseStatePutRequest, readJsonValue, withStateApi } from "@/server/state-api";
import { getStateRepository } from "@/server/state-repository";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => withStateApi(request, () => getStateRepository().read());

export const PUT = (request: Request) =>
  withStateApi(
    request,
    async () => getStateRepository().write(parseStatePutRequest(await readJsonValue(request))),
    { mutation: true },
  );
