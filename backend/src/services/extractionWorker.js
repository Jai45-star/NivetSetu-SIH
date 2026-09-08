import fs from 'node:fs/promises';
import { StorageService } from './storageService.js';
process.once('message', async ({ storedName, mimeType }) => {
  let parser, worker;
  try {
    const buffer = await fs.readFile(StorageService.getFilePath(storedName));
    let text, confidence = 'high', method;
    if (mimeType === 'application/pdf') {
      const { PDFParse } = await import('pdf-parse');
      parser = new PDFParse({ data: new Uint8Array(buffer), isEvalSupported: false });
      const info = await parser.getInfo();
      if (info.total > 30) throw new Error('Page limit');
      const result = await parser.getText();
      text = result.text; method = 'pdf_text';
    } else {
      const { createWorker } = await import('tesseract.js');
      const { default: language } = await import('@tesseract.js-data/eng');
      worker = await createWorker('eng', 1, { langPath: language.langPath, gzip: true, cacheMethod: 'none' });
      const { data } = await worker.recognize(buffer);
      text = data.text; confidence = data.confidence >= 85 ? 'high' : data.confidence >= 65 ? 'medium' : 'low'; method = 'image_ocr';
    }
    if (text.length > 120000) throw new Error('Text limit');
    process.send({ success: true, text, confidence, method });
  } catch {
    process.send({ success: false });
  } finally {
    await parser?.destroy().catch(() => {});
    await worker?.terminate().catch(() => {});
    process.disconnect();
  }
});
