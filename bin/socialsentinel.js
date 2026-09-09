#!/usr/bin/env node

/**
 * SocialSentinel — Executable CLI Entry Point
 */

import { createCli } from '../src/cli.js';

const program = createCli();
program.parse(process.argv);
