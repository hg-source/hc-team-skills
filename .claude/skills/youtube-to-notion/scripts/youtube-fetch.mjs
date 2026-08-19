/**
 * YouTube 영상 메타데이터 + 자막 추출
 * Usage: node youtube-fetch.mjs <youtube-url>
 */
import { Innertube } from 'youtubei.js';
import TranscriptClient from 'youtube-transcript-api';

const url = process.argv[2];
if (!url) {
  console.error(JSON.stringify({ error: 'YouTube URL을 입력하세요' }));
  process.exit(1);
}

function extractVideoId(url) {
  const patterns = [
    /[?&]v=([^&\s]{11})/,
    /youtu\.be\/([^?&\s]{11})/,
    /embed\/([^?&\s]{11})/,
    /shorts\/([^?&\s]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getTranscript(videoId) {
  try {
    const client = new TranscriptClient();
    await client.ready;
    const data = await client.fetch(videoId, { lang: 'ko' });
    return data.map(t => t.text).join(' ');
  } catch {
    try {
      const client = new TranscriptClient();
      await client.ready;
      const data = await client.fetch(videoId);
      return data.map(t => t.text).join(' ');
    } catch (e) {
      return null;
    }
  }
}

async function main() {
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error(JSON.stringify({ error: '유효하지 않은 YouTube URL' }));
    process.exit(1);
  }

  try {
    const yt = await Innertube.create({ retrieve_player: false });
    const info = await yt.getBasicInfo(videoId);
    const basic = info.basic_info;

    const durationSec = basic.duration ?? 0;
    const durationMin = Math.round(durationSec / 60);

    const transcript = await getTranscript(videoId);

    const result = {
      videoId,
      title: basic.title ?? '',
      channel: basic.channel?.name ?? basic.author ?? '',
      durationMin,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      url,
      transcript: transcript ?? '자막 없음',
      hasTranscript: transcript !== null,
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(JSON.stringify({ error: e.message }));
    process.exit(1);
  }
}

main();
