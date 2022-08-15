import {tamnamsInfo} from '../src';

for (let size = 2; size <= 22; ++size) {
  console.log(`!colspan=3| ${size}-note mosses`);
  console.log('|-');
  console.log('! Pattern !! Name !! Stem');
  console.log('|-');
  for (let l = 1; l < size; ++l) {
    const info = tamnamsInfo(l, size - l);
    console.log(
      `| [[${l}L ${size - l}s]] ||`,
      info?.name || "''none''",
      '||',
      info?.familyPrefix || "''none''"
    );
    console.log('|-');
  }
}
