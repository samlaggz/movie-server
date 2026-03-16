import { Stream, ProviderContext } from "../types";
import { validateStreams } from "../streamValidator";

export const getStream = async function ({
  link: id,
  // type,
  signal,
  providerContext,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const { axios, cheerio } = providerContext;
    const stream: Stream[] = [];
    const [, epId] = id.split("&");
    const url = `https://febbox.vercel.app/api/video-quality?fid=${epId}`;
    const res = await axios.get(url, { signal });
    const data = res.data;
    const $ = cheerio.load(data.html);
    $(".file_quality").each((i, el) => {
      const server =
        $(el).find("p.name").text() +
        " - " +
        $(el).find("p.size").text() +
        " - " +
        $(el).find("p.speed").text();
      const link = $(el).attr("data-url");
      if (link) {
        stream.push({
          server: server,
          type: "mkv",
          link: link,
        });
      }
    });

    // Validate all stream links before returning
    const validStreams = await validateStreams(stream, {
      timeout: 10000,      // 10 second timeout per link
      maxConcurrent: 3,    // Check 3 links at a time
    });

    return validStreams;
  } catch (err) {
    return [];
  }
};
