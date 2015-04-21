var croatian = require('./croatian-helper/lib/croatian-helper.js'),
    fs = require('fs');

var infile = process.argv[2];

if (!infile || infile == '-') {
  infile = '/dev/stdin';
}

var stream = fs.createReadStream(infile, { encoding: 'utf8' }),
    all_words = {};

stream.on('data', function (data) {
  var words = data.toString().split(/\s/).map(function (word) {
    word = croatian.toAscii(word);
    return croatian.toLower(word);
  }).filter(function (word) {
    return word.length > 0;
  });
  for (var i = 0; i < words.length; ++i) {
    all_words[words[i]] = 1;
  }
});

stream.on('end', function () {
  process.stdout.write(Object.keys(all_words).sort().join("\n"));
  process.stdout.write("\n");
});
