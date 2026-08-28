type TagItem = { id: number; name: string };

export default function ProfileSummary({
  bio,
  trackNational,
  trackGlobal,
  skills,
  services,
  interests,
}: {
  bio: string | null;
  trackNational: boolean;
  trackGlobal: boolean;
  skills: TagItem[];
  services: TagItem[];
  interests: TagItem[];
}) {
  return (
    <div className="rounded-2xl border border-carinex-navy/10 p-6">
      <div className="flex flex-wrap gap-2">
        {trackNational && (
          <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
            National track
          </span>
        )}
        {trackGlobal && (
          <span className="rounded-full bg-carinex-navy/5 px-3 py-1 text-xs font-semibold text-carinex-navy/70">
            Global track
          </span>
        )}
        {!trackNational && !trackGlobal && (
          <span className="text-xs text-carinex-navy/40">No track selected yet</span>
        )}
      </div>

      <p className="mt-4 text-carinex-navy/80">
        {bio || "No bio added yet — head to your profile to introduce yourself."}
      </p>

      {interests.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">Interests</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {interests.map((i) => (
              <span key={i.id} className="rounded-full bg-carinex-emerald/10 px-3 py-1 text-xs text-carinex-emerald">
                {i.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">Skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="rounded-full border border-carinex-navy/15 px-3 py-1 text-xs text-carinex-navy/70">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {services.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-carinex-navy/50">Services offered</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {services.map((s) => (
              <span key={s.id} className="rounded-full border border-carinex-navy/15 px-3 py-1 text-xs text-carinex-navy/70">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <a
        href="/dashboard/profile"
        className="mt-6 inline-block text-sm font-semibold text-carinex-emerald hover:underline"
      >
        Edit profile →
      </a>
    </div>
  );
}
