import { spawn } from 'node:child_process'
import { stderr, stdout } from 'node:process';
import { Readable } from 'node:stream';
import { fix } from './ts';

const cwd = '.'
const start = spawn('nest', ['start', '--watch'])

start.stdout.pipe(stdout)
start.stderr.pipe(stderr)

start.stderr.on('data', (r: Readable) => {
  const data = r.toString()

  if (!data.startsWith('Error')) return

  fix(cwd, data)
});

start.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

