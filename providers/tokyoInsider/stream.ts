import { Stream, ProviderContext } from "../types";
import { validateStreams } from "../streamValidator";

export const getStream = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const { cheerio } = providerContext;
    const url = link;
    const res = await fetch(url);
    const data = await res.text();
    const $ = cheerio.load(data);
    const streamLinks: Stream[] = [];
    $(".c_h1,.c_h2").map((i, element) => {
      $(element).find("span").remove();
      const title = $(element).find("a").text() || "";
      const link = $(element).find("a").attr("href") || "";
      if (title && link.includes("media")) {
        streamLinks.push({
          server: title,
          link,
          type: link.split(".").pop() || "mkv",
        });
      }
    });
    // Validate all stream links before returning
    const validStreams = await validateStreams(streamLinks, {
      timeout: 10000,
      maxConcurrent: 3,
    });
    return validStreams;
  } catch (err) {
    return [];
  }
};
