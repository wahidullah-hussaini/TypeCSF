/* =============================================================================
 * content.js - practice text, vocabulary, code snippets and quiz questions
 * -----------------------------------------------------------------------------
 * All text is plain ASCII (typeable on a US keyboard) and single-line, because
 * the typing engine does not accept Enter or Tab.
 * ========================================================================== */
import * as core from './core.js';

var CS_WORDS = ('algorithm array binary boolean browser buffer cache class client compiler constant cursor database debug ' +
  'domain driver element encrypt endpoint error event function gateway hardware hash heap hexadecimal index input integer ' +
  'interface iterate kernel keyword latency library logic loop memory method module network node object output packet ' +
  'parameter parser pixel pointer process program protocol query queue recursion register router runtime schema script ' +
  'server session software stack string syntax thread token variable vector virtual widget bandwidth bitwise bytecode ' +
  'checksum cipher cluster compile concurrency container cookie daemon deploy encoding firewall framework hostname ' +
  'inheritance instance iteration lambda middleware namespace packet pipeline polymorphism repository response ' +
  'semantic serialize stream template terminal throughput unicode validate version').split(' ');

var HOME_ROW = ['asdf jkl;', 'fjfj dkdk slsl a;a;', 'ask all fall dad sad lad flask salad', 'a sad lad asks a dad; a fall flask',
  'jade hall glad shall flash gaff skald', 'half a salad; ask dad; flask falls', 'ghgh fgfg hjhj gfgf', 'lad had a glass; dad has a flask'];

var LETTER_DRILLS = {
  e: 'see feed need tree green sleeve eleven element release', t: 'tot tattoo attempt letter total status settle button',
  a: 'banana alpha data array abstract canvas drama paragraph', o: 'book zoom proof option protocol bottom loop solo',
  i: 'if in is it index iterate indigo digit limit video', n: 'nine banana connect nominal engine nanny inner',
  s: 'sass session class process mass assess basis assist', r: 'error mirror carrier record error array return arrow',
  h: 'hash hush hash through thought high shrub heritage', l: 'all allow little follow lollipop level loyal',
  d: 'did dad deed added duplicate decode divide dashboard', c: 'cache cycle cactus clock circuit classic accuracy',
  u: 'unit user fuzzy usual union output queue unique', m: 'memory minimum mammal comma modem summary mimic',
  p: 'pop apple pipeline puppy proper program npm purple', g: 'gig gauge giggle garage digging logging graph',
  f: 'fluff fifty effect buffer offline fiddle fifth', y: 'yes yearly system type empty carry symmetry',
  b: 'bob bubble robot cabinet blob bubble bribe',  w: 'we window waterway wow swallow tweet wireless',
  k: 'kick kayak keyboard back kernel keep token', v: 'visual vivid vector value never driver virtual',
  x: 'text next index exact exam complex matrix pixel', z: 'zoo size zero zigzag maze buzz quiz frozen',
  j: 'java jump jury major object project json jazz', q: 'query quick queue quote quiz request equal square'
};

var SENTENCES = [
  'A computer follows instructions exactly as they are written.',
  'An algorithm is a clear set of steps that solves a problem.',
  'Good programmers test their code and read error messages carefully.',
  'The browser sends a request and the server sends back a response.',
  'Memory stores data that the processor needs right now.',
  'Practice a little every day and your speed will grow steadily.',
  'A variable gives a name to a value so the program can use it later.',
  'Accuracy first, speed second: slow and correct becomes fast and correct.',
  'Binary uses only two digits, zero and one, to represent all data.',
  'A network connects devices so that they can share information.',
  'Break a big problem into small parts and solve one part at a time.',
  'Strong passwords are long, unique and hard to guess.',
  'The operating system manages hardware and runs your applications.',
  'Comments in code explain why something is done, not only what it does.',
  'Keep your wrists relaxed and your eyes on the screen, not the keys.'
];

var PUNCTUATION = [
  'Hello, world! Is this working? Yes, it is; keep going.',
  'First, check the input; second, run the test: it should pass.',
  'The "quoted" text, the (bracketed) note, and the \'single\' quotes.',
  'Name: Ada Lovelace. Born: London. Known for: early programming.',
  'Wait - what? No... yes! Capital Letters Start Sentences.',
  'Python, Java, and C are languages; HTML and CSS are not.'
];

var SYMBOLS = [
  '1234567890 0987654321 1 2 3 4 5 6 7 8 9 0',
  '!@#$%^&*() )(*&^%$#@! ! @ # $ % ^ & * ( )',
  'x = 10 + 5 * 2 - 3 / 1 = 17 and 25 % 7 = 4',
  'price: $19.99 + 8.5% tax = $21.69 (rounded)',
  'a_b-c=d+e [1] {2} <3> |4| \\5/ ~6 `7 ^8 &9 *0',
  'user@example.com #typing 100% 3.14159 2^10 = 1024'
];

var CODE = [
  'for (let i = 0; i < 10; i++) { console.log(i); }',
  'const total = items.reduce((sum, n) => sum + n, 0);',
  'def add(a, b): return a + b',
  'if (score >= 90) { grade = "A"; } else { grade = "B"; }',
  'document.querySelector("#title").textContent = "Hello";',
  'let names = ["Ada", "Alan", "Grace"]; names.push("Linus");',
  'function square(n) { return n * n; }',
  'SELECT name, age FROM students WHERE age > 18 ORDER BY name;',
  '<a href="index.html" class="link">Home</a>',
  'body { margin: 0; font-family: sans-serif; color: #222; }',
  'while (queue.length > 0) { process(queue.shift()); }',
  'int main() { printf("Hello, world!\\n"); return 0; }',
  'const user = { id: 1, name: "Sam", active: true };',
  'fetch("/api/data").then((r) => r.json()).then(console.log);',
  'print([x * 2 for x in range(5) if x % 2 == 0])'
];

var QUIZ_TOPICS = {
  basics: 'Computer basics', programming: 'Programming', web: 'Web and internet',
  data: 'Data and networks', security: 'Security and ethics'
};

var QUIZ_COUNT = 0;
function q(topic, text, options, answer, why) {
  /* "id" is the position in this list: translated questions live in
     src/locales/<lang>/quiz.json under the same position. */
  return { id: QUIZ_COUNT++, topic: topic, q: text, options: options, answer: answer, why: why };
}

var QUIZ = [
  q('basics', 'What does CPU stand for?', ['Central Processing Unit', 'Computer Personal Unit', 'Central Program Utility', 'Core Power Unit'], 0, 'The CPU is the "brain" that executes instructions.'),
  q('basics', 'Which of these is volatile memory (loses data when power is off)?', ['SSD', 'RAM', 'Hard disk', 'USB drive'], 1, 'RAM needs power to keep its contents; the others are storage.'),
  q('basics', 'Which part of a computer permanently stores your files?', ['RAM', 'Cache', 'Storage drive', 'Register'], 2, 'Drives (SSD or hard disk) keep data without power.'),
  q('basics', 'Software that manages hardware and runs apps is called:', ['A compiler', 'An operating system', 'A browser', 'A database'], 1, 'Windows, macOS, Linux and Android are operating systems.'),
  q('basics', 'How many bits are in one byte?', ['4', '8', '16', '10'], 1, 'A byte is 8 bits.'),
  q('basics', 'Which is an input device?', ['Monitor', 'Speaker', 'Keyboard', 'Printer'], 2, 'Input devices send data into the computer.'),
  q('programming', 'What is an algorithm?', ['A programming language', 'A step-by-step method to solve a problem', 'A type of computer', 'A bug in code'], 1, 'Algorithms are ordered, unambiguous steps.'),
  q('programming', 'What does a variable do?', ['Stores a named value', 'Draws a picture', 'Connects to Wi-Fi', 'Deletes files'], 0, 'Variables give names to values so code can reuse them.'),
  q('programming', 'Which loop repeats code while a condition is true?', ['if', 'while', 'return', 'import'], 1, 'A while loop checks its condition before each repeat.'),
  q('programming', 'What is a bug?', ['A virus only', 'An error in a program', 'A fast computer', 'A type of file'], 1, 'Debugging means finding and fixing such errors.'),
  q('programming', 'What does a compiler do?', ['Translates source code into machine code', 'Stores web pages', 'Cleans the screen', 'Sends email'], 0, 'Compilers translate a whole program before it runs.'),
  q('programming', 'In most languages, which index starts an array?', ['1', '0', '-1', '10'], 1, 'Zero-based indexing is the common convention.'),
  q('programming', 'What is a function?', ['A reusable block of code', 'A keyboard shortcut', 'A kind of variable only', 'A network cable'], 0, 'Functions package steps so you can call them many times.'),
  q('web', 'What does HTML describe?', ['The structure of a web page', 'The speed of the internet', 'A database design', 'A computer chip'], 0, 'HTML marks up headings, paragraphs, links and more.'),
  q('web', 'What is CSS used for?', ['Styling web pages', 'Storing passwords', 'Compiling code', 'Sending packets'], 0, 'CSS controls colours, spacing and layout.'),
  q('web', 'What does a web browser do?', ['Requests and displays web pages', 'Repairs hardware', 'Writes the OS', 'Encrypts the disk'], 0, 'Browsers fetch pages from servers and render them.'),
  q('web', 'What does HTTPS add compared with HTTP?', ['Encryption', 'More colours', 'Faster typing', 'Bigger pages'], 0, 'HTTPS encrypts traffic between you and the site.'),
  q('web', 'JavaScript in a web page mainly adds:', ['Behaviour and interactivity', 'Electricity', 'Page margins only', 'Hardware drivers'], 0, 'It reacts to clicks, keys and other events.'),
  q('data', 'What is an IP address?', ['A device address on a network', 'A kind of password', 'A web page title', 'A file extension'], 0, 'IP addresses identify devices so data can be routed.'),
  q('data', 'What is a database?', ['An organised collection of data', 'A mouse driver', 'A screen saver', 'A keyboard layout'], 0, 'Databases store data so it can be searched and updated.'),
  q('data', 'Binary 1010 equals which decimal number?', ['8', '10', '12', '5'], 1, '8 + 2 = 10.'),
  q('data', 'What does a router do?', ['Forwards data between networks', 'Prints documents', 'Stores photos', 'Cools the CPU'], 0, 'Routers pass packets toward their destination.'),
  q('data', 'Which unit is largest?', ['Kilobyte', 'Megabyte', 'Gigabyte', 'Byte'], 2, 'Byte < KB < MB < GB.'),
  q('data', 'What is Wi-Fi?', ['Wireless networking technology', 'A programming language', 'A kind of RAM', 'A search engine'], 0, 'It lets devices join a network without cables.'),
  q('security', 'Which password is strongest?', ['password123', 'qwerty', 'A long unique passphrase', 'Your birthday'], 2, 'Length and uniqueness matter most.'),
  q('security', 'What is phishing?', ['Tricking people into giving away private data', 'A fast typing method', 'A network cable', 'A coding style'], 0, 'Phishing messages imitate trusted senders.'),
  q('security', 'What does a firewall do?', ['Filters network traffic', 'Speeds up typing', 'Makes files smaller', 'Draws graphics'], 0, 'Firewalls allow or block connections by rules.'),
  q('security', 'Why should you update your software?', ['It fixes security problems', 'It makes the screen brighter', 'It deletes files', 'It shortens passwords'], 0, 'Updates patch known vulnerabilities.'),
  q('security', 'What is two-factor authentication?', ['Using two different proofs to sign in', 'Typing a password twice', 'Using two keyboards', 'Two monitors'], 0, 'For example a password plus a code on your phone.'),
  q('security', 'Which is good online behaviour?', ['Respecting others and their work', 'Sharing passwords with friends', 'Copying work without credit', 'Clicking unknown links'], 0, 'Digital citizenship includes respect and honesty.')
];

function wordsFrom(rng, list, count) {
  var out = [];
  for (var i = 0; i < count; i++) out.push(list[Math.floor(rng() * list.length)]);
  return out.join(' ');
}

/** Vocabulary lines from the handbook notes ("term: definition") when loaded. */
function vocabulary(book) {
  var out = [];
  try {
    (book || []).forEach(function (part) {
      (part.pages || []).forEach(function (page) {
        (page.notes || []).forEach(function (n) {
          var line = core.sanitizeTypingText(n.term + ': ' + n.definition, 140).text;
          if (n.term && n.definition && line.length > 10) out.push(line);
        });
      });
    });
  } catch (e) { /* data not loaded */ }
  return out;
}

var MODES = [
  { id: 'homerow', icon: 'H' },
  { id: 'letters', icon: 'a', needsLetter: true },
  { id: 'words', icon: 'W' },
  { id: 'sentences', icon: 'S' },
  { id: 'punctuation', icon: '.' },
  { id: 'symbols', icon: '#' },
  { id: 'vocab', icon: 'V' },
  { id: 'code', icon: '{}' },
  { id: 'timed', icon: 'T', timed: true },
  { id: 'custom', icon: '+' }
];

/**
 * Build practice text.
 * @param {string} mode  one of MODES ids
 * @param {{rng?:Function, letter?:string, length?:number, book?:Array, custom?:string}} o
 */
function buildPractice(mode, o) {
  o = o || {};
  var rng = o.rng || Math.random;
  var length = o.length || 220;
  var text = '';
  switch (mode) {
    case 'homerow': text = core.pick(HOME_ROW, 4, rng).join(' '); break;
    case 'letters': {
      var l = LETTER_DRILLS[o.letter] ? o.letter : 'e';
      text = core.shuffle(LETTER_DRILLS[l].split(' '), rng).join(' ');
      break;
    }
    case 'words': text = wordsFrom(rng, CS_WORDS, 30); break;
    case 'sentences': text = core.pick(SENTENCES, 3, rng).join(' '); break;
    case 'punctuation': text = core.pick(PUNCTUATION, 3, rng).join(' '); break;
    case 'symbols': text = core.pick(SYMBOLS, 3, rng).join(' '); break;
    case 'vocab': {
      var v = vocabulary(o.book);
      text = (v.length ? core.pick(v, 2, rng) : core.pick(SENTENCES, 2, rng)).join(' ');
      break;
    }
    case 'code': text = core.pick(CODE, 3, rng).join(' '); break;
    case 'timed': text = wordsFrom(rng, CS_WORDS.concat(['the', 'and', 'is', 'to', 'a', 'of', 'in', 'it', 'for', 'on']), 220); break;
    case 'custom': return core.sanitizeTypingText(o.custom || '', 1200);
    default: text = wordsFrom(rng, CS_WORDS, 25);
  }
  return core.sanitizeTypingText(mode === 'timed' ? text : text.slice(0, Math.max(length, 60) * 3), 1200);
}

/** The daily challenge is the same for everybody on the same calendar day. */
function dailyChallenge(date) {
  var key = core.dateKey(date);
  var rng = core.mulberry32(core.hashString('typecsf-' + key));
  var text = core.pick(SENTENCES, 2, rng).join(' ') + ' ' + wordsFrom(rng, CS_WORDS, 8);
  return { key: key, text: core.sanitizeTypingText(text, 600).text };
}

/**
 * Pick questions and shuffle the answer order. Each result keeps the question id
 * and `order` (original option index at each shown position) so the interface can
 * show the question in any language, while `answer` is the shown position of the
 * right option.
 */
function quizSet(topic, count, rng) {
  var pool = topic && topic !== 'mixed' ? QUIZ.filter(function (x) { return x.topic === topic; }) : QUIZ;
  return core.pick(pool, count || 5, rng).map(function (item) {
    var order = core.shuffle(item.options.map(function (_, i) { return i; }), rng);
    return { id: item.id, topic: item.topic, order: order, answer: order.indexOf(item.answer) };
  });
}

export { CS_WORDS, HOME_ROW, LETTER_DRILLS, SENTENCES, PUNCTUATION, SYMBOLS, CODE, QUIZ, QUIZ_TOPICS, MODES, buildPractice, dailyChallenge, quizSet, vocabulary };
