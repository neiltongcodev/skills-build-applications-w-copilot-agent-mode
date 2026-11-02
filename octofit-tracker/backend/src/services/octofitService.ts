import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[\da-f]{24}$/i.test(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');

  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw httpError(400, 'Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');

  const { name, mascot } = input;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'Team mascot is required');

  const members = input.members ?? [];
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw httpError(400, 'Members must be an array of valid user IDs');
  }
  if (members.length > 0) {
    const memberCount = await User.countDocuments({ _id: { $in: members } });
    if (memberCount !== members.length) throw httpError(404, 'One or more team members were not found');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ teamName: string; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
    { $lookup: { from: Team.collection.name, localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
  ]);

  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw httpError(404, 'User not found');

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(20).lean(),
    Workout.find().lean(),
  ]);
  const focusCandidates = [user.fitnessGoal, ...activities.map((activity) => activity.type)]
    .filter((focus): focus is string => Boolean(focus))
    .map((focus) => focus.toLowerCase());

  return workouts
    .map((workout) => {
      const workoutFocus = workout.focus.toLowerCase();
      const matchIndex = focusCandidates.indexOf(workoutFocus);
      const recentActivity = activities.find((activity) => activity.type.toLowerCase() === workoutFocus);
      const reason = matchIndex === 0
        ? `Matches your ${user.fitnessGoal} fitness goal.`
        : recentActivity
          ? `Builds on your recent ${recentActivity.type} activity.`
          : `A general option to support your ${user.fitnessGoal} goal.`;
      return { ...workout, reason, matchIndex: matchIndex < 0 ? Number.MAX_SAFE_INTEGER : matchIndex };
    })
    .sort((left, right) => left.matchIndex - right.matchIndex)
    .map(({ matchIndex: _matchIndex, ...workout }) => workout);
}

export { User };
