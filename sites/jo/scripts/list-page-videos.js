/**
 * sites/jo 아래 SNS 폴더(meta, gdn, danggun, hogang, lms, blog)를 읽어
 * 각 폴더의 mp4 파일명을 순서대로 list.json으로 저장합니다.
 * 사용: node list-page-videos.js (sites/jo/scripts 폴더에서)
 *   또는: node sites/jo/scripts/list-page-videos.js (프로젝트 루트에서)
 */
const fs = require('fs');
const path = require('path');

const JO_ROOT = path.resolve(__dirname, '..');
const FOLDERS = ['meta', 'gdn', 'danggun', 'hogang', 'lms', 'blog'];

FOLDERS.forEach(function (folder) {
  const dir = path.join(JO_ROOT, folder);
  let list = [];
  try {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      console.log('Skip (no dir):', folder);
      return;
    }
    const files = fs.readdirSync(dir);
    list = files
      .filter(function (f) {
        return f.toLowerCase().endsWith('.mp4');
      })
      .sort(function (a, b) {
        return a.localeCompare(b, undefined, { numeric: true });
      });
  } catch (e) {
    console.error(folder, e.message);
  }
  const outPath = path.join(dir, 'list.json');
  fs.writeFileSync(outPath, JSON.stringify(list, null, 2), 'utf8');
  console.log(folder + ': ' + list.length + ' mp4 -> ' + outPath);
});
