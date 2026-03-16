import { Stream, ProviderContext } from "../types";
import { validateStreams } from "../streamValidator";

export const getStream = async function ({
  link: url, // type, // providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const stream: Stream[] = [];
    stream.push({
      server: "vadapav",
      link: url,
      type: url?.split(".").pop() || "mkv",
    });
    // Validate all stream links before returning
    const validStreams = await validateStreams(stream, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;
  } catch (err) {
    return [];
  }
};
