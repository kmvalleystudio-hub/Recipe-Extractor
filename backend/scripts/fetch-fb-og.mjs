import { fetchFacebookOpenGraph } from '../src/utils/facebook.ts';

const url = 'https://www.facebook.com/reel/1312202584438864';
const og = await fetchFacebookOpenGraph(url);
console.log(JSON.stringify(og, null, 2));
