import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type Standing = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: Standing[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<LeaderboardResponse>('/api/leaderboard', () => getJson<LeaderboardResponse>('/api/leaderboard'));

  return <section><h2 className="h4">Leaderboard</h2><p>Compare team point totals.</p>
    {loading && <p role="status">Loading leaderboard...</p>}
    {error && <p role="alert">Unable to load leaderboard: {error}</p>}
    {!loading && !error && data?.leaderboard.length === 0 && <p>No leaderboard scores yet.</p>}
    {!loading && !error && data && data.leaderboard.length > 0 && <ol className="list-group list-group-numbered">
      {data.leaderboard.map((standing) => <li className="list-group-item d-flex justify-content-between" key={standing.rank}>
        <span>{standing.teamName}</span><strong>{standing.totalPoints} points</strong>
      </li>)}
    </ol>}
  </section>;
}
