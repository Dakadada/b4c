import assert from 'node:assert/strict';
import {summarizeIntervals} from '../js/performance-probe.js';
assert.equal(summarizeIntervals([]).passes,false);
assert.deepEqual(summarizeIntervals(Array(100).fill(16.67)),{samples:100,median:16.67,p95:16.67,over25Percent:0,passes:true});
assert.equal(summarizeIntervals([...Array(94).fill(16),...Array(6).fill(30)]).passes,false);
assert.equal(summarizeIntervals(Array(100).fill(20)).passes,false);
console.log('PASS: per-chapter interval thresholds, empty sample handling, median and tail failures.');
