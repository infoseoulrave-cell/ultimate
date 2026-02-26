import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve, extname, basename } from 'path';

export const SKILL_META = {
  name: 'file_convert',
  description: 'Convert files between formats using ffmpeg, ImageMagick, or pandoc. Supports: video (mp4↔webm↔avi↔gif), audio (mp3↔wav↔flac↔ogg), image (jpg↔png↔webp↔gif), document (md↔html↔pdf).',
  category: 'utility',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input file path' },
      output: { type: 'string', description: 'Output file path (determines target format)' },
      options: { type: 'string', description: 'Optional extra command-line options' },
    },
    required: ['input', 'output'],
  },
};

function cmd(c) { try { return execSync(c, { encoding: 'utf8', timeout: 120000 }).trim(); } catch (e) { return { error: e.stderr || e.message }; } }

export async function execute(args) {
  const input = resolve(args.input);
  const output = resolve(args.output);
  if (!existsSync(input)) return { error: `Input file not found: ${input}` };

  const inExt = extname(input).toLowerCase();
  const outExt = extname(output).toLowerCase();
  const opts = args.options || '';

  const VIDEO = ['.mp4', '.webm', '.avi', '.mkv', '.mov', '.flv', '.gif'];
  const AUDIO = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac', '.opus'];
  const IMAGE = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.svg'];
  const DOC = ['.md', '.html', '.pdf', '.docx', '.txt', '.rst'];

  if ((VIDEO.includes(inExt) || VIDEO.includes(outExt)) || (AUDIO.includes(inExt) && AUDIO.includes(outExt))) {
    const result = cmd(`ffmpeg -y -i "${input}" ${opts} "${output}" 2>&1`);
    if (result?.error) return { error: `ffmpeg failed: ${result.error}` };
    return existsSync(output) ? { ok: true, output, format: outExt } : { error: 'Conversion failed' };
  }

  if (IMAGE.includes(inExt) && IMAGE.includes(outExt)) {
    const hasConvert = cmd('which convert 2>/dev/null');
    if (hasConvert) {
      const result = cmd(`convert "${input}" ${opts} "${output}" 2>&1`);
      if (result?.error) return { error: `ImageMagick failed: ${result.error}` };
    } else {
      const result = cmd(`ffmpeg -y -i "${input}" ${opts} "${output}" 2>&1`);
      if (result?.error) return { error: `ffmpeg image convert failed: ${result.error}` };
    }
    return existsSync(output) ? { ok: true, output, format: outExt } : { error: 'Conversion failed' };
  }

  if (DOC.includes(inExt) && DOC.includes(outExt)) {
    const hasPandoc = cmd('which pandoc 2>/dev/null');
    if (hasPandoc) {
      const result = cmd(`pandoc "${input}" -o "${output}" ${opts} 2>&1`);
      if (result?.error) return { error: `pandoc failed: ${result.error}` };
      return existsSync(output) ? { ok: true, output, format: outExt } : { error: 'Conversion failed' };
    }
    return { error: 'pandoc not installed. Run: apt install pandoc' };
  }

  return { error: `Unsupported conversion: ${inExt} → ${outExt}` };
}
