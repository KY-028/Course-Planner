import { formatCourseInfoForDisplay } from "../functions/customCoursesApi";

function CourseInfoPanel({ label, info, accentClass }) {
  const display = formatCourseInfoForDisplay(info);

  return (
    <div className={`flex-1 min-w-0 rounded-lg border p-4 ${accentClass}`}>
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">{label}</h4>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium text-gray-700">Course code</dt>
          <dd className="text-gray-900">{display.code}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-700">Title</dt>
          <dd className="text-gray-900 break-words">{display.title}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-700">Professor</dt>
          <dd className="text-gray-900">{display.professor}</dd>
        </div>
        <div>
          <dt className="font-medium text-gray-700">Schedule</dt>
          <dd className="text-gray-900">
            <ul className="mt-1 list-disc pl-5 space-y-1">
              {display.sessions.map((session, index) => (
                <li key={index}>{session}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function CustomCourseMismatchModal({ mismatches, onUpdate, onDisregard, isUpdating }) {
  if (!mismatches?.length) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4"
      style={{ zIndex: 10000001 }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Custom course updates detected</h2>
          <p className="mt-1 text-sm text-gray-600">
            Some of your saved custom courses differ from the shared catalog. Another user may have updated them.
          </p>
        </div>

        <div className="space-y-6">
          {mismatches.map((item) => (
            <section key={`${item.term}-${item.courseId}`} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
              <p className="text-sm font-medium text-amber-900 mb-4">
                <span className="font-semibold">{item.courseId}</span> ({item.term} term) seems to have updated its info
                due to another user&apos;s input — you might want to double check.
              </p>
              <div className="flex flex-col md:flex-row gap-4">
                <CourseInfoPanel
                  label="Your saved version"
                  info={item.yours}
                  accentClass="border-blue-200 bg-white"
                />
                <CourseInfoPanel
                  label="Current shared catalog"
                  info={item.catalog}
                  accentClass="border-green-200 bg-white"
                />
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onDisregard}
            disabled={isUpdating}
            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-60"
          >
            Disregard
          </button>
          <button
            onClick={onUpdate}
            disabled={isUpdating}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
          >
            {isUpdating ? "Updating…" : "Update now"}
          </button>
        </div>
      </div>
    </div>
  );
}
