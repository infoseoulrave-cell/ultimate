import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadedSkills = new Map();

export async function loadSkills() {
  const skillDir = __dirname;
  const files = readdirSync(skillDir).filter(f => f.endsWith('.skill.js'));

  for (const file of files) {
    try {
      const mod = await import(join(skillDir, file));
      if (mod.SKILL_META && mod.execute) {
        loadedSkills.set(mod.SKILL_META.name, {
          meta: mod.SKILL_META,
          execute: mod.execute,
        });
      }
    } catch (e) {
      console.error(`Skill load error (${file}):`, e.message);
    }
  }
  return loadedSkills;
}

export function getSkillDefinitions() {
  return Array.from(loadedSkills.values()).map(s => ({
    type: 'function',
    function: {
      name: `skill_${s.meta.name}`,
      description: s.meta.description,
      parameters: s.meta.parameters || { type: 'object', properties: {} },
    },
  }));
}

export async function runSkill(name, args, ctx) {
  const skillName = name.replace(/^skill_/, '');
  const skill = loadedSkills.get(skillName);
  if (!skill) return { error: `Skill not found: ${skillName}. Available: ${Array.from(loadedSkills.keys()).join(', ')}` };
  try {
    return await skill.execute(args, ctx);
  } catch (e) {
    return { error: `Skill ${skillName} failed: ${e.message}` };
  }
}

export function listSkills() {
  return Array.from(loadedSkills.entries()).map(([name, s]) => ({
    name, description: s.meta.description, category: s.meta.category || 'general',
  }));
}
