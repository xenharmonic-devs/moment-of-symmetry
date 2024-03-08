import {tamnamsInfo} from '../src';

for (let size = 11; size <= 24; ++size) {
  console.log(`!colspan=3| ${size}-note mosses`);
  console.log('|-');
  console.log('! Pattern !! Name !! Prefix');
  console.log('|-');
  for (let l = 1; l < size; ++l) {
    const info = tamnamsInfo(l, size - l);
    if (info === undefined) continue;
    console.log(
      `| [[${l}L ${size - l}s]] ||`,
      info?.name || "''none''",
      '||',
      info?.prefix || "''none''"
    );
    console.log('|-');
  }
}
