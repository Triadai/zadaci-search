var Search = Search || {};

Search.search = function (query, max_items) {
  var t0 = new Date().getTime();
  var tokens = Search.impl.tokenizeQuery(query);
  var result = Search.impl.getResult(tokens);
  var ranked = Search.impl.rankAndFinalize(result, max_items || 20);
  console.log("query took " + (new Date().getTime() - t0) + " ms");
  return ranked;
};

Search.impl = {};

// Leaves only numbers and ascii lowercase letters.
Search.impl.sanitizeWord = function (word) {
  return word.split("").map(function (letter) {
    if (letter.match(/[0-9]/)) {
      return letter;
    } else {
      return Search.croatianHelper.toAscii(
             Search.croatianHelper.toLower(letter));
    }
  }).join("");
};

Search.impl.tokenizeQuery = function (query) {
  return query.split(/\s/)
    .map(Search.impl.sanitizeWord)
    .filter(function (word) {
      return word.length > 0;
    });
};

/**
 * Searches for the first true value in the predicate.
 * Returns hi if not found.
 * [lo, hi)
 */
Search.impl.binarySearch = function (lo, hi, predicate) {
  while (lo != hi) {
    var mid = ((lo + hi) / 2) | 0;
    if (predicate(mid)) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
};

/**
 * is_last is currently ignored, but idea is to fetch all suffixes if word is
 * last in query as well.
 */
Search.impl.getWordIndexRange = function (word, is_last) {
  var keys = Search.data.words_keys;
  var lo = 0, hi = keys.length;
  function greaterOrEqual(index) {
    return keys[index] >= word;
  }
  function less(index) {
    if (is_last) {
      return keys[index].substr(0, word.length) > word;
    } else {
      return keys[index] > word;
    }
  }
  var lower_bound = Search.impl.binarySearch(0, keys.length,
      greaterOrEqual);
  var upper_bound = Search.impl.binarySearch(lower_bound, keys.length,
      less);
  return [lower_bound, upper_bound];
};

Search.impl.getMatchesForWord = function (word, is_last) {
  var result = [],
      equal_range = Search.impl.getWordIndexRange(word, is_last);
  if (equal_range[0] >= equal_range[1]) {
    return result;
  }
  result = Search.tree.query(equal_range[0], equal_range[1]);
  // Award exact match more points.
  // ("anton" ~~ "anton", "anton" ~ "antonio")
  result = Search.impl.resultOr(result,
      Search.data.words_values[equal_range[0]]);
  return result;
};

Search.impl.getResult = function (tokens) {
  var results = [];
  for (var i = 0; i < tokens.length; ++i) {
    results.push(Search.impl.getMatchesForWord(
      tokens[i], i == tokens.length - 1));
  }
  if (results.length > 1) {
    return results.reduce(Search.impl.resultAnd);
  } else if (results.length == 1) {
    return results[0];
  } else {
    return [];
  }
};

Search.impl.rankAndFinalize = function (matches, max_items) {
  return Search.impl.resultOrder(matches, max_items).map(
    function (task_index) {
      return Search.data.indexToId[task_index];
    });
};

