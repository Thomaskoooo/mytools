/*
 * Centralized tool registry — single source of truth for homepage, /tools,
 * category pages and global search. Do not duplicate tool metadata elsewhere.
 */
window.MT_CATEGORIES = [
  { id: 'networking', name: 'Networking', description: 'IP, subnet and DNS tools for network admins.', icon: 'network' },
  { id: 'development', name: 'Development', description: 'JSON, Base64, JWT and other dev utilities.', icon: 'code' },
  { id: 'text', name: 'Text', description: 'Count, convert and generate text.', icon: 'type' },
  { id: 'generators', name: 'Generators', description: 'Passwords, QR codes, UUIDs and more.', icon: 'shuffle' },
  { id: 'converters', name: 'Converters', description: 'Number bases, URLs and HTML entities.', icon: 'shuffle' },
  { id: 'security', name: 'Security', description: 'Hashes, status codes and regex testing.', icon: 'shield' }
];

window.MT_TOOLS = [
  {
    id: 'ip-calculator', name: 'IPv4 Calculator',
    description: 'Calculate network, broadcast, host range and CIDR details for any IPv4 address.',
    category: 'networking', icon: 'calculator', url: '/tools/ip-calculator/',
    tags: ['ip', 'subnet', 'cidr', 'netmask', 'network'], popular: true, local: true
  },
  {
    id: 'vlsm-calculator', name: 'VLSM Calculator',
    description: 'Split a network into optimal variable-length subnets based on host requirements.',
    category: 'networking', icon: 'network', url: '/tools/vlsm-calculator/',
    tags: ['vlsm', 'subnet', 'cidr', 'network', 'ip'], popular: false, local: true
  },
  {
    id: 'ip-info', name: 'IP Address Information',
    description: 'Inspect an IPv4 address: binary, hex, class, and private/public status.',
    category: 'networking', icon: 'globe', url: '/tools/ip-info/',
    tags: ['ip', 'binary', 'hex', 'class', 'network'], popular: false, local: true
  },
  {
    id: 'dns-lookup', name: 'DNS Lookup',
    description: 'Look up A, AAAA, MX, CNAME, NS and TXT records for any domain.',
    category: 'networking', icon: 'globe', url: '/tools/dns-lookup/',
    tags: ['dns', 'domain', 'mx', 'txt', 'ns', 'records'], popular: true, local: false
  },
  {
    id: 'http-headers', name: 'HTTP Headers Checker',
    description: 'Inspect the HTTP status, response headers and redirects of any URL.',
    category: 'networking', icon: 'link', url: '/tools/http-headers/',
    tags: ['http', 'headers', 'status', 'redirects'], popular: false, local: false
  },
  {
    id: 'json-formatter', name: 'JSON Formatter',
    description: 'Format, minify and validate JSON with clear syntax highlighting.',
    category: 'development', icon: 'code', url: '/tools/json-formatter/',
    tags: ['json', 'format', 'validate', 'minify', 'pretty print'], popular: true, local: true
  },
  {
    id: 'base64', name: 'Base64 Encoder / Decoder',
    description: 'Encode text to Base64 or decode Base64 back to readable UTF-8 text.',
    category: 'development', icon: 'code', url: '/tools/base64/',
    tags: ['base64', 'encode', 'decode'], popular: true, local: true
  },
  {
    id: 'jwt-decoder', name: 'JWT Decoder',
    description: 'Decode a JSON Web Token and inspect its header, payload and claims.',
    category: 'development', icon: 'key', url: '/tools/jwt-decoder/',
    tags: ['jwt', 'json web token', 'decode', 'auth'], popular: true, local: true
  },
  {
    id: 'uuid-generator', name: 'UUID Generator',
    description: 'Generate one or many RFC 4122 version 4 UUIDs.',
    category: 'development', icon: 'shuffle', url: '/tools/uuid-generator/',
    tags: ['uuid', 'guid', 'generator', 'identifier'], popular: true, local: true
  },
  {
    id: 'hash-generator', name: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes from text.',
    category: 'development', icon: 'hash', url: '/tools/hash-generator/',
    tags: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'checksum'], popular: false, local: true
  },
  {
    id: 'text-counter', name: 'Text Counter',
    description: 'Count characters, words, sentences, lines and paragraphs in real time.',
    category: 'text', icon: 'type', url: '/tools/text-counter/',
    tags: ['text', 'word count', 'character count'], popular: false, local: true
  },
  {
    id: 'case-converter', name: 'Case Converter',
    description: 'Convert text between UPPERCASE, camelCase, snake_case and more.',
    category: 'text', icon: 'type', url: '/tools/case-converter/',
    tags: ['case', 'camelcase', 'snake_case', 'text'], popular: false, local: true
  },
  {
    id: 'lorem-ipsum', name: 'Lorem Ipsum Generator',
    description: 'Generate placeholder paragraphs, sentences or words for mockups.',
    category: 'text', icon: 'type', url: '/tools/lorem-ipsum/',
    tags: ['lorem ipsum', 'placeholder', 'text', 'dummy text'], popular: false, local: true
  },
  {
    id: 'password-generator', name: 'Password Generator',
    description: 'Generate strong random passwords with adjustable length and character sets.',
    category: 'generators', icon: 'key', url: '/tools/password-generator/',
    tags: ['password', 'generator', 'security', 'random'], popular: true, local: true
  },
  {
    id: 'qr-generator', name: 'QR Code Generator',
    description: 'Turn any text or URL into a downloadable QR code.',
    category: 'generators', icon: 'qrcode', url: '/tools/qr-generator/',
    tags: ['qr', 'qr code', 'generator'], popular: true, local: true
  },
  {
    id: 'timestamp', name: 'Timestamp Converter',
    description: 'Convert between Unix timestamps and human-readable dates.',
    category: 'generators', icon: 'clock', url: '/tools/timestamp/',
    tags: ['unix', 'timestamp', 'epoch', 'date'], popular: true, local: true
  },
  {
    id: 'number-base-converter', name: 'Number Base Converter',
    description: 'Convert numbers between binary, decimal, hexadecimal and octal.',
    category: 'converters', icon: 'calculator', url: '/tools/number-base-converter/',
    tags: ['binary', 'hex', 'octal', 'decimal', 'base converter'], popular: false, local: true
  },
  {
    id: 'url-encoder', name: 'URL Encoder / Decoder',
    description: 'Percent-encode or decode text and URL components.',
    category: 'converters', icon: 'link', url: '/tools/url-encoder/',
    tags: ['url', 'encode', 'decode', 'percent encoding'], popular: false, local: true
  },
  {
    id: 'html-entity-encoder', name: 'HTML Entity Encoder',
    description: 'Encode or decode HTML entities such as &lt; &gt; &amp; and quotes.',
    category: 'converters', icon: 'code', url: '/tools/html-entity-encoder/',
    tags: ['html', 'entities', 'encode', 'decode'], popular: false, local: true
  },
  {
    id: 'http-status-lookup', name: 'HTTP Status Code Lookup',
    description: 'Look up the meaning and common usage of any HTTP status code.',
    category: 'security', icon: 'list', url: '/tools/http-status-lookup/',
    tags: ['http', 'status code', 'reference'], popular: false, local: true
  },
  {
    id: 'regex-tester', name: 'Regex Tester',
    description: 'Test regular expressions against text with live match highlighting.',
    category: 'security', icon: 'wand', url: '/tools/regex-tester/',
    tags: ['regex', 'regular expression', 'testing'], popular: true, local: true
  }
];

function mtCategoryName(id) {
  var c = window.MT_CATEGORIES.find(function (c) { return c.id === id; });
  return c ? c.name : id;
}
