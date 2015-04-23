var Search = Search || {};
Search.impl = Search.impl || {};

Search.impl.firstPowerOfTwoGreaterThan = function (x) {
  var result = 1;
  while (result <= x) {
    result <<= 1;
  }
  return result;
};

/**
 * merge is binary operator on elements of array.
 * merge() gives neutral element.
 * merge(x) returns x.
 * merge(x, y) return merged x and y.
 * merge(x) == merge(x, merge())
 * the query which this tree can answer is what is
 * array.slice(lo, hi - lo).reduce(merge); 
 */
Search.impl.IntervalTree = function (array, merge) {
  var N = Search.impl.firstPowerOfTwoGreaterThan(array.length);
  var len = array.length;

  function expandArray() {
    while (array.length != N * 2) {
      array.push(merge());
    }
  }

  function buildTree(node) {
    return node >= N ?
      get(node) :
      set(node, merge(buildTree(node * 2), buildTree(node * 2 + 1)));
  }

  expandArray();
  buildTree(1);

  function transponse(index) { return index < N ? index + N : index - N; }
  function get(index) { return array[transponse(index)]; }
  function set(index, value) { return array[transponse(index)] = value; }

  function query(node, lo, hi, q_lo, q_hi) {
    if (q_lo <= lo && hi <= q_hi) {
      return get(node);
    }
    if (q_hi <= lo || q_lo >= hi) {
      return merge();
    }
    var mid = ((lo + hi) / 2) | 0;
    return merge(
        query(node * 2,     lo, mid, q_lo, q_hi),
        query(node * 2 + 1, mid, hi, q_lo, q_hi));
  }

  // merge everything in interval [lo, hi)
  this.query = function (lo, hi) {
    return lo < hi ? query(1, 0, N, lo, hi) : merge();
  };

  this.queryBrute = function (lo, hi) {
    var result = merge();
    for (var i = lo; i < hi; ++i) {
      result = merge(result, array[i]);
    }
    return result;
  };
};

if (typeof module !== "undefined") {
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
  function sum(a, b) {
    if (a == undefined && b == undefined) {
      return 0;
    }
    if (b == undefined) {
      return a;
    }
    return a + b;
  }
  (function test_fop () {
    assert_eq(1, impl.firstPowerOfTwoGreaterThan(0));
    assert_eq(2, impl.firstPowerOfTwoGreaterThan(1));
    assert_eq(4, impl.firstPowerOfTwoGreaterThan(2));
    assert_eq(4, impl.firstPowerOfTwoGreaterThan(3));
    assert_eq(8, impl.firstPowerOfTwoGreaterThan(4));
  }());
  (function test_tree_brute () {
    var tree = new impl.IntervalTree([1,2,3,4,5], sum);
    assert_eq(0, tree.queryBrute(0, 0));
    assert_eq(1, tree.queryBrute(0, 1));
    assert_eq(3, tree.queryBrute(0, 2));
    assert_eq(5, tree.queryBrute(4, 5));
  });
  (function test_tree () {
    var arr = [];
    var N = 1000;
    for (var i = 0; i < N; ++i) {
      arr.push((Math.random() * N) | 0);
    }
    var tree = new impl.IntervalTree(arr, sum);
    for (var i = 0; i < 1000; ++i) {
      var left = Math.random() * N;
      var right = Math.random() * N;
      left |= 0; right |= 0;
      assert_eq(tree.queryBrute(left, right), tree.query(left, right));
    }
  }());
}

if (Search.data) {
  var t0 = new Date().getTime();
  Search.tree = new Search.impl.IntervalTree(
      Search.data.words_values,
      Search.impl.resultOr);
  console.log("building tree took " +
      (new Date().getTime() - t0) + " ms");
}
