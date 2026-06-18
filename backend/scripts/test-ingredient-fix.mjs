import {
  isTimeDurationPhrase,
  stripLeadingTimeDuration,
  fixCommonIngredientTypos,
  normalizeIngredientText,
} from '../src/utils/ingredientDedupe.ts';

console.log('time only:', isTimeDurationPhrase('1 hour'));
console.log('strip name:', stripLeadingTimeDuration('1 hour soy sauce'));
console.log('typo:', fixCommonIngredientTypos('papioka starch'));
console.log('normalize:', normalizeIngredientText('1 hour cooking wine'));
