import { execSync } from 'child_process';
import { cpus, totalmem, freemem, hostname, platform, release, uptime, networkInterfaces } from 'os';

export const SKILL_META = {
  name: 'system_info',
  description: 'Get local system information: CPU, memory, disk, network, processes, OS details. Actions: overview, disk, network, processes, ports.',
  category: 'system',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['overview', 'disk', 'network', 'processes', 'ports'], description: 'What info to get' },
    },
    required: ['action'],
  },
};

function cmd(c) { try { return execSync(c, { encoding: 'utf8', timeout: 5000 }).trim(); } catch (_) { return ''; } }

export async function execute(args) {
  switch (args.action) {
    case 'overview': {
      const cpu = cpus();
      return {
        ok: true,
        hostname: hostname(),
        platform: platform(),
        release: release(),
        uptime: `${Math.round(uptime() / 3600)}h`,
        cpu: { model: cpu[0]?.model, cores: cpu.length },
        memory: {
          total: `${Math.round(totalmem() / 1024 / 1024 / 1024 * 10) / 10}GB`,
          free: `${Math.round(freemem() / 1024 / 1024 / 1024 * 10) / 10}GB`,
          used: `${Math.round((totalmem() - freemem()) / 1024 / 1024 / 1024 * 10) / 10}GB`,
        },
        nodeVersion: process.version,
      };
    }
    case 'disk': return { ok: true, output: cmd('df -h 2>/dev/null') || 'N/A' };
    case 'network': {
      const nets = networkInterfaces();
      const interfaces = {};
      for (const [name, addrs] of Object.entries(nets)) {
        interfaces[name] = addrs.filter(a => !a.internal).map(a => ({ address: a.address, family: a.family }));
      }
      return { ok: true, interfaces };
    }
    case 'processes': return { ok: true, output: cmd('ps aux --sort=-%mem | head -15 2>/dev/null') || 'N/A' };
    case 'ports': return { ok: true, output: cmd('ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null') || 'N/A' };
    default: return { error: 'Unknown action' };
  }
}
