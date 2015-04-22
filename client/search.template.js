var Search = Search || {};

Search.search = function (query, max_items) {
  var tokens = Search.internal.tokenizeQuery(query);
  var result = Search.internal.getResult(tokens);
  return Search.internal.rankAndFinalize(result, max_items || 20);
};

Search.internal = {};

Search.internal.tokenizeQuery = function (query) {
  return query.split(/\s/)
    .filter(function (word) {
      return word.length > 1;
    })
    .map(Search.croatianHelper.toAscii)
    .map(Search.croatianHelper.toLower);
};

/**
 * Searches for the first true value in the predicate.
 * Returns hi if not found.
 * [lo, hi)
 */
Search.internal.binarySearch = function (lo, hi, predicate) {
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
Search.internal.getWordIndexRange = function (word, is_last) {
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
  var lower_bound = Search.internal.binarySearch(0, keys.length,
      greaterOrEqual);
  var upper_bound = Search.internal.binarySearch(lower_bound, keys.length,
      less);
  return [lower_bound, upper_bound];
};

Search.internal.resultAnd = function (res1, res2) {
  var result = {};
  for (var task_index in res1) {
    if (res2.hasOwnProperty(task_index)) {
      result[task_index] = res1[task_index] + res2[task_index];
    }
  }
  return result;
};

Search.internal.resultOr = function (res1, res2) {
  var result = {};
  for (var task_index in res1) {
    result[task_index] = res1[task_index];
  }
  for (var task_index in res2) {
    if (result.hasOwnProperty(task_index)) {
      result[task_index] += res2[task_index];
    } else {
      result[task_index] = res2[task_index];
    }
  }
  return result;
};

Search.internal.resultScale = function (res1, scale) {
  var result = {};
  for (var task_index in res1) {
    result[task_index] = scale * res1[task_index];
  }
  return result;
}

Search.internal.getMatchesForWord = function (word, is_last) {
  var result = {},
      equal_range = Search.internal.getWordIndexRange(word, is_last);
  for (var i = equal_range[0]; i < equal_range[1]; ++i) {
    result = Search.internal.resultOr(result, Search.data.words_values[i]);
    // For exact match scale points with 2.
    // ("anton" ~~ "anton", "anton" ~ "antonio")
    if (i == equal_range[0]) {
      result = Search.internal.resultScale(result, 2);
    }
  }
  return result;
};

Search.internal.getResult = function (tokens) {
  var results = [];
  for (var i = 0; i < tokens.length; ++i) {
    results.push(Search.internal.getMatchesForWord(
      tokens[i], i == tokens.length - 1));
  }
  if (results.length > 1) {
    return results.reduce(Search.internal.resultAnd);
  } else if (results.length == 1) {
    return results[0];
  } else {
    return {};
  }
};

Search.internal.rankAndFinalize = function (matches, max_items) {
  function compare(a, b) {
    return b[1] - a[1];
  }
  var result = [];
  for (var task_index in matches) {
    result.push([task_index, matches[task_index]]);
  }
  result = result.sort(compare).slice(0, max_items);
  return result.map(function (match) {
    return Search.data.indexToId[match[0]] + " (" + match[1] + ")";
  });
};

