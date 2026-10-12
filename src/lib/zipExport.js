/**
 * Zero-dependency pure JS ZIP Archive builder (PKZIP 2.0 Store format)
 * Generates valid .zip files in the browser without requiring external npm packages.
 */

// CRC-32 table generator
const makeCrcTable = () => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
};

const crcTable = makeCrcTable();

const crc32 = (bytes) => {
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

const encodeText = (str) => new TextEncoder().encode(str);

/**
 * Creates and downloads a .zip archive from an array of files.
 * @param {Array<{ name: string, content: string }>} files
 * @param {string} zipFileName
 */
export function downloadZipBundle(files, zipFileName = 'vibe-bundle.zip') {
  const parts = [];
  const centralDir = [];
  let offset = 0;

  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;

  files.forEach((file) => {
    const nameBytes = encodeText(file.name);
    const dataBytes = encodeText(file.content);
    const size = dataBytes.length;
    const fileCrc = crc32(dataBytes);

    // Local file header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lView = new DataView(localHeader.buffer);
    lView.setUint32(0, 0x04034b50, true); // Local file header signature
    lView.setUint16(4, 20, true);         // Version needed (2.0)
    lView.setUint16(6, 0, true);          // General purpose bit flag
    lView.setUint16(8, 0, true);          // Compression method (0 = store)
    lView.setUint16(10, dosTime, true);   // Mod time
    lView.setUint16(12, dosDate, true);   // Mod date
    lView.setUint32(14, fileCrc, true);   // CRC-32
    lView.setUint32(18, size, true);      // Compressed size
    lView.setUint32(22, size, true);      // Uncompressed size
    lView.setUint16(26, nameBytes.length, true); // File name length
    lView.setUint16(28, 0, true);         // Extra field length
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(dataBytes);

    // Central directory header (46 bytes + name length)
    const cdHeader = new Uint8Array(46 + nameBytes.length);
    const cView = new DataView(cdHeader.buffer);
    cView.setUint32(0, 0x02014b50, true); // Central directory signature
    cView.setUint16(4, 20, true);         // Version made by (2.0)
    cView.setUint16(6, 20, true);         // Version needed
    cView.setUint16(8, 0, true);          // Flag
    cView.setUint16(10, 0, true);         // Method (store)
    cView.setUint16(12, dosTime, true);   // Mod time
    cView.setUint16(14, dosDate, true);   // Mod date
    cView.setUint32(16, fileCrc, true);   // CRC-32
    cView.setUint32(20, size, true);      // Compressed size
    cView.setUint32(24, size, true);      // Uncompressed size
    cView.setUint16(28, nameBytes.length, true); // File name length
    cView.setUint16(30, 0, true);         // Extra field length
    cView.setUint16(32, 0, true);         // Comment length
    cView.setUint16(34, 0, true);         // Disk number start
    cView.setUint16(36, 0, true);         // Internal file attributes
    cView.setUint32(38, 0, true);         // External file attributes
    cView.setUint32(42, offset, true);    // Relative offset of local header
    cdHeader.set(nameBytes, 46);

    centralDir.push(cdHeader);

    offset += localHeader.length + dataBytes.length;
  });

  const cdOffset = offset;
  let cdSize = 0;
  centralDir.forEach((hdr) => {
    cdSize += hdr.length;
    parts.push(hdr);
  });

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true);  // EOCD signature
  eView.setUint16(4, 0, true);          // Disk number
  eView.setUint16(6, 0, true);          // Start disk
  eView.setUint16(8, files.length, true); // Total entries this disk
  eView.setUint16(10, files.length, true);// Total entries overall
  eView.setUint32(12, cdSize, true);    // Central directory size
  eView.setUint32(16, cdOffset, true);  // Offset of central directory
  eView.setUint16(20, 0, true);         // Comment length

  parts.push(eocd);

  // Trigger browser download
  const blob = new Blob(parts, { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
