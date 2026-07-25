import { Buffer } from "node:buffer";

type ZipEntry = {
  content: string;
  name: string;
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(value: Buffer) {
  let checksum = 0xffffffff;
  for (const byte of value) {
    checksum = crcTable[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const content = Buffer.from(entry.content, "utf8");
    const checksum = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x21, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x21, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHeader, name);

    localOffset += localHeader.length + name.length + content.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function paragraph(text: string) {
  return `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`;
}

function eventTable(text: string) {
  return `<w:tbl><w:tr><w:tc><w:p/></w:tc><w:tc>${paragraph(text)}</w:tc></w:tr></w:tbl>`;
}

function transcriptTurn(speaker: string, timestamp: string, text: string) {
  return [
    "<w:tbl><w:tr><w:tc><w:p/></w:tc><w:tc>",
    "<w:p>",
    `<w:r><w:rPr><w:b/></w:rPr><w:t>${speaker}</w:t></w:r>`,
    `<w:r><w:t xml:space="preserve">  ${timestamp}</w:t></w:r>`,
    "</w:p>",
    paragraph(text),
    "</w:tc></w:tr></w:tbl>",
  ].join("");
}

export const templatedTranscript = {
  firstTurn: "Please send a secure message about your parent's medication.",
  secondTurn: "I am looking for Messages. I want to confirm I am in my mother's account.",
};

export function createTemplatedTranscriptDocx() {
  const documentXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    "<w:body>",
    paragraph("Session S003 - Meeting Recording"),
    paragraph("July 10, 2026"),
    paragraph("44m 0s"),
    eventTable("Maya Chen started transcription"),
    transcriptTurn("Maya Chen", "0:00", templatedTranscript.firstTurn),
    transcriptTurn("Tanya", "3:06", templatedTranscript.secondTurn),
    eventTable("Maya Chen stopped transcription"),
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>',
    "</w:body>",
    "</w:document>",
  ].join("");

  return createZip([
    {
      name: "[Content_Types].xml",
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
        "</Types>",
      ].join(""),
    },
    {
      name: "_rels/.rels",
      content: [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
        "</Relationships>",
      ].join(""),
    },
    {
      name: "word/document.xml",
      content: documentXml,
    },
  ]);
}
