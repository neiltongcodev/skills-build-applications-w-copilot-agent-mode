import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt: string };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiResource<ActivityResponse>('/api/activities', () => getJson<ActivityResponse>('/api/activities'));

  return <section><h2 className="h4">Activities</h2><p>Track student activity minutes and points.</p>
    {loading && <p role="status">Loading activities...</p>}
    {error && <p role="alert">Unable to load activities: {error}</p>}
    {!loading && !error && data?.activities.length === 0 && <p>No activities yet.</p>}
    {!loading && !error && data && data.activities.length > 0 && <ul className="list-group">
      {data.activities.map((activity, index) => <li className="list-group-item d-flex justify-content-between" key={activity._id ?? `${activity.type}-${activity.occurredAt}-${index}`}>
        <span>{activity.type} · {activity.minutes} min</span><span>{activity.points} points</span>
      </li>)}
    </ul>}
  </section>;
}
