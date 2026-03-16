import { Stream, ProviderContext } from "../types";
import { validateStreams } from "../streamValidator";

export const getStream = async function ({
  link: data,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const streamLinks: Stream[] = [];
  const dataJson = JSON.parse(data);
  streamLinks.push({
    link: dataJson.url,
    server: dataJson.server,
    type: "mkv",
  });
  // Validate all stream links before returning
    const validStreams = await validateStreams(streamLinks, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;
};
