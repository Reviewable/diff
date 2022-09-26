/**
 * Diff Match and Patch -- Test Harness
 * Copyright 2018 The diff-match-patch Authors.
 * https://github.com/google/diff-match-patch
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// If expected and actual are the equivalent, pass the test.
function assertEquivalent(msg, expected, actual) {
  if (typeof actual == 'undefined') {
    // msg is optional.
    actual = expected;
    expected = msg;
    msg = 'Expected: \'' + expected + '\' Actual: \'' + actual + '\'';
  }
  if (_equivalent(expected, actual)) {
    return assertEquals(msg, String(expected), String(actual));
  } else {
    return assertEquals(msg, expected, actual);
  }
}


// Are a and b the equivalent? -- Recursive.
function _equivalent(a, b) {
  if (a == b) {
    return true;
  }
  if (typeof a == 'object' && typeof b == 'object' && a !== null && b !== null) {
    if (a.toString() != b.toString()) {
      return false;
    }
    for (var p in a) {
      if (a.hasOwnProperty(p) && !_equivalent(a[p], b[p])) {
        return false;
      }
    }
    for (var p in b) {
      if (a.hasOwnProperty(p) && !_equivalent(a[p], b[p])) {
        return false;
      }
    }
    return true;
  }
  return false;
}


function diff_rebuildtexts(diffs) {
  // Construct the two texts which made up the diff originally.
  var text1 = '';
  var text2 = '';
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] != DIFF_INSERT) {
      text1 += diffs[x][1];
    }
    if (diffs[x][0] != DIFF_DELETE) {
      text2 += diffs[x][1];
    }
  }
  return [text1, text2];
}

var dmp = new diff();


// DIFF TEST FUNCTIONS


function testDiffCommonPrefix() {
  // Detect any common prefix.
  // Null case.
  assertEquals(0, dmp.diff_commonPrefix('abc', 'xyz'));

  // Non-null case.
  assertEquals(4, dmp.diff_commonPrefix('1234abcdef', '1234xyz'));

  // Whole case.
  assertEquals(4, dmp.diff_commonPrefix('1234', '1234xyz'));
}

function testDiffCommonPrefixNewLine() {
  // Detect any common prefix in repsect to new lines.
  // Null case.
  assertEquals(0, dmp.diff_commonPrefix_newLine('abc', 'abx'));

  // Non-null case.
  assertEquals(3, dmp.diff_commonPrefix_newLine('12\n34abcdef', '12\n34xyz'));

  // Multiply \n case.
  assertEquals(6, dmp.diff_commonPrefix_newLine('12\n34\n1abcdef', '12\n34\n1xyz'));

  // Whole case.
  assertEquals(4, dmp.diff_commonPrefix_newLine('1234', '1234\nxyz'));
  assertEquals(0, dmp.diff_commonPrefix_newLine('1234', '12345\nxyz'));
}

function testDiffCommonSuffix() {
  // Detect any common suffix.
  // Null case.
  assertEquals(0, dmp.diff_commonSuffix('abc', 'xyz'));

  // Non-null case.
  assertEquals(4, dmp.diff_commonSuffix('abcdef1234', 'xyz1234'));

  // Whole case.
  assertEquals(4, dmp.diff_commonSuffix('1234', 'xyz1234'));
}

function testDiffCommonSuffixNewLine() {
  // Detect any common suffix in respect to new lines.
  // Null case.
  assertEquals(0, dmp.diff_commonSuffix_newLine('abc', 'xbc'));

  // Non-null case.
  assertEquals(3, dmp.diff_commonSuffix_newLine('abcdef12\n34', 'xyz12\n34'));

  // Multiply \n case.
  assertEquals(6, dmp.diff_commonSuffix_newLine('abcdef1\n12\n34', 'xyz1\n12\n34'));

  // Whole case.
  assertEquals(4, dmp.diff_commonSuffix_newLine('1234', 'xyz\n1234'));
  assertEquals(0, dmp.diff_commonSuffix_newLine('1234', 'xyz\n01234'));
}

function testDiffCommonOverlap() {
  // Detect any suffix/prefix overlap.
  // Null case.
  assertEquals(0, dmp.diff_commonOverlap_('', 'abcd'));

  // Whole case.
  assertEquals(3, dmp.diff_commonOverlap_('abc', 'abcd'));

  // No overlap.
  assertEquals(0, dmp.diff_commonOverlap_('123456', 'abcd'));

  // Overlap.
  assertEquals(3, dmp.diff_commonOverlap_('123456xxx', 'xxxabcd'));

  // Unicode.
  // Some overly clever languages (C#) may treat ligatures as equal to their
  // component letters.  E.g. U+FB01 == 'fi'
  assertEquals(0, dmp.diff_commonOverlap_('fi', '\ufb01i'));
}

function testDiffHalfMatch() {
  // Detect a halfmatch.
  dmp.Diff_Timeout = 1;
  // No match.
  assertEquals(null, dmp.diff_halfMatch_('1234567890', 'abcdef'));

  assertEquals(null, dmp.diff_halfMatch_('12345', '23'));

  // Single Match.
  assertEquivalent(['12', '90', 'a', 'z', '345678'], dmp.diff_halfMatch_('1234567890', 'a345678z'));

  assertEquivalent(['a', 'z', '12', '90', '345678'], dmp.diff_halfMatch_('a345678z', '1234567890'));

  assertEquivalent(['abc', 'z', '1234', '0', '56789'], dmp.diff_halfMatch_('abc56789z', '1234567890'));

  assertEquivalent(['a', 'xyz', '1', '7890', '23456'], dmp.diff_halfMatch_('a23456xyz', '1234567890'));

  // Multiple Matches.
  assertEquivalent(['12123', '123121', 'a', 'z', '1234123451234'], dmp.diff_halfMatch_('121231234123451234123121', 'a1234123451234z'));

  assertEquivalent(['', '-=-=-=-=-=', 'x', '', 'x-=-=-=-=-=-=-='], dmp.diff_halfMatch_('x-=-=-=-=-=-=-=-=-=-=-=-=', 'xx-=-=-=-=-=-=-='));

  assertEquivalent(['-=-=-=-=-=', '', '', 'y', '-=-=-=-=-=-=-=y'], dmp.diff_halfMatch_('-=-=-=-=-=-=-=-=-=-=-=-=y', '-=-=-=-=-=-=-=yy'));

  // Non-optimal halfmatch.
  // Optimal diff would be -q+x=H-i+e=lloHe+Hu=llo-Hew+y not -qHillo+x=HelloHe-w+Hulloy
  assertEquivalent(['qHillo', 'w', 'x', 'Hulloy', 'HelloHe'], dmp.diff_halfMatch_('qHilloHelloHew', 'xHelloHeHulloy'));

  // Optimal no halfmatch.
  dmp.Diff_Timeout = 0;
  assertEquals(null, dmp.diff_halfMatch_('qHilloHelloHew', 'xHelloHeHulloy'));
}

function testDiffLinesToChars() {
  function assertLinesToCharsResultEquals(a, b) {
    assertEquals(a.chars1, b.chars1);
    assertEquals(a.chars2, b.chars2);
    assertEquivalent(a.lineArray, b.lineArray);
  }

  // Convert lines down to characters.
  assertLinesToCharsResultEquals({chars1: '\x01\x02\x01', chars2: '\x02\x01\x02', lineArray: ['', 'alpha\n', 'beta\n']}, dmp.diff_linesToChars_('alpha\nbeta\nalpha\n', 'beta\nalpha\nbeta\n'));

  assertLinesToCharsResultEquals({chars1: '', chars2: '\x01\x02\x03\x03', lineArray: ['', 'alpha\r\n', 'beta\r\n', '\r\n']}, dmp.diff_linesToChars_('', 'alpha\r\nbeta\r\n\r\n\r\n'));

  assertLinesToCharsResultEquals({chars1: '\x01', chars2: '\x02', lineArray: ['', 'a', 'b']}, dmp.diff_linesToChars_('a', 'b'));

  // More than 256 to reveal any 8-bit limitations.
  var n = 300;
  var lineList = [];
  var charList = [];
  for (var i = 1; i < n + 1; i++) {
    lineList[i - 1] = i + '\n';
    charList[i - 1] = String.fromCharCode(i);
  }
  assertEquals(n, lineList.length);
  var lines = lineList.join('');
  var chars = charList.join('');
  assertEquals(n, chars.length);
  lineList.unshift('');
  assertLinesToCharsResultEquals({chars1: chars, chars2: '', lineArray: lineList}, dmp.diff_linesToChars_(lines, ''));
}

function testDiffCharsToLines() {
  // Convert chars up to lines.
  var diffs = [[DIFF_EQUAL, '\x01\x02\x01'], [DIFF_INSERT, '\x02\x01\x02']];
  dmp.diff_charsToLines_(diffs, ['', 'alpha\n', 'beta\n']);
  assertEquivalent([[DIFF_EQUAL, 'alpha\nbeta\nalpha\n'], [DIFF_INSERT, 'beta\nalpha\nbeta\n']], diffs);

  // More than 256 to reveal any 8-bit limitations.
  var n = 300;
  var lineList = [];
  var charList = [];
  for (var i = 1; i < n + 1; i++) {
    lineList[i - 1] = i + '\n';
    charList[i - 1] = String.fromCharCode(i);
  }
  assertEquals(n, lineList.length);
  var lines = lineList.join('');
  var chars = charList.join('');
  assertEquals(n, chars.length);
  lineList.unshift('');
  var diffs = [[DIFF_DELETE, chars]];
  dmp.diff_charsToLines_(diffs, lineList);
  assertEquivalent([[DIFF_DELETE, lines]], diffs);

  // More than 65536 to verify any 16-bit limitation.
  lineList = [];
  for (var i = 0; i < 66000; i++) {
    lineList[i] = i + '\n';
  }
  chars = lineList.join('');
  var results = dmp.diff_linesToChars_(chars, '');
  diffs = [[DIFF_INSERT, results.chars1]];
  dmp.diff_charsToLines_(diffs, results.lineArray);
  assertEquals(chars, diffs[0][1]);
}

function testDiffCleanupMerge() {
  // Cleanup a messy diff.
  // Null case.
  var diffs = [];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([], diffs);

  // No change case.
  diffs = [[DIFF_EQUAL, 'a'], [DIFF_DELETE, 'b'], [DIFF_INSERT, 'c']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_EQUAL, 'a'], [DIFF_DELETE, 'b'], [DIFF_INSERT, 'c']], diffs);

  // Merge equalities.
  diffs = [[DIFF_EQUAL, 'a'], [DIFF_EQUAL, 'b'], [DIFF_EQUAL, 'c']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_EQUAL, 'abc']], diffs);

  // Merge deletions.
  diffs = [[DIFF_DELETE, 'a'], [DIFF_DELETE, 'b'], [DIFF_DELETE, 'c']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_DELETE, 'abc']], diffs);

  // Merge insertions.
  diffs = [[DIFF_INSERT, 'a'], [DIFF_INSERT, 'b'], [DIFF_INSERT, 'c']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_INSERT, 'abc']], diffs);

  // Merge interweave.
  diffs = [[DIFF_DELETE, 'a'], [DIFF_INSERT, 'b'], [DIFF_DELETE, 'c'], [DIFF_INSERT, 'd'], [DIFF_EQUAL, 'e'], [DIFF_EQUAL, 'f']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_DELETE, 'ac'], [DIFF_INSERT, 'bd'], [DIFF_EQUAL, 'ef']], diffs);

  // Prefix and suffix detection.
  diffs = [[DIFF_DELETE, 'a'], [DIFF_INSERT, 'abc'], [DIFF_DELETE, 'dc']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_EQUAL, 'a'], [DIFF_DELETE, 'd'], [DIFF_INSERT, 'b'], [DIFF_EQUAL, 'c']], diffs);

  // Prefix and suffix detection with equalities.
  diffs = [[DIFF_EQUAL, 'x'], [DIFF_DELETE, 'a'], [DIFF_INSERT, 'abc'], [DIFF_DELETE, 'dc'], [DIFF_EQUAL, 'y']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_EQUAL, 'xa'], [DIFF_DELETE, 'd'], [DIFF_INSERT, 'b'], [DIFF_EQUAL, 'cy']], diffs);

  // Slide edit left.
  diffs = [[DIFF_EQUAL, 'a'], [DIFF_INSERT, 'ba'], [DIFF_EQUAL, 'c']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_INSERT, 'ab'], [DIFF_EQUAL, 'ac']], diffs);

  // Slide edit right.
  diffs = [[DIFF_EQUAL, 'c'], [DIFF_INSERT, 'ab'], [DIFF_EQUAL, 'a']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_EQUAL, 'ca'], [DIFF_INSERT, 'ba']], diffs);

  // Slide edit left recursive.
  diffs = [[DIFF_EQUAL, 'a'], [DIFF_DELETE, 'b'], [DIFF_EQUAL, 'c'], [DIFF_DELETE, 'ac'], [DIFF_EQUAL, 'x']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_DELETE, 'abc'], [DIFF_EQUAL, 'acx']], diffs);

  // Slide edit right recursive.
  diffs = [[DIFF_EQUAL, 'x'], [DIFF_DELETE, 'ca'], [DIFF_EQUAL, 'c'], [DIFF_DELETE, 'b'], [DIFF_EQUAL, 'a']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_EQUAL, 'xca'], [DIFF_DELETE, 'cba']], diffs);

  // Empty merge.
  diffs = [[DIFF_DELETE, 'b'], [DIFF_INSERT, 'ab'], [DIFF_EQUAL, 'c']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_INSERT, 'a'], [DIFF_EQUAL, 'bc']], diffs);

  // Empty equality.
  diffs = [[DIFF_EQUAL, ''], [DIFF_INSERT, 'a'], [DIFF_EQUAL, 'b']];
  dmp.diff_cleanupMerge(diffs);
  assertEquivalent([[DIFF_INSERT, 'a'], [DIFF_EQUAL, 'b']], diffs);
}

function testDiffCleanupSemanticLossless() {
  // Slide diffs to match logical boundaries.
  // Null case.
  var diffs = [];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([], diffs);

  // Blank lines.
  diffs = [[DIFF_EQUAL, 'AAA\r\n\r\nBBB'], [DIFF_INSERT, '\r\nDDD\r\n\r\nBBB'], [DIFF_EQUAL, '\r\nEEE']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_EQUAL, 'AAA\r\n\r\n'], [DIFF_INSERT, 'BBB\r\nDDD\r\n\r\n'], [DIFF_EQUAL, 'BBB\r\nEEE']], diffs);

  // Line boundaries.
  diffs = [[DIFF_EQUAL, 'AAA\r\nBBB'], [DIFF_INSERT, ' DDD\r\nBBB'], [DIFF_EQUAL, ' EEE']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_EQUAL, 'AAA\r\n'], [DIFF_INSERT, 'BBB DDD\r\n'], [DIFF_EQUAL, 'BBB EEE']], diffs);

  // Word boundaries.
  diffs = [[DIFF_EQUAL, 'The c'], [DIFF_INSERT, 'ow and the c'], [DIFF_EQUAL, 'at.']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_EQUAL, 'The '], [DIFF_INSERT, 'cow and the '], [DIFF_EQUAL, 'cat.']], diffs);

  // Alphanumeric boundaries.
  diffs = [[DIFF_EQUAL, 'The-c'], [DIFF_INSERT, 'ow-and-the-c'], [DIFF_EQUAL, 'at.']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_EQUAL, 'The-'], [DIFF_INSERT, 'cow-and-the-'], [DIFF_EQUAL, 'cat.']], diffs);

  // Hitting the start.
  diffs = [[DIFF_EQUAL, 'a'], [DIFF_DELETE, 'a'], [DIFF_EQUAL, 'ax']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_DELETE, 'a'], [DIFF_EQUAL, 'aax']], diffs);

  // Hitting the end.
  diffs = [[DIFF_EQUAL, 'xa'], [DIFF_DELETE, 'a'], [DIFF_EQUAL, 'a']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_EQUAL, 'xaa'], [DIFF_DELETE, 'a']], diffs);

  // Sentence boundaries.
  diffs = [[DIFF_EQUAL, 'The xxx. The '], [DIFF_INSERT, 'zzz. The '], [DIFF_EQUAL, 'yyy.']];
  dmp.diff_cleanupSemanticLossless(diffs);
  assertEquivalent([[DIFF_EQUAL, 'The xxx.'], [DIFF_INSERT, ' The zzz.'], [DIFF_EQUAL, ' The yyy.']], diffs);
}

function testDiffCleanupSemantic() {
  // Cleanup semantically trivial equalities.
  // Null case.
  var diffs = [];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([], diffs);

  // No elimination #1.
  diffs = [[DIFF_DELETE, 'ab'], [DIFF_INSERT, 'cd'], [DIFF_EQUAL, '12'], [DIFF_DELETE, 'e']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'ab'], [DIFF_INSERT, 'cd'], [DIFF_EQUAL, '12'], [DIFF_DELETE, 'e']], diffs);

  // No elimination #2.
  diffs = [[DIFF_DELETE, 'abc'], [DIFF_INSERT, 'ABC'], [DIFF_EQUAL, '1234'], [DIFF_DELETE, 'wxyz']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'abc'], [DIFF_INSERT, 'ABC'], [DIFF_EQUAL, '1234'], [DIFF_DELETE, 'wxyz']], diffs);

  // Simple elimination.
  diffs = [[DIFF_DELETE, 'a'], [DIFF_EQUAL, 'b'], [DIFF_DELETE, 'c']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'abc'], [DIFF_INSERT, 'b']], diffs);

  // Backpass elimination.
  diffs = [[DIFF_DELETE, 'ab'], [DIFF_EQUAL, 'cd'], [DIFF_DELETE, 'e'], [DIFF_EQUAL, 'f'], [DIFF_INSERT, 'g']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'abcdef'], [DIFF_INSERT, 'cdfg']], diffs);

  // Multiple eliminations.
  diffs = [[DIFF_INSERT, '1'], [DIFF_EQUAL, 'A'], [DIFF_DELETE, 'B'], [DIFF_INSERT, '2'], [DIFF_EQUAL, '_'], [DIFF_INSERT, '1'], [DIFF_EQUAL, 'A'], [DIFF_DELETE, 'B'], [DIFF_INSERT, '2']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'AB_AB'], [DIFF_INSERT, '1A2_1A2']], diffs);

  // Word boundaries.
  diffs = [[DIFF_EQUAL, 'The c'], [DIFF_DELETE, 'ow and the c'], [DIFF_EQUAL, 'at.']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_EQUAL, 'The '], [DIFF_DELETE, 'cow and the '], [DIFF_EQUAL, 'cat.']], diffs);

  // No overlap elimination.
  diffs = [[DIFF_DELETE, 'abcxx'], [DIFF_INSERT, 'xxdef']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'abcxx'], [DIFF_INSERT, 'xxdef']], diffs);

  // Overlap elimination.
  diffs = [[DIFF_DELETE, 'abcxxx'], [DIFF_INSERT, 'xxxdef']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'abc'], [DIFF_EQUAL, 'xxx'], [DIFF_INSERT, 'def']], diffs);

  // Reverse overlap elimination.
  diffs = [[DIFF_DELETE, 'xxxabc'], [DIFF_INSERT, 'defxxx']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_INSERT, 'def'], [DIFF_EQUAL, 'xxx'], [DIFF_DELETE, 'abc']], diffs);

  // Two overlap eliminations.
  diffs = [[DIFF_DELETE, 'abcd1212'], [DIFF_INSERT, '1212efghi'], [DIFF_EQUAL, '----'], [DIFF_DELETE, 'A3'], [DIFF_INSERT, '3BC']];
  dmp.diff_cleanupSemantic(diffs);
  assertEquivalent([[DIFF_DELETE, 'abcd'], [DIFF_EQUAL, '1212'], [DIFF_INSERT, 'efghi'], [DIFF_EQUAL, '----'], [DIFF_DELETE, 'A'], [DIFF_EQUAL, '3'], [DIFF_INSERT, 'BC']], diffs);
}

function testDiffCleanupEfficiency() {
  // Cleanup operationally trivial equalities.
  dmp.Diff_EditCost = 4;
  // Null case.
  var diffs = [];
  dmp.diff_cleanupEfficiency(diffs);
  assertEquivalent([], diffs);

  // No elimination.
  diffs = [[DIFF_DELETE, 'ab'], [DIFF_INSERT, '12'], [DIFF_EQUAL, 'wxyz'], [DIFF_DELETE, 'cd'], [DIFF_INSERT, '34']];
  dmp.diff_cleanupEfficiency(diffs);
  assertEquivalent([[DIFF_DELETE, 'ab'], [DIFF_INSERT, '12'], [DIFF_EQUAL, 'wxyz'], [DIFF_DELETE, 'cd'], [DIFF_INSERT, '34']], diffs);

  // Four-edit elimination.
  diffs = [[DIFF_DELETE, 'ab'], [DIFF_INSERT, '12'], [DIFF_EQUAL, 'xyz'], [DIFF_DELETE, 'cd'], [DIFF_INSERT, '34']];
  dmp.diff_cleanupEfficiency(diffs);
  assertEquivalent([[DIFF_DELETE, 'abxyzcd'], [DIFF_INSERT, '12xyz34']], diffs);

  // Three-edit elimination.
  diffs = [[DIFF_INSERT, '12'], [DIFF_EQUAL, 'x'], [DIFF_DELETE, 'cd'], [DIFF_INSERT, '34']];
  dmp.diff_cleanupEfficiency(diffs);
  assertEquivalent([[DIFF_DELETE, 'xcd'], [DIFF_INSERT, '12x34']], diffs);

  // Backpass elimination.
  diffs = [[DIFF_DELETE, 'ab'], [DIFF_INSERT, '12'], [DIFF_EQUAL, 'xy'], [DIFF_INSERT, '34'], [DIFF_EQUAL, 'z'], [DIFF_DELETE, 'cd'], [DIFF_INSERT, '56']];
  dmp.diff_cleanupEfficiency(diffs);
  assertEquivalent([[DIFF_DELETE, 'abxyzcd'], [DIFF_INSERT, '12xy34z56']], diffs);

  // High cost elimination.
  dmp.Diff_EditCost = 5;
  diffs = [[DIFF_DELETE, 'ab'], [DIFF_INSERT, '12'], [DIFF_EQUAL, 'wxyz'], [DIFF_DELETE, 'cd'], [DIFF_INSERT, '34']];
  dmp.diff_cleanupEfficiency(diffs);
  assertEquivalent([[DIFF_DELETE, 'abwxyzcd'], [DIFF_INSERT, '12wxyz34']], diffs);
  dmp.Diff_EditCost = 4;
}

function testDiffPrettyHtml() {
  // Pretty print.
  var diffs = [[DIFF_EQUAL, 'a\n'], [DIFF_DELETE, '<B>b</B>'], [DIFF_INSERT, 'c&d']];
  assertEquals('<span>a&para;<br></span><del style="background:#ffe6e6;">&lt;B&gt;b&lt;/B&gt;</del><ins style="background:#e6ffe6;">c&amp;d</ins>', dmp.diff_prettyHtml(diffs));
}

function testDiffText() {
  // Compute the source and destination texts.
  var diffs = [[DIFF_EQUAL, 'jump'], [DIFF_DELETE, 's'], [DIFF_INSERT, 'ed'], [DIFF_EQUAL, ' over '], [DIFF_DELETE, 'the'], [DIFF_INSERT, 'a'], [DIFF_EQUAL, ' lazy']];
  assertEquals('jumps over the lazy', dmp.diff_text1(diffs));

  assertEquals('jumped over a lazy', dmp.diff_text2(diffs));
}

function testDiffDelta() {
  // Convert a diff into delta string.
  var diffs = [[DIFF_EQUAL, 'jump'], [DIFF_DELETE, 's'], [DIFF_INSERT, 'ed'], [DIFF_EQUAL, ' over '], [DIFF_DELETE, 'the'], [DIFF_INSERT, 'a'], [DIFF_EQUAL, ' lazy'], [DIFF_INSERT, 'old dog']];
  var text1 = dmp.diff_text1(diffs);
  assertEquals('jumps over the lazy', text1);

  var delta = dmp.diff_toDelta(diffs);
  assertEquals('=4\t-1\t+ed\t=6\t-3\t+a\t=5\t+old dog', delta);

  // Convert delta string into a diff.
  assertEquivalent(diffs, dmp.diff_fromDelta(text1, delta));

  // Generates error (19 != 20).
  try {
    dmp.diff_fromDelta(text1 + 'x', delta);
    assertEquals(Error, null);
  } catch (e) {
    // Exception expected.
  }

  // Generates error (19 != 18).
  try {
    dmp.diff_fromDelta(text1.substring(1), delta);
    assertEquals(Error, null);
  } catch (e) {
    // Exception expected.
  }

  // Generates error (%c3%xy invalid Unicode).
  try {
    dmp.diff_fromDelta('', '+%c3%xy');
    assertEquals(Error, null);
  } catch (e) {
    // Exception expected.
  }

  // Test deltas with special characters.
  diffs = [[DIFF_EQUAL, '\u0680 \x00 \t %'], [DIFF_DELETE, '\u0681 \x01 \n ^'], [DIFF_INSERT, '\u0682 \x02 \\ |']];
  text1 = dmp.diff_text1(diffs);
  assertEquals('\u0680 \x00 \t %\u0681 \x01 \n ^', text1);

  delta = dmp.diff_toDelta(diffs);
  assertEquals('=7\t-7\t+%DA%82 %02 %5C %7C', delta);

  // Convert delta string into a diff.
  assertEquivalent(diffs, dmp.diff_fromDelta(text1, delta));

  // Verify pool of unchanged characters.
  diffs = [[DIFF_INSERT, 'A-Z a-z 0-9 - _ . ! ~ * \' ( ) ; / ? : @ & = + $ , # ']];
  var text2 = dmp.diff_text2(diffs);
  assertEquals('A-Z a-z 0-9 - _ . ! ~ * \' ( ) ; / ? : @ & = + $ , # ', text2);

  delta = dmp.diff_toDelta(diffs);
  assertEquals('+A-Z a-z 0-9 - _ . ! ~ * \' ( ) ; / ? : @ & = + $ , # ', delta);

  // Convert delta string into a diff.
  assertEquivalent(diffs, dmp.diff_fromDelta('', delta));

  // 160 kb string.
  var a = 'abcdefghij';
  for (var i = 0; i < 14; i++) {
    a += a;
  }
  diffs = [[DIFF_INSERT, a]];
  delta = dmp.diff_toDelta(diffs);
  assertEquals('+' + a, delta);

  // Convert delta string into a diff.
  assertEquivalent(diffs, dmp.diff_fromDelta('', delta));
}

function testDiffXIndex() {
  // Translate a location in text1 to text2.
  // Translation on equality.
  assertEquals(5, dmp.diff_xIndex([[DIFF_DELETE, 'a'], [DIFF_INSERT, '1234'], [DIFF_EQUAL, 'xyz']], 2));

  // Translation on deletion.
  assertEquals(1, dmp.diff_xIndex([[DIFF_EQUAL, 'a'], [DIFF_DELETE, '1234'], [DIFF_EQUAL, 'xyz']], 3));
}

function testDiffLevenshtein() {
  // Levenshtein with trailing equality.
  assertEquals(4, dmp.diff_levenshtein([[DIFF_DELETE, 'abc'], [DIFF_INSERT, '1234'], [DIFF_EQUAL, 'xyz']]));
  // Levenshtein with leading equality.
  assertEquals(4, dmp.diff_levenshtein([[DIFF_EQUAL, 'xyz'], [DIFF_DELETE, 'abc'], [DIFF_INSERT, '1234']]));
  // Levenshtein with middle equality.
  assertEquals(7, dmp.diff_levenshtein([[DIFF_DELETE, 'abc'], [DIFF_EQUAL, 'xyz'], [DIFF_INSERT, '1234']]));
}

function testDiffBisect() {
  // Normal.
  var a = 'cat';
  var b = 'map';
  // Since the resulting diff hasn't been normalized, it would be ok if
  // the insertion and deletion pairs are swapped.
  // If the order changes, tweak this test as required.
  assertEquivalent([[DIFF_DELETE, 'c'], [DIFF_INSERT, 'm'], [DIFF_EQUAL, 'a'], [DIFF_DELETE, 't'], [DIFF_INSERT, 'p']], dmp.diff_bisect_(a, b, Number.MAX_VALUE));

  // Timeout.
  assertEquivalent([[DIFF_DELETE, 'cat'], [DIFF_INSERT, 'map']], dmp.diff_bisect_(a, b, 0));
}

function testDiffMain() {
  // Perform a trivial diff.
  // Null case.
  assertEquivalent([], dmp.diff_main('', '', false));

  // Equality.
  assertEquivalent([[DIFF_EQUAL, 'abc']], dmp.diff_main('abc', 'abc', false));

  // Simple insertion.
  assertEquivalent([[DIFF_EQUAL, 'ab'], [DIFF_INSERT, '123'], [DIFF_EQUAL, 'c']], dmp.diff_main('abc', 'ab123c', false));

  // Simple deletion.
  assertEquivalent([[DIFF_EQUAL, 'a'], [DIFF_DELETE, '123'], [DIFF_EQUAL, 'bc']], dmp.diff_main('a123bc', 'abc', false));

  // Two insertions.
  assertEquivalent([[DIFF_EQUAL, 'a'], [DIFF_INSERT, '123'], [DIFF_EQUAL, 'b'], [DIFF_INSERT, '456'], [DIFF_EQUAL, 'c']], dmp.diff_main('abc', 'a123b456c', false));

  // Two deletions.
  assertEquivalent([[DIFF_EQUAL, 'a'], [DIFF_DELETE, '123'], [DIFF_EQUAL, 'b'], [DIFF_DELETE, '456'], [DIFF_EQUAL, 'c']], dmp.diff_main('a123b456c', 'abc', false));

  // Perform a real diff.
  // Switch off the timeout.
  dmp.Diff_Timeout = 0;
  // Simple cases.
  assertEquivalent([[DIFF_DELETE, 'a'], [DIFF_INSERT, 'b']], dmp.diff_main('a', 'b', false));

  assertEquivalent([[DIFF_DELETE, 'Apple'], [DIFF_INSERT, 'Banana'], [DIFF_EQUAL, 's are a'], [DIFF_INSERT, 'lso'], [DIFF_EQUAL, ' fruit.']], dmp.diff_main('Apples are a fruit.', 'Bananas are also fruit.', false));

  assertEquivalent([[DIFF_DELETE, 'a'], [DIFF_INSERT, '\u0680'], [DIFF_EQUAL, 'x'], [DIFF_DELETE, '\t'], [DIFF_INSERT, '\0']], dmp.diff_main('ax\t', '\u0680x\0', false));

  // Overlaps.
  assertEquivalent([[DIFF_DELETE, '1'], [DIFF_EQUAL, 'a'], [DIFF_DELETE, 'y'], [DIFF_EQUAL, 'b'], [DIFF_DELETE, '2'], [DIFF_INSERT, 'xab']], dmp.diff_main('1ayb2', 'abxab', false));

  assertEquivalent([[DIFF_INSERT, 'xaxcx'], [DIFF_EQUAL, 'abc'], [DIFF_DELETE, 'y']], dmp.diff_main('abcy', 'xaxcxabc', false));

  assertEquivalent([[DIFF_DELETE, 'ABCD'], [DIFF_EQUAL, 'a'], [DIFF_DELETE, '='], [DIFF_INSERT, '-'], [DIFF_EQUAL, 'bcd'], [DIFF_DELETE, '='], [DIFF_INSERT, '-'], [DIFF_EQUAL, 'efghijklmnopqrs'], [DIFF_DELETE, 'EFGHIJKLMNOefg']], dmp.diff_main('ABCDa=bcd=efghijklmnopqrsEFGHIJKLMNOefg', 'a-bcd-efghijklmnopqrs', false));

  // Large equality.
  assertEquivalent([[DIFF_INSERT, ' '], [DIFF_EQUAL, 'a'], [DIFF_INSERT, 'nd'], [DIFF_EQUAL, ' [[Pennsylvania]]'], [DIFF_DELETE, ' and [[New']], dmp.diff_main('a [[Pennsylvania]] and [[New', ' and [[Pennsylvania]]', false));

  // Codifying a suboptimal but a technically correct diff
  assertEquivalent([[DIFF_EQUAL, 'def x():\n    pass\n\ndef '], [DIFF_DELETE, 'y():\n    pass\n\ndef '], [DIFF_EQUAL, 'z():\n    pass\n']], dmp.diff_main('def x():\n    pass\n\ndef y():\n    pass\n\ndef z():\n    pass\n', 'def x():\n    pass\n\ndef z():\n    pass\n', false));
  // Better diff when multiline heuristic is used
  assertEquivalent([[DIFF_EQUAL, 'def x():\n    pass\n\n'], [DIFF_DELETE, 'def y():\n    pass\n\n'], [DIFF_EQUAL, 'def z():\n    pass\n']], dmp.diff_main('def x():\n    pass\n\ndef y():\n    pass\n\ndef z():\n    pass\n', 'def x():\n    pass\n\ndef z():\n    pass\n', true));

  // Timeout.
  dmp.Diff_Timeout = 0.1;  // 100ms
  var a = '`Twas brillig, and the slithy toves\nDid gyre and gimble in the wabe:\nAll mimsy were the borogoves,\nAnd the mome raths outgrabe.\n';
  var b = 'I am the very model of a modern major general,\nI\'ve information vegetable, animal, and mineral,\nI know the kings of England, and I quote the fights historical,\nFrom Marathon to Waterloo, in order categorical.\n';
  // Increase the text lengths by 1024 times to ensure a timeout.
  for (var i = 0; i < 10; i++) {
    a += a;
    b += b;
  }
  var startTime = (new Date()).getTime();
  dmp.diff_main(a, b);
  var endTime = (new Date()).getTime();
  // Test that we took at least the timeout period.
  assertTrue(dmp.Diff_Timeout * 1000 <= endTime - startTime);
  // Test that we didn't take forever (be forgiving).
  // Theoretically this test could fail very occasionally if the
  // OS task swaps or locks up for a second at the wrong moment.
  assertTrue(dmp.Diff_Timeout * 1000 * 2 > endTime - startTime);
  dmp.Diff_Timeout = 0;

  // Test the linemode speedup.
  // Must be long to pass the 100 char cutoff.
  // Simple line-mode.
  a = '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n';
  b = 'abcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\nabcdefghij\n';
  assertEquivalent(dmp.diff_main(a, b, false), dmp.diff_main(a, b, true));

  // Single line-mode.
  a = '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890';
  b = 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghijabcdefghij';
  assertEquivalent(dmp.diff_main(a, b, false), dmp.diff_main(a, b, true));

  // Overlap line-mode.
  a = '1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n1234567890\n';
  b = 'abcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n1234567890\n1234567890\n1234567890\nabcdefghij\n';
  var texts_linemode = diff_rebuildtexts(dmp.diff_main(a, b, true));
  var texts_textmode = diff_rebuildtexts(dmp.diff_main(a, b, false));
  assertEquivalent(texts_textmode, texts_linemode);

  // Test null inputs.
  try {
    dmp.diff_main(null, null);
    assertEquals(Error, null);
  } catch (e) {
    // Exception expected.
  }
}

