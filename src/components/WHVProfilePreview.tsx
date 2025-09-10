{/* Main Info Box (Preferences + Experience + Licenses + Heart Button) */}
<div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
  
  {/* Work Preferences */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
      <Briefcase size={16} className="text-orange-500 mr-2" />
      Work Preferences
    </h3>
    <div className="flex flex-wrap gap-2">
      {profileData?.workPrefs.length > 0 ? (
        profileData.workPrefs.map((wp: string, i: number) => (
          <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
            {wp}
          </span>
        ))
      ) : (
        <p className="text-sm text-gray-500">No work preferences set</p>
      )}
    </div>
  </div>

  {/* Location Preferences */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
      <MapPin size={16} className="text-orange-500 mr-2" />
      Location Preferences
    </h3>
    <div className="flex flex-wrap gap-2">
      {profileData?.locationPrefs.length > 0 ? (
        profileData.locationPrefs.map((lp: string, i: number) => (
          <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
            {lp}
          </span>
        ))
      ) : (
        <p className="text-sm text-gray-500">No location preferences set</p>
      )}
    </div>
  </div>

  {/* Work Experience */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-2">Work Experience</h3>
    {workExperiences.length > 0 ? (
      <div className="space-y-3">
        {workExperiences.map((exp, i) => (
          <div key={i} className="border-l-2 border-orange-200 pl-3">
            <p className="text-sm font-medium">{exp.position} – {exp.industry?.name || 'N/A'}</p>
            <p className="text-xs text-gray-600">{exp.company}, {exp.location}</p>
            <p className="text-xs text-gray-500">{formatDate(exp.start_date)} - {formatDate(exp.end_date)}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No work experience added</p>
    )}
  </div>

  {/* Licenses */}
  <div>
    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
      <Award size={16} className="text-orange-500 mr-2" />
      Licenses & Certifications
    </h3>
    <div className="flex flex-wrap gap-2">
      {licenses.length > 0 ? (
        licenses.map((l, i) => (
          <span key={i} className="px-3 py-1 border border-orange-500 text-orange-600 text-xs rounded-full">
            {l}
          </span>
        ))
      ) : (
        <p className="text-sm text-gray-500">No licenses added</p>
      )}
    </div>
  </div>

  {/* Heart to Match */}
  <Button className="w-full bg-gradient-to-r from-orange-400 to-slate-800 hover:from-orange-500 hover:to-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md">
    <Heart size={18} className="fill-white" /> Heart to Match
  </Button>
</div>
