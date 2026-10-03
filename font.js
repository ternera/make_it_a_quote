import fs from "fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const font_table = [
  {
    name: "NotoSans",
    url: "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf"
  },
  {
    name: "NotoSans-JP",
    url: "https://github.com/google/fonts/raw/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf"
  }
];

export async function fontCheck() {
  fs.mkdirSync("font/", {recursive: true});
  console.log("[ FONT ] check...");

  for (const font of font_table) {
    const path = `font/${font.name}.ttf`;
    if (!fs.existsSync(path)) {
      console.log(`[ FONT ] Downloading ${font.name}`);
      const f = await fetch(font.url);
      if (!f.ok) {
        console.error(`[ FONT ] Failed ${font.name}`);
        continue;
      }

      await pipeline(Readable.fromWeb(f.body), fs.createWriteStream(path));
      console.log(`[ FONT ] Done`);
    }
  }
}

export function getFontList() {
  let list = [];
  for (const font of font_table) {
    list.push(
      {
        name: font.name,
        path: `font/${font.name}.ttf`
      }
    );
  }
  return list;
}