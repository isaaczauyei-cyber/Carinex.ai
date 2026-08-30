type TagItem = { id: number; name: string };

export default function ProfileSummary({
  firstName,
  lastName,
  bio,
  trackNational,
  trackGlobal,
  skills,
  services,
  interests,
}: {
  firstName: string;
  lastName: string;
  bio: string | null;
  trackNational: boolean;
  trackGlobal: boolean;
  skills: TagItem[];
  services: TagItem[];
  interests: TagItem[];
}) {
  const fullName = `${firstName} ${lastName}`.trim() || "Nurse";
  const initial = firstName.charAt(0).toUpperCase() || "N";

  return (
    <div className="overflow-hidden rounded-2xl border border-carinex-navy/10 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-carinex-navy to-carinex-emerald px-6 pb-6 pt-8 text-carinex-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-carinex-white/15 text-2xl font-bold ring-2 ring-carinex-white/30">
            {initial}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-carinex-white/60">
              Carinex Nurse
            </p>
            <h2 className="text-xl font-bold">{fullName}</h2>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {trackNational && (
            <span className="rounded-full bg-carinex-white/15 px-3 py-1 text-xs font-semibold">
              National track
            </span>
          )}
          {trackGlobal && (
            <span className="rounded-full bg-carinex-white/15 px-3 py-1 text-xs font-semibold">
              Global track
            </span>
          )}
          {!trackNational && !trackGlobal && (
            <span className="text-xs text-carinex-white/60">No track selected yet</span>
          )}
        </div>
      </div>

      <div className="p-6">
        <p className="text-carinex-navy/80">
          {bio || "No bio added yet."}
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
      </div>
    </div>
  );
}
