import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { _id?: string; name: string; mascot?: string; members: unknown[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiResource<TeamResponse>('/api/teams', () => getJson<TeamResponse>('/api/teams'));

  return <section><h2 className="h4">Teams</h2><p>Manage teams and members.</p>
    {loading && <p role="status">Loading teams...</p>}
    {error && <p role="alert">Unable to load teams: {error}</p>}
    {!loading && !error && data?.teams.length === 0 && <p>No teams yet.</p>}
    {!loading && !error && data && data.teams.length > 0 && <ul className="list-group">
      {data.teams.map((team) => <li className="list-group-item d-flex justify-content-between" key={team._id ?? team.name}>
        <span>{team.name}{team.mascot ? ` · ${team.mascot}` : ''}</span><span>{team.members?.length ?? 0} members</span>
      </li>)}
    </ul>}
  </section>;
}
