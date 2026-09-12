/**
 * 把解压后的 Office 文档目录（docx / xlsx）重新打包为对应文件。
 *
 * 为什么不用 PowerShell 的 Compress-Archive：
 *   它会生成「反斜杠」路径的 zip 条目（word\document.xml），Word/Excel 无法识别。
 *   本脚本手写 zip（本地文件头 + 中央目录 + EOCD，UTF-8 标志 0x0800，路径用正斜杠）。
 *
 * 用法：
 *   node scripts/docx-pack.js <解压目录> <输出文件>
 * 例：
 *   node scripts/docx-pack.js _tmp_doc1 "source/官方投诉维权渠道大全（合并版·最终版）.docx"
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function collect(dir, base, out) {
  const items = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  for (const e of items) {
    const full = path.join(dir, e.name);
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory()) collect(full, rel, out);
    else out.push({ name: rel, data: fs.readFileSync(full) });
  }
}

function zipDir(dir) {
  const entries = [];
  collect(dir, '', entries);
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, 'utf8');
    const raw = e.data;
    const crc = crc32(raw);
    let data = raw;
    let method = 0;
    if (raw.length > 0) {
      const comp = zlib.deflateRawSync(raw, { level: 9 });
      if (comp.length < raw.length) { data = comp; method = 8; }
    }

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6);
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(data.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    chunks.push(lh, nameBuf, data);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(data.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, nameBuf);

    offset += 30 + nameBuf.length + data.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return { buffer: Buffer.concat([...chunks, centralBuf, eocd]), count: entries.length };
}

if (require.main === module) {
  const [dir, out] = process.argv.slice(2);
  if (!dir || !out) {
    console.log('用法: node scripts/docx-pack.js <解压目录> <输出文件>');
    process.exit(1);
  }
  const r = zipDir(dir);
  fs.writeFileSync(out, r.buffer);
  console.log('打包完成: ' + out + ' | 条目数=' + r.count + ' | 大小=' + r.buffer.length);
}

module.exports = { zipDir, crc32 };
