/**
 * Seminar intro/recording streams must stay same-origin in the browser.
 * Cross-origin calls to api.* → redirect → msg fail intermittently in some browsers.
 */
export function getSeminarIntroStreamUrl(seminarId: string | number): string {
  const id = encodeURIComponent(String(seminarId));
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/Service/Seminar/StreamIntro?seminarId=${id}`;
  }
  const api =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https://api.arkasoftware.ir' : 'http://127.0.0.1:5000');
  try {
    const origin = new URL(api.includes('://') ? api : `https://${api}`).origin;
    return `${origin}/api/Service/Seminar/StreamIntro?seminarId=${id}`;
  } catch {
    return `https://api.arkasoftware.ir/api/Service/Seminar/StreamIntro?seminarId=${id}`;
  }
}

export function getSeminarRecordingStreamUrl(seminarId: string | number): string {
  const id = encodeURIComponent(String(seminarId));
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/Service/Seminar/StreamRecording?seminarId=${id}`;
  }
  const api =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? 'https://api.arkasoftware.ir' : 'http://127.0.0.1:5000');
  try {
    const origin = new URL(api.includes('://') ? api : `https://${api}`).origin;
    return `${origin}/api/Service/Seminar/StreamRecording?seminarId=${id}`;
  } catch {
    return `https://api.arkasoftware.ir/api/Service/Seminar/StreamRecording?seminarId=${id}`;
  }
}
