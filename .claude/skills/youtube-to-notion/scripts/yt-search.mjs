import { Innertube } from 'youtubei.js';

const query = process.argv[2] ?? '';
const yt = await Innertube.create({ retrieve_player: false });
const results = await yt.search(query, { type: 'video', sort_by: 'relevance' });

const videos = results.videos.slice(0, 10).map(v => ({
  id: v.id,
  title: v.title?.text ?? '',
  channel: v.author?.name ?? '',
  views: v.view_count?.text ?? '',
  duration: v.duration?.text ?? '',
  url: `https://www.youtube.com/watch?v=${v.id}`
}));

console.log(JSON.stringify(videos, null, 2));
