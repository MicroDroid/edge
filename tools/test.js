#!/usr/bin/env node

'use strict';

/* eslint-env node */

const {
  statSync, readdirSync, existsSync,
  promises: { readFile },
} = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const { error, log } = console;

const RegExpEscape = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');

if (!require('../config').exposeBinding) {
  error('ivan must be configured with --expose-binding to run tests');
  process.exit(1);
}

const readdirRecursive = (root, files = [], prefix = '') => {
  const dir = path.resolve(root, prefix);
  if (!existsSync(dir)) {
    return files;
  }
  if (statSync(dir).isDirectory()) {
    readdirSync(dir)
      .filter((n) => n.startsWith('test') && n.endsWith('.js'))
      .forEach((n) => readdirRecursive(root, files, path.join(prefix, n)));
  } else {
    files.push(dir);
  }

  return files;
};

const tests = readdirRecursive(path.resolve(process.cwd(), process.argv[2]));
const ivan = path.resolve(__dirname, '..', 'out', 'ivan');

log(`-- Queued ${tests.length} tests --`);

async function exec(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args);
    let output = '';
    child.stdout.on('data', (d) => {
      output += d;
    });
    child.stderr.on('data', (d) => {
      output += d;
    });
    child.on('close', (code) => {
      resolve({ code, output });
    });
  });
}

tests.forEach(async (filename) => {
  const rel = path.relative(process.cwd(), filename);
  const isMessageTest = /\/test\/message\//.test(filename);

  let { code, output } = await exec(ivan, [filename]);

  if (isMessageTest) {
    const patterns = (await readFile(filename.replace('.js', '.out'), 'utf8'))
      .split('\n')
      .map((line) => {
        const pattern = RegExpEscape(line.trimRight()).replace(/\\\*/g, '.*');
        return new RegExp(`^${pattern}$`);
      });

    const outlines = output.split('\n');

    patterns.forEach((expected, index) => {
      const actual = outlines[index];
      if (expected.test(actual)) {
        return;
      }

      error('match failed');
      error(`line=${index + 1}`);
      error(`expect=${expected}`);
      error(`actual=${actual}`);
      code = -1;
    });
  }

  if (code < 0) {
    error('FAIL', rel);
    error(output);
    error('Command:', `${ivan} ${filename}`);

    return;
  }

  log('PASS', rel);
});
