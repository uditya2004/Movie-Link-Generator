import {
  Agent,
  run,
  setDefaultOpenAIClient,
  tool,
  setTracingDisabled,
  InputGuardrailTripwireTriggered,
} from "@openai/agents";
import "dotenv/config";
import OpenAI from "openai";
import { z } from "zod";
import axios from "axios";

const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

setTracingDisabled(true);
setDefaultOpenAIClient(groqClient);

const model = "openai/gpt-oss-120b";

// Input Guardrails
const mediaInputAgent = new Agent({
  name: "Media query checker",
  instructions: `You are a validation agent that determines if a user's query is related to finding streaming links for movies or TV series.
  
  A query is VALID if it:
  - Asks for a movie or TV series by name
  - Requests streaming links, watch links, or where to watch content
  - Mentions specific movies, TV shows, series, episodes, or seasons
  - Asks about movie/TV series availability
  
  A query is INVALID if it:
  - Asks about general topics unrelated to movies/TV (e.g., math, science, cooking, news)
  - Requests information not related to streaming (e.g., reviews, ratings, cast information)
  - Is conversational without any media intent (e.g., "hello", "how are you")
  - Asks for other types of content (books, music, podcasts, etc.)
  
  Return true for isValidMediaQuestion if the query is about finding movie/TV streaming links, false otherwise.
  Provide a clear reason explaining why the query was accepted or rejected.`,
  model: model,
  outputType: z.object({
    isValidMediaQuestion: z
      .boolean()
      .describe(
        "true if the question is about finding movie or TV series streaming links, false otherwise"
      ),
    reason: z
      .string()
      .describe("Clear explanation of why the query was accepted or rejected"),
  }),
});

const mediaInputGuardrail = {
  name: "Media Streaming Guardrail",
  execute: async ({ input }) => {
    const result = await run(mediaInputAgent, input);
    return {
      outputInfo: result.finalOutput.reason,
      tripwireTriggered: !result.finalOutput.isValidMediaQuestion,
    };
  },
};

// ===== Movie Tools =====

const searchMovieByNameTool = tool({
  name: "search_movie_by_name",
  description:
    "Searches for movies by name in The Movie Database (TMDB) and returns a list of matching movies with their IDs and titles. Use this tool first to find the correct movie ID based on the user's query.",
  parameters: z.object({
    movieName: z
      .string()
      .describe(
        "The title or partial title of the movie to search for (e.g., 'Inception', 'The Dark Knight')"
      ),
  }),
  execute: async ({ movieName }) => {
    const tmdbSearchApiUrl = `https://api.themoviedb.org/3/search/movie`;

    const tmdbResponse = await axios.get(tmdbSearchApiUrl, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: movieName,
      },
    });

    // Extract only movie title and id from TMDB search results
    const matchingMovies = tmdbResponse.data.results.map((movie) => ({
      id: movie.id,
      name: movie.title,
    }));

    return matchingMovies;
  },
});

const getStreamingLinkTool = tool({
  name: "get_streaming_link",
  description:
    "Generates a streaming link for a specific movie using its TMDB ID. This tool constructs an embeddable video player URL that can be used to watch the movie. Call this tool after obtaining the movie ID from the search_movie_by_name tool.",
  parameters: z.object({
    movieId: z
      .number()
      .describe(
        "The Movie Database (TMDB) ID of the movie for which to generate a streaming link"
      ),
  }),
  execute: async ({ movieId }) => {
    const streamingEmbedUrl = `https://www.vidking.net/embed/movie/${movieId}`;
    return streamingEmbedUrl;
  },
});

// ===== TV Series Tools =====

const searchTvSeriesByNameTool = tool({
  name: "search_tv_series_by_name",
  description:
    "Searches for TV series by name in The Movie Database (TMDB) and returns a list of matching TV shows with their IDs and titles. Use this tool first to find the correct TV series ID based on the user's query.",
  parameters: z.object({
    seriesName: z
      .string()
      .describe(
        "The title or partial title of the TV series to search for (e.g., 'Breaking Bad', 'Game of Thrones')"
      ),
  }),
  execute: async ({ seriesName }) => {
    const tmdbSearchApiUrl = `https://api.themoviedb.org/3/search/tv`;

    const tmdbResponse = await axios.get(tmdbSearchApiUrl, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: seriesName,
      },
    });

    // Extract only TV series title and id from TMDB search results
    const matchingSeries = tmdbResponse.data.results.map((series) => ({
      id: series.id,
      name: series.name,
    }));

    return matchingSeries;
  },
});

const getTvSeriesDetailsTool = tool({
  name: "get_tv_series_details",
  description:
    "Retrieves detailed information about a TV series using its TMDB ID, including the number of seasons and episodes. Use this tool after obtaining the TV series ID from the search_tv_series_by_name tool to understand the series structure before generating streaming links.",
  parameters: z.object({
    seriesId: z
      .number()
      .describe("The Movie Database (TMDB) ID of the TV series"),
  }),
  execute: async ({ seriesId }) => {
    const tmdbDetailsApiUrl = `https://api.themoviedb.org/3/tv/${seriesId}`;

    const tmdbResponse = await axios.get(tmdbDetailsApiUrl, {
      params: {
        api_key: process.env.TMDB_API_KEY,
      },
    });

    // Extract relevant details
    const seriesDetails = {
      id: tmdbResponse.data.id,
      name: tmdbResponse.data.name,
      numberOfSeasons: tmdbResponse.data.number_of_seasons,
      numberOfEpisodes: tmdbResponse.data.number_of_episodes,
      seasons: tmdbResponse.data.seasons.map((season) => ({
        seasonNumber: season.season_number,
        episodeCount: season.episode_count,
        name: season.name,
      })),
    };

    return seriesDetails;
  },
});

const getTvSeriesStreamingLinkTool = tool({
  name: "get_tv_series_streaming_link",
  description:
    "Generates a streaming link for a specific episode of a TV series using its TMDB ID, season number, and episode number. Call this tool after obtaining the series ID and understanding the series structure from the get_tv_series_details tool.",
  parameters: z.object({
    seriesId: z
      .number()
      .describe("The Movie Database (TMDB) ID of the TV series"),
    seasonNumber: z
      .number()
      .describe("The season number (e.g., 1 for Season 1)"),
    episodeNumber: z
      .number()
      .describe("The episode number within the season (e.g., 8 for Episode 8)"),
  }),
  execute: async ({ seriesId, seasonNumber, episodeNumber }) => {
    const streamingEmbedUrl = `https://www.vidking.net/embed/tv/${seriesId}/${seasonNumber}/${episodeNumber}`;
    return streamingEmbedUrl;
  },
});

const getAllEpisodeLinksForSeasonTool = tool({
  name: "get_all_episode_links_for_season",
  description:
    "Generates streaming links for ALL episodes in a specific season of a TV series. Use this tool when the user requests a season but doesn't specify a particular episode number. This tool will return an array of streaming links for every episode in that season.",
  parameters: z.object({
    seriesId: z
      .number()
      .describe("The Movie Database (TMDB) ID of the TV series"),
    seasonNumber: z
      .number()
      .describe("The season number (e.g., 1 for Season 1)"),
    episodeCount: z
      .number()
      .describe(
        "The total number of episodes in this season (obtained from get_tv_series_details tool)"
      ),
  }),
  execute: async ({ seriesId, seasonNumber, episodeCount }) => {
    const episodeLinks = [];
    for (let episode = 1; episode <= episodeCount; episode++) {
      const streamingEmbedUrl = `https://www.vidking.net/embed/tv/${seriesId}/${seasonNumber}/${episode}`;
      episodeLinks.push({
        episodeNumber: episode,
        link: streamingEmbedUrl,
      });
    }
    return episodeLinks;
  },
});

const mediaStreamingAgent = new Agent({
  name: "Movie & TV Series Streaming Link Provider",
  instructions: `
    You are a helpful assistant that provides streaming links for both movies and TV series. 

    Response format requirements:
    - Always respond in GitHub-flavored Markdown.
    - Always use bullet points only (a Markdown list). Even a single link must be in a bullet.
    - Do NOT use Markdown tables.
    - When returning a link, format it as a Markdown link like: [Watch here](https://example.com)
    - For multiple episode links, use one bullet per episode.
    - Keep the response concise and only include information needed to use the link(s).
    
    For MOVIES:
        1) Extract the movie title from the user's query. 
        2) Use the 'search_movie_by_name' tool to find matching movies and their TMDB IDs. 
        3) If multiple results are found, select the most relevant movie based on the user's query. 
        4) Use the 'get_streaming_link' tool with the movie's TMDB ID to generate the streaming URL. 
        5) Present the streaming link to the user in a clear and friendly manner.
    
    For TV SERIES:
        1) Extract the TV series title from the user's query.
        2) Use the 'search_tv_series_by_name' tool to find matching TV series and their TMDB IDs.
        3) If multiple results are found, select the most relevant series based on the user's query.
        4) Use the 'get_tv_series_details' tool to retrieve information about seasons and episodes.
        5) Determine what the user is asking for:
           a) If the user specified BOTH season AND episode: use 'get_tv_series_streaming_link' to generate a single episode link.
           b) If the user specified ONLY a season (no specific episode): use 'get_all_episode_links_for_season' to generate links for ALL episodes in that season.
           c) If no season/episode was mentioned: ask the user which season and episode they want, or provide details about available seasons.
        6) Present the streaming link(s) to the user in a clear, organized, and friendly manner.
    
    `,
  tools: [
    searchMovieByNameTool,
    getStreamingLinkTool,
    searchTvSeriesByNameTool,
    getTvSeriesDetailsTool,
    getTvSeriesStreamingLinkTool,
    getAllEpisodeLinksForSeasonTool,
  ],
  model: model,
  inputGuardrails: [mediaInputGuardrail],
});

// Export the agent and helper function for use in server
export async function processQuery(userQuery, conversationHistory = []) {
  try {
    // Build the full context including conversation history
    let fullQuery = userQuery;
    if (conversationHistory.length > 0) {
      const recentContext = conversationHistory
        .slice(-2)
        .map(
          (msg) =>
            `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        )
        .join("\n");
      fullQuery = `Previous context:\n${recentContext}\n\nCurrent request: ${userQuery}`;
    }

    const result = await run(mediaStreamingAgent, fullQuery);

    return {
      success: true,
      output: result.finalOutput,
    };
  } catch (error) {
    if (error instanceof InputGuardrailTripwireTriggered) {
      return {
        success: false,
        rejected: true,
        reason: error.outputInfo,
      };
    } else {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export { mediaStreamingAgent, InputGuardrailTripwireTriggered };
