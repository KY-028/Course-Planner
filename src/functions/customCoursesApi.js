import axios from "axios";
import { authRequestConfig } from "./authToken";

/** courseInfo layout: [code, title, prof, [locations], ...sessionStrings] */
export function formatCourseInfoForDisplay(info) {
  if (!Array.isArray(info) || info.length < 4) {
    return { code: "—", title: "—", professor: "—", sessions: ["No schedule on file"] };
  }

  const sessions = info.slice(4);
  if (sessions.length === 0) {
    return {
      code: info[0] || "—",
      title: info[1] || "—",
      professor: info[2] || "—",
      sessions: ["Online / no scheduled times"],
    };
  }

  return {
    code: info[0] || "—",
    title: info[1] || "—",
    professor: info[2] || "—",
    sessions: sessions.map((session) => {
      const parts = String(session).split(" ");
      const day = parts[2] || "";
      const time = parts[3] || "";
      return `${day} ${time}`.trim() || String(session);
    }),
  };
}

export async function searchCustomCourses(apiUrl, { term, q, limit = 20 }) {
  const params = { term, limit };
  if (q && String(q).trim().length >= 2) {
    params.q = String(q).trim();
  }
  const res = await axios.get(`${apiUrl}/backend/customCourses/search`, { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function getCustomCourse(apiUrl, courseId, term) {
  const res = await axios.get(`${apiUrl}/backend/customCourses/${encodeURIComponent(courseId)}`, {
    params: { term },
  });
  return res.data;
}

export async function addCustomCourse(apiUrl, { userId, term, courseId, courseInfo }) {
  const res = await axios.post(
    `${apiUrl}/backend/customCourses/`,
    {
      user_id: userId,
      term,
      course_id: courseId,
      course_info: courseInfo,
    },
    authRequestConfig()
  );
  return res.data;
}

export async function fetchCustomCourseMismatches(apiUrl, userId) {
  const res = await axios.get(`${apiUrl}/backend/customCourses/mismatches/${userId}`, authRequestConfig());
  return Array.isArray(res.data) ? res.data : [];
}
