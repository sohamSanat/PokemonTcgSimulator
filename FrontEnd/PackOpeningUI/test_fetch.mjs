import { fetchJapaneseSeriesDetails } from './src/app/services/scrydex.js';

fetchJapaneseSeriesDetails('sv_ja')
  .then(res => console.log('sv_ja', res.sets.length))
  .catch(console.error);

fetchJapaneseSeriesDetails('swsh_ja')
  .then(res => console.log('swsh_ja', res.sets.length))
  .catch(console.error);
