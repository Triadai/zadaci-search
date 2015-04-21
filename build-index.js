var fs = require("fs"),
    inDir = "gen/zadaci-words",
    scores = {
      name: 10,
      path: 5,
      word: 1
    },
    indexToId = [],
    wordsIndex = {};

function addWords(task_index, words_by_level) {
  for (var level in words_by_level) {
    var words = words_by_level[level];
    for (var i = 0; i < words.length; ++i) {
      var word = words[i];
      if (!wordsIndex.hasOwnProperty(word)) {
        wordsIndex[word] = {};
      }
      if (!wordsIndex[word].hasOwnProperty(task_index)) {
        wordsIndex[word][task_index] = scores[level];
      } else {
        wordsIndex[word][task_index] += scores[level];
      }
    }
  }
}

/**
 * indexToId[test_id] = task_key;
 *  example:
 *     [ 'drzavno-2004-ss_druga_dan1-pizza',
 *       'drzavno-2004-ss_druga_dan1-reklame' ],
 * words_keys[] is array of words sorted.
 * words_values[] is array with same indicies as words_keys but with
 * occurrences of words in tasks. for example:
 * words_keys: ["foo", "bar", "baz"]
 * words_values: [ { '0': 5, '1': 5 }, { '1': 1 }, { '1': 1 } ]
 *
 * This means that word foo is present in first two tasks with weight 5. Word
 * bar and baz are present in second task with weight 1.
 */
function finalizeIndex() {
  var result = {};
  result["indexToId"] = indexToId;
  result["words_keys"] = Object.keys(wordsIndex).sort();
  result["words_values"] = [];
  for (var i = 0; i < result.words_keys.length; ++i) {
    result["words_values"].push(wordsIndex[result.words_keys[i]]);
  }
  process.stdout.write(JSON.stringify(result));
}

function splitPathParts(id_parts) {
  var result = [];
  for (var i = 0; i < id_parts.length; ++i) {
    var splitted = id_parts[i].split("_");
    for (var j = 0; j < splitted.length; ++j) {
      result.push(splitted[j]);
    }
  }
  return result;
}

function main() {
  var dir = fs.readdirSync(inDir);
  for (var i = 0; i < dir.length; ++i) {
    var filename = dir[i];
    var path = inDir + "/" + filename;
    var id = filename.substr(0, filename.length - 4);
    var id_parts = id.split("-");
    var task_name = id_parts[id_parts.length -1];
    var words = fs.readFileSync(path).toString().split(/\s/).slice(0, -1);
    indexToId.push(id);
    addWords(i, {name: [task_name],
                 path: splitPathParts(id_parts),
                 word: words});
  }
  finalizeIndex();
}

main();
