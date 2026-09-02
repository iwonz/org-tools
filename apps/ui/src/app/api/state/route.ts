import {
  parseStateCreateNewRequest,
  parseStatePutRequest,
  readJsonValue,
  withStateApi,
} from "@/server/state-api";
import { getStateRepository, recreateStateRepository } from "@/server/state-repository";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => withStateApi(request, () => getStateRepository().read());

export const PUT = (request: Request) =>
  withStateApi(
    request,
    async () => {
      const update = parseStatePutRequest(await readJsonValue(request));
      return getStateRepository().write(update);
    },
    { mutation: true },
  );

export const POST = (request: Request) =>
  withStateApi(
    request,
    async () => {
      parseStateCreateNewRequest(await readJsonValue(request));
      return recreateStateRepository();
    },
    { mutation: true },
  );
