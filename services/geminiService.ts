
import { Song } from "../types";

export const getMusicInsight = async (song: Song): Promise<string> => {
  return Promise.resolve("Offline Mode: AI insights are unavailable.");
};

export const suggestPlaylistName = async (songs: Song[]): Promise<string> => {
  return Promise.resolve("My Offline Mix");
};
