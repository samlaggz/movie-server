import { Stream, ProviderContext, EpisodeLink } from "../types";
import { validateStreams } from "../streamValidator";

export const getStream = async function ({
  link: url,
  type,
  providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  const { axios, cheerio } = providerContext;
  try {
    const stream: Stream[] = [];
    const data = JSON.parse(url);
    stream.push({
      link: data.url,
      server: data.title || "Unknown Server",
      type: "mp4",
    });
    console.log("stream", stream);
    // Validate all stream links before returning
    const validStreams = await validateStreams(stream, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;
  } catch (err) {
    console.log("getStream error", err);
    return [];
  }
};
