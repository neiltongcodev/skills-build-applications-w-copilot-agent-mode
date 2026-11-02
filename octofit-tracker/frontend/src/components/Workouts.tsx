import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const email = 'mona@example.com';
  const suggestionsPath = `/api/workouts/suggestions/${encodeURIComponent(email)}`;
  const { data, loading, error } = useApiResource<WorkoutResponse>(suggestionsPath, () => getJson<WorkoutResponse>(suggestionsPath));

  return <section><h2 className="h4">Workout suggestions</h2><p>Recommend workouts from activity patterns.</p>
    {loading && <p role="status">Loading workout suggestions...</p>}
    {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
    {!loading && !error && data?.suggestions.length === 0 && <p>No workout suggestions yet.</p>}
    {!loading && !error && data && data.suggestions.length > 0 && <ul className="list-group">
      {data.suggestions.map((workout) => <li className="list-group-item" key={`${workout.title}-${workout.focus}`}>
        <div className="d-flex justify-content-between"><strong>{workout.title}</strong><span>{workout.minutes} min · {workout.difficulty}</span></div>
        <p className="mb-1">Focus: {workout.focus}</p><p className="mb-0">{workout.reason}</p>
      </li>)}
    </ul>}
  </section>;
}
