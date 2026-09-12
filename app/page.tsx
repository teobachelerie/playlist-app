import PlaylistApp from "@/components/PlaylistApp";
import { getPlaylist } from "@/lib/playlist";

export default function Home() {
  const tracks = getPlaylist();
  return <PlaylistApp tracks={tracks} />;
}
