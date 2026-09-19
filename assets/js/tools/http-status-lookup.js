(function () {
  'use strict';

  var STATUSES = [
    { code: 100, name: 'Continue', description: 'The server has received the request headers and the client should proceed to send the request body. It lets a client avoid sending a large body before knowing the server will accept the request.' },
    { code: 101, name: 'Switching Protocols', description: 'Sent in response to an Upgrade header, indicating the server is switching to the protocol the client requested, such as upgrading a connection from HTTP to WebSocket.' },
    { code: 102, name: 'Processing', description: 'A WebDAV interim response indicating the server has accepted the request but has not yet completed it, used to prevent the client from timing out on long-running operations.' },
    { code: 103, name: 'Early Hints', description: 'Lets the server send preliminary headers, such as Link headers for preloading resources, before the final response is ready, so the browser can start fetching assets earlier.' },
    { code: 200, name: 'OK', description: 'The standard response for a successful HTTP request. The meaning of "success" depends on the HTTP method: for GET the resource was fetched, for POST the result of the action is included in the response.' },
    { code: 201, name: 'Created', description: 'The request succeeded and a new resource was created as a result, typically returned after a POST or PUT request, often with a Location header pointing to the new resource.' },
    { code: 202, name: 'Accepted', description: 'The request has been accepted for processing but that processing has not completed, commonly used for asynchronous or batch operations that finish later.' },
    { code: 203, name: 'Non-Authoritative Information', description: 'The request succeeded but the returned metadata is not exactly the same as from the origin server, typically because a transforming proxy modified it.' },
    { code: 204, name: 'No Content', description: 'The server successfully processed the request but is not returning any content, often used for DELETE requests or actions where the client does not need updated data.' },
    { code: 205, name: 'Reset Content', description: 'Tells the client to reset the document view that sent the request, for example clearing a form after a successful submission.' },
    { code: 206, name: 'Partial Content', description: 'The server is delivering only part of the resource due to a Range header sent by the client, commonly used for resumable downloads and video streaming.' },
    { code: 207, name: 'Multi-Status', description: 'A WebDAV response conveying information about multiple independent operations in a single response body, each with its own status code.' },
    { code: 208, name: 'Already Reported', description: 'Used inside a WebDAV multi-status response to avoid repeatedly enumerating the members of a binding that were already reported earlier in the same response.' },
    { code: 226, name: 'IM Used', description: 'The server fulfilled the request and the response represents the result of one or more instance-manipulations applied to the current instance, as defined by the HTTP Delta encoding extension.' },
    { code: 300, name: 'Multiple Choices', description: 'The request has more than one possible response and the user agent or user should choose one, for example when content negotiation cannot determine a single best representation.' },
    { code: 301, name: 'Moved Permanently', description: 'The requested resource has been permanently moved to a new URL given in the Location header. Search engines and clients should update their links to the new address.' },
    { code: 302, name: 'Found', description: 'The resource temporarily resides at a different URL. Unlike a 301, clients should keep using the original URL for future requests since the move is not permanent.' },
    { code: 303, name: 'See Other', description: 'Tells the client to retrieve the requested resource at another URI using a GET request, commonly used to redirect after a POST so a page refresh does not resubmit the form.' },
    { code: 304, name: 'Not Modified', description: 'Indicates the cached version of the requested resource is still valid, based on conditional headers like If-None-Match, so the client should use its cached copy instead of downloading again.' },
    { code: 305, name: 'Use Proxy', description: 'Deprecated: indicated the requested resource had to be accessed through the proxy given in the response. Removed from modern specifications due to security concerns.' },
    { code: 307, name: 'Temporary Redirect', description: 'Like 302, but guarantees the client will repeat the same HTTP method and body on the new URL instead of possibly switching to GET.' },
    { code: 308, name: 'Permanent Redirect', description: 'Like 301, but guarantees the client will repeat the same HTTP method and body on the new URL, making it the method-preserving equivalent of a permanent redirect.' },
    { code: 400, name: 'Bad Request', description: 'The server cannot process the request due to a client error, such as malformed request syntax, invalid request message framing, or deceptive request routing.' },
    { code: 401, name: 'Unauthorized', description: 'The request lacks valid authentication credentials for the target resource. Despite the name, this is about authentication, not authorization — the client must first identify itself.' },
    { code: 402, name: 'Payment Required', description: 'Reserved for future use; originally intended for digital payment systems. Some APIs repurpose it today to indicate a payment is required to access the resource.' },
    { code: 403, name: 'Forbidden', description: 'The server understood the request and identified the client but refuses to authorize it. Unlike 401, re-authenticating will not help — the client simply lacks permission.' },
    { code: 404, name: 'Not Found', description: 'The server cannot find the requested resource. One of the most common status codes, returned for broken links, mistyped URLs, or resources that were removed.' },
    { code: 405, name: 'Method Not Allowed', description: 'The request method is known by the server but is not supported by the target resource, for example sending a DELETE to an endpoint that only accepts GET and POST.' },
    { code: 406, name: 'Not Acceptable', description: 'The server cannot produce a response matching the list of acceptable values defined in the request\'s content negotiation headers, such as Accept or Accept-Language.' },
    { code: 407, name: 'Proxy Authentication Required', description: 'Similar to 401, but authentication must be done with a proxy server that sits between the client and the server, identified by the Proxy-Authenticate header.' },
    { code: 408, name: 'Request Timeout', description: 'The server timed out waiting for the request from the client, either because the client took too long or the connection was idle for too long.' },
    { code: 409, name: 'Conflict', description: 'The request conflicts with the current state of the target resource, commonly seen with edit conflicts, duplicate resource creation, or version mismatches.' },
    { code: 410, name: 'Gone', description: 'The requested resource is no longer available and this condition is expected to be permanent, unlike 404 which does not indicate whether the absence is temporary or permanent.' },
    { code: 411, name: 'Length Required', description: 'The server refuses to accept the request without a defined Content-Length header, which some servers require to properly handle the request body.' },
    { code: 412, name: 'Precondition Failed', description: 'One or more conditions in the request\'s header fields, such as If-Match or If-Unmodified-Since, evaluated to false, so the server refused to perform the request.' },
    { code: 413, name: 'Payload Too Large', description: 'The request body is larger than the server is willing or able to process, often used to reject oversized file uploads.' },
    { code: 414, name: 'URI Too Long', description: 'The URI requested by the client is longer than the server is willing to interpret, sometimes caused by a client converting a POST into a GET with a huge query string.' },
    { code: 415, name: 'Unsupported Media Type', description: 'The server refuses to accept the request because the payload format, indicated by the Content-Type header, is not supported for this endpoint or method.' },
    { code: 416, name: 'Range Not Satisfiable', description: 'The client asked for a byte range of a resource that is outside the bounds of the actual data, typically when resuming a download with an invalid Range header.' },
    { code: 417, name: 'Expectation Failed', description: 'The server cannot meet the requirements of the Expect request-header field, most commonly seen with the "Expect: 100-continue" mechanism.' },
    { code: 418, name: "I'm a Teapot", description: 'An April Fools\' joke status code defined in RFC 2324 (the Hyper Text Coffee Pot Control Protocol), returned by a teapot asked to brew coffee. It has no real-world use in production APIs but is occasionally used as an easter egg.' },
    { code: 421, name: 'Misdirected Request', description: 'The request was directed at a server that is not able to produce a response, for example because a connection was reused for a domain it does not serve.' },
    { code: 422, name: 'Unprocessable Content', description: 'The server understands the content type and syntax of the request but was unable to process the contained instructions, commonly used for semantic validation errors in APIs.' },
    { code: 423, name: 'Locked', description: 'A WebDAV response indicating the source or destination resource of a method is locked, preventing the requested operation from completing.' },
    { code: 424, name: 'Failed Dependency', description: 'A WebDAV response indicating the method could not be performed because a dependent action, earlier in the same request chain, failed.' },
    { code: 425, name: 'Too Early', description: 'The server is unwilling to risk processing a request that might be replayed, used to protect against replay attacks on requests sent during TLS early data.' },
    { code: 426, name: 'Upgrade Required', description: 'The server refuses to perform the request using the current protocol but might be willing to after the client upgrades, indicated via the Upgrade header.' },
    { code: 428, name: 'Precondition Required', description: 'The origin server requires the request to be conditional, intended to prevent the "lost update" problem where a client overwrites changes made by another client.' },
    { code: 429, name: 'Too Many Requests', description: 'The client has sent too many requests in a given time period, the standard status code for rate limiting. A Retry-After header often tells the client when to try again.' },
    { code: 431, name: 'Request Header Fields Too Large', description: 'The server refuses to process the request because its header fields are too large, either from one field being oversized or the total header size exceeding a limit.' },
    { code: 451, name: 'Unavailable For Legal Reasons', description: 'The server operator has received a legal demand to deny access to the resource, such as a court order or government censorship request. Named after Ray Bradbury\'s novel Fahrenheit 451.' },
    { code: 500, name: 'Internal Server Error', description: 'A generic error indicating the server encountered an unexpected condition that prevented it from fulfilling the request. The most common catch-all error for unhandled exceptions.' },
    { code: 501, name: 'Not Implemented', description: 'The server does not support the functionality required to fulfill the request, typically returned when the server does not recognize the request method at all.' },
    { code: 502, name: 'Bad Gateway', description: 'The server, acting as a gateway or proxy, received an invalid response from an upstream server it needed to access to fulfill the request.' },
    { code: 503, name: 'Service Unavailable', description: 'The server is temporarily unable to handle the request, usually due to maintenance or overload. A Retry-After header can indicate when to try again.' },
    { code: 504, name: 'Gateway Timeout', description: 'The server, acting as a gateway or proxy, did not receive a timely response from an upstream server it needed to access to complete the request.' },
    { code: 505, name: 'HTTP Version Not Supported', description: 'The HTTP version used in the request is not supported by the server, usually returned when a client sends a request using a very old or very new protocol version.' },
    { code: 506, name: 'Variant Also Negotiates', description: 'Indicates a server-side configuration error where transparent content negotiation results in a circular reference, so the chosen variant resource is itself configured to negotiate.' },
    { code: 507, name: 'Insufficient Storage', description: 'A WebDAV response indicating the server is unable to store the representation needed to complete the request because it has run out of storage space.' },
    { code: 508, name: 'Loop Detected', description: 'A WebDAV response indicating the server terminated an operation because it detected an infinite loop while processing a request with "Depth: infinity".' },
    { code: 510, name: 'Not Extended', description: 'Further extensions to the request are required for the server to fulfill it, referring to the HTTP Extension Framework defined in RFC 2774.' },
    { code: 511, name: 'Network Authentication Required', description: 'The client needs to authenticate to gain network access, typically returned by captive portals on public Wi-Fi networks instead of the actual requested resource.' }
  ];

  var STATUS_MAP = {};
  STATUSES.forEach(function (s) { STATUS_MAP[s.code] = s; });

  function categoryFor(code) {
    var digit = Math.floor(code / 100);
    switch (digit) {
      case 1: return 'Informational';
      case 2: return 'Success';
      case 3: return 'Redirection';
      case 4: return 'Client Error';
      case 5: return 'Server Error';
      default: return 'Unknown';
    }
  }

  function categoryColors(category) {
    switch (category) {
      case 'Informational': return { bg: 'var(--accent-soft)', fg: 'var(--accent)' };
      case 'Success': return { bg: 'var(--success-soft)', fg: 'var(--success)' };
      case 'Redirection': return { bg: 'var(--warning-soft)', fg: 'var(--warning)' };
      case 'Client Error': return { bg: 'var(--danger-soft)', fg: 'var(--danger)' };
      case 'Server Error': return { bg: 'var(--danger-soft)', fg: 'var(--danger)' };
      default: return { bg: 'var(--accent-soft)', fg: 'var(--accent)' };
    }
  }

  function showError(msg) {
    var box = document.getElementById('hsl-error');
    box.textContent = msg;
    box.classList.add('visible');
    document.getElementById('hsl-result').style.display = 'none';
  }

  function hideError() {
    var box = document.getElementById('hsl-error');
    box.textContent = '';
    box.classList.remove('visible');
  }

  function renderResult(status) {
    var category = categoryFor(status.code);
    var colors = categoryColors(category);
    var result = document.getElementById('hsl-result');
    result.innerHTML =
      '<div class="result-item" style="flex-direction:column; align-items:flex-start; gap:8px">' +
        '<div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">' +
          '<span class="r-value" style="font-size:1.3rem">' + status.code + ' ' + mtEscapeHtml(status.name) + '</span>' +
          '<span class="badge" style="background:' + colors.bg + '; color:' + colors.fg + '; border-color:transparent">' + mtEscapeHtml(category) + '</span>' +
          '<button class="copy-mini" type="button" id="hsl-copy-btn" aria-label="Copy status code and name">' + mtIcon('copy') + '</button>' +
        '</div>' +
        '<p style="margin:0; color:var(--text-muted)">' + mtEscapeHtml(status.description) + '</p>' +
      '</div>';
    result.style.display = 'flex';
    result.style.flexDirection = 'column';
    document.getElementById('hsl-copy-btn').addEventListener('click', function () {
      mtCopy(status.code + ' ' + status.name);
    });
  }

  function lookup(rawValue) {
    hideError();
    var value = (rawValue !== undefined ? rawValue : document.getElementById('hsl-input').value).trim();

    if (value === '') {
      showError('Enter a status code to look up, e.g. 404.');
      return;
    }
    if (!/^\d+$/.test(value)) {
      showError(value + ' is not a valid HTTP status code. Enter a number between 100 and 599.');
      return;
    }
    var code = parseInt(value, 10);
    if (code < 100 || code > 599) {
      showError(code + ' is not a valid HTTP status code. Status codes range from 100 to 599.');
      return;
    }
    var status = STATUS_MAP[code];
    if (!status) {
      showError(code + ' is not a registered HTTP status code.');
      return;
    }
    renderResult(status);
  }

  function buildTable() {
    var order = ['Informational', 'Success', 'Redirection', 'Client Error', 'Server Error'];
    var rows = [];
    order.forEach(function (category) {
      STATUSES.filter(function (s) { return categoryFor(s.code) === category; }).forEach(function (s) {
        rows.push(
          '<tr class="hsl-row" data-code="' + s.code + '" tabindex="0" style="cursor:pointer">' +
            '<td>' + s.code + '</td><td>' + mtEscapeHtml(s.name) + '</td><td>' + mtEscapeHtml(category) + '</td>' +
          '</tr>'
        );
      });
    });
    document.getElementById('hsl-table-body').innerHTML = rows.join('');

    document.querySelectorAll('.hsl-row').forEach(function (row) {
      var activate = function () {
        var code = row.getAttribute('data-code');
        document.getElementById('hsl-input').value = code;
        lookup(code);
        document.getElementById('hsl-result').scrollIntoView({ behavior: 'smooth', block: 'center' });
      };
      row.addEventListener('click', activate);
      row.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildTable();

    document.getElementById('hsl-lookup').addEventListener('click', function () { lookup(); });
    document.getElementById('hsl-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') lookup();
    });
    document.getElementById('hsl-clear').addEventListener('click', function () {
      document.getElementById('hsl-input').value = '';
      hideError();
      document.getElementById('hsl-result').style.display = 'none';
    });

    document.getElementById('hsl-input').value = '404';
    lookup('404');
  });
})();
