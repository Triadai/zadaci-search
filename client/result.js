/**
 * result is data structure that keeps match score for each matched task.
 * it can be viewed as dictionary: {
 *  task_id_1 : score_1
 *  task_id_2 : score_2
 * }
 * but in memory it is actually array that has even length with task_indexes on
 * 2*k indexes and scores ond 2*k+1 indexes.
 * task result[2*k] has match score of result[2*k+1]
 *
 * operations that can be done on result are logical OR and AND.
 */

var Search = Search || {};
Search.impl = Search.impl || {};

/**
 * intersection of two results:
 * if both results contains same task, resulting result has this task with sum
 * of scores from two tasks. otherwise result doesn't contain that task.
 */
Search.impl.resultAnd = function (lhs, rhs) {
  var result = Array(lhs.length + rhs.length);
  var lhs_pos = 0, rhs_pos = 0, result_pos = 0;
  while (lhs_pos < lhs.length || rhs_pos < rhs.length) {
    // Case 1: if both pointers point to the same task_index,
    // just output that task_index with sum of two weights.
    if (lhs_pos < lhs.length && rhs_pos < rhs.length) {
      if (lhs[lhs_pos] == rhs[rhs_pos]) {
        result[result_pos++] = lhs[lhs_pos];
        result[result_pos++] = lhs[lhs_pos + 1] + rhs[rhs_pos + 1];
        lhs_pos += 2;
        rhs_pos += 2;
        continue;
      }
    }
    // Case 2: increment lower task_index,
    // and don't add anything to reuslt.
    if (lhs_pos < lhs.length &&
        (rhs_pos == rhs.length || lhs[lhs_pos] < rhs[rhs_pos])) {
      lhs_pos += 2; 
    } else {
      rhs_pos += 2; 
    }
  }
  return result.slice(0, result_pos);
};

/**
 * element wise sum of two results.
 */
Search.impl.resultOr = function (lhs, rhs) {
  var result = Array(lhs.length + rhs.length);
  var lhs_pos = 0, rhs_pos = 0, result_pos = 0;
  while (lhs_pos < lhs.length || rhs_pos < rhs.length) {
    // Case 1: if both pointers point to the same task_index,
    // just output that task_index with sum of two weights.
    if (lhs_pos < lhs.length && rhs_pos < rhs.length) {
      if (lhs[lhs_pos] == rhs[rhs_pos]) {
        result[result_pos++] = lhs[lhs_pos];
        result[result_pos++] = lhs[lhs_pos + 1] + rhs[rhs_pos + 1];
        lhs_pos += 2;
        rhs_pos += 2;
        continue;
      }
    }
    // Case 2: increment lower task_index, but be careful about pointers
    // reaching end of the array.
    if (lhs_pos < lhs.length &&
        (rhs_pos == rhs.length || lhs[lhs_pos] < rhs[rhs_pos])) {
      result[result_pos++] = lhs[lhs_pos];
      result[result_pos++] = lhs[lhs_pos + 1];
      lhs_pos += 2; 
    } else {
      result[result_pos++] = rhs[rhs_pos];
      result[result_pos++] = rhs[rhs_pos + 1];
      rhs_pos += 2; 
    }
  }
  return result.slice(0, result_pos);
};

/**
 * scales match scores by a constant.
 */
Search.impl.resultScale = function (lhs, scale) {
  var result = Array(lhs.length);
  for (var i = 0; i < lhs.length; i += 2) {
    result[i] = lhs[i];
    result[i + 1] = lhs[i + 1] * scale;
  }
  return result;
}

/**
 * takes result and returns first max_items task ids.
 */
Search.impl.resultOrder = function (lhs, max_items) {
  function compare(a, b) {
    return b[1] - a[1];
  }
  var by_pairs = Array(lhs.length / 2);
  for (var i = 0; i < lhs.length; i+=2) {
    by_pairs[i / 2] = [lhs[i], lhs[i + 1]];
  }
  by_pairs = by_pairs.sort(compare).slice(0, max_items);
  return by_pairs.map(function (pair) {
    return pair[0];
  });
};

if ("process" in this) {
  var impl = Search.impl;
  function assert_eq(a, b) {
    a = JSON.stringify(a);
    b = JSON.stringify(b);
    if (a != b) {
      console.log("expected: ", a);
      console.log("actual: ", b);
      console.log();
    }
  }
  (function test_result_order () {
    assert_eq([1], impl.resultOrder([0, 5, 1, 10], 1));
    assert_eq([0], impl.resultOrder([0, 10, 1, 5], 1));
    assert_eq([], impl.resultOrder([], 1));
    assert_eq([], impl.resultOrder([0, 10, 1, 5], 0));
  }());
  (function test_result_scale () {
    assert_eq([0, 10], impl.resultScale([0, 5], 2));
    assert_eq([0, 0], impl.resultScale([0, 5], 0));
    assert_eq([], impl.resultScale([], 1));
    assert_eq([0,2,5,2], impl.resultScale([0, 1, 5, 1], 2));
  }());
  (function test_result_or () {
    assert_eq([0, 10], impl.resultOr([0, 5], [0, 5]));
    assert_eq([0, 5, 1, 5], impl.resultOr([0, 5], [1, 5]));
    assert_eq([0, 5], impl.resultOr([0, 5], []));
    assert_eq([], impl.resultOr([], []));
    assert_eq([0, 6, 1, 6, 2, 15], impl.resultOr([0, 5, 1, 6, 2, 7],
                                                 [0, 1,       2, 8]));
  }());
  (function test_result_and () {
    assert_eq([0, 10], impl.resultAnd([0, 5], [0, 5]));
    assert_eq([], impl.resultAnd([0, 5], [1, 5]));
    assert_eq([], impl.resultAnd([0, 5], []));
    assert_eq([], impl.resultAnd([], []));
    assert_eq([0, 6, 2, 15], impl.resultAnd([0, 5, 1, 6, 2, 7],
                                            [0, 1,       2, 8]));
  }());
  (function test_result_self_or_equals_scale () {
    var result = [1,2,3,4,5,6,7,8,9,10];
    assert_eq(impl.resultScale(result, 2), impl.resultOr(result, result));
  });
}
