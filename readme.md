# cssy
[![Build Status](https://secure.travis-ci.org/nopnop/cssy.png?branch=master)](http://travis-ci.org/nopnop/cssy) [![NPM version](https://badge-me.herokuapp.com/api/npm/cssy.png)](http://badges.enytc.com/for/npm/cssy)

> A browserify transform for css (with vitamins): Use css sources **like any other module** but **without forgo** the benefits of **pre-processing** and **live source reload**.


## Features

- **Require css as any other commonjs module**: `require('foo/common.css')`.
- **Pre/post processing**: Cssy is framework-agnostic:
  - Use any  [post/pre-processor](https://developer.chrome.com/devtools/docs/css-preprocessors) you like ([rework](https://github.com/reworkcss/rework), [postcss](https://github.com/postcss/postcss),  [less](http://lesscss.org/), [sass](http://sass-lang.com/), etc.)
  - At package level, you encapsulate your *css secret cooking* and export only css.
  - At application level you can do **global processing** things like global `url()` rebasing.
- **A nice API to read, insert, update or remove**: Use the exported css wherever you want and as you like:
  - `require('foo/bar.css')` To get the source when used as a string value (thanks to [toString](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString))
  - `require('foo/bar.css')()` To insert the css in document's head
  - `require('foo/bar.css')(elsewhere)` To insert elsewhere (why not a [shadow root](http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-201/) for instance...)
  - `require('foo/bar.css')(el, '(max-width: 600px)')` With [CSS media-query](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Media_queries) ...
  - `require('foo/bar.css').update('.button { ... }')` To update **all** the inserted instance.  
- **@import**: If enabled, the css at-rule [@import](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) works like a `require()` of another css module.
- **Source map**: If enabled, cssy inject a [source map](https://developer.chrome.com/devtools/docs/css-preprocessors).
- **Live source reload**: Provide a simple http(s) server hook to live reload source in development environnement.
- **Regex filter**: Configurable, you can apply cssy's transform selectively (usefull to handle pre-transformed source like sass, less, styl, etc.)

Want a nice cocktail recipe ? Use **source map** in combination with cssy's **live source reload feature** and chrome's [in-browser edition](https://developer.chrome.com/devtools/docs/workspaces).


## Installation

```bash
npm install --save cssy
```
Then add cssy to your [browserify transform field](https://github.com/substack/node-browserify#browserifytransform).


## Overview

```javascript

var myCss = require('./my.css');

// Read source
console.log('Source: %s', myCss); //

// Insert css source in the document headers:
myCss(); // Shortcut for myCss.insert([element,[media query]])

// Insert css source into another node:
var el = document.createElement('template')
myCss(el);

// Insert css source with a media query:
myCss(null,'(max-width: 800px)');

// Change css source:
myCss.update('body { ... }');

// Remove
var c = myCss();
c.remove();

// Watch for changes:
//   When .update() is called by you or by the cssy's
//   live-reload server (if enabled)
myCss.onChange(function() { })

```


## Usage

**Add cssy transform to your `package.json`**. Encapsulate your css processing logic inside your package: use [browserify.transform field](https://github.com/substack/browserify-handbook#browserifytransform-field).

```javascript
{
  // ... package.json ...
  "browserify": {
    "transform": [
      [ "cssy", {  /* options */ } ]
    ]
  }
}
```

### Cssy options

- `processor` **{String}**: Path to a [Css processor](#css-processor)
- `noImport` **{Boolean}**: Prevent [@import](#import-css) behavior


## Cssy processor

For cssy, a *processor* is an asynchronous function that transform a **context object**:

```javascript
module.exports = function (context, callback) {
  // ... do whatever your want with context ...

  // Success (node-standard async callback)
  callback(null, context)
  // Or if something wrong happened
  callback(new Error('oups...'))
}
```

Like [Browserify's transform](https://github.com/substack/node-browserify#btransformopts-tr) Cssy processor are applied only on sources of the current package. (See too [Global pre/post processor](#Global pre/post processor))

### Processor `context object` provided by cssy

  - `src` **{String}**: Css source
  - `map` **{Object}**: The [css source map](https://www.google.com/search?q=Source+Map+Revision+3+proposal)
  - `filename` **{String}**: Css source filepath (relative to `process.cwd()`)
  - `config` **{Object}**: The cssy's [transform configuration](https://github.com/substack/browserify-handbook#configuring-transforms)

### Add a processor: the `processor` option

Use `processor` option in your [transform configuration](https://github.com/substack/browserify-handbook#configuring-transforms):

```javascript
  "browserify": {
    "transform": [
      // Path to a module relative to current package.json ...
      [ "cssy", {  "processor": "./support/myCssProcessor" } ]
      // ... or a npm dependency
      [ "cssy", {  "processor": "foobar" } ]
    ]
  }
```

### Processor example
Here with [postcss](https://github.com/postcss/postcss) but you can use any other library (Preferably with good source-map support)

```javascript
var autoprefixer     = require('autoprefixer');
var postcssCalc      = require('postcss-calc');
var customProperties = require("postcss-custom-properties")
var postcss          = require('postcss');

module.exports = function(ctx, done) {
  var result = postcss()
    .use(customProperties())
    .use(postcssCalc())
    .use(autoprefixer.postcss)
    .process(ctx.src, {
      map : { prev : ctx.map } // Preserve source map !
    });

  ctx.src = result.css;
  ctx.map = result.map.toJSON();

  done(null, ctx)
}
```

## Cssy configuration at application level

```javascript
var cssy = require('cssy')
cssy.config({
  // Enable css minification (default: false)
  minify:  false,
  // Enable source map in the generated source (default: true)
  sourcemap: true
})
```

Css minification is done with [CSSWring](https://github.com/hail2u/node-csswring). Feel free to use another one inside a global post-processor.

## Global pre/post processor

Use global pre/post processor must be used only at application level (where you bundle your application) for things like global `url()` rebasing, optimizations for production, etc. Pre/post processor share the same api than [cssy processor](Cssy processor).

```javascript
var cssy = require('cssy')

// Add one or many pre-processors
cssy.pre(function(ctx, done) {
  // ... Applied on every source handled by cssy
})

// Add one or many post-processors
cssy.post(function(ctx, done) {
  // ... Applied on every source handled by cssy
})

```
(TODO: Add a test and a example of url() rebasing)


## Live source reload

**Cssy provide a tiny live source reload mechanism based on websocket for development purpose only.**

Classic live source reload for css usually require that all (builded) css source are accessible via an url. This is not convenient with bundled css sources that comes from anywhere in the dependency tree. And this is almost impraticable if css sources are injected somewhere else than the main document (shadow root for instance) without reloading all the page.

**Just attach cssy to the http(s) server that serve the application, cssy will do the rest:** (browserify bundler must in the same process):

```javascript
var http   = require('http')
var cssy   = require('cssy')
var server = http.createServer(/* your application */).listen(8080);

cssy.live(server);
```


### Use your own file watcher

To trigger a change on a css source, just call the change listener returned by `cssy.attachServer()` :

```javascript
var cssyChangeListener = cssy.attachServer(server);
cssyChangeListener('path/to/source.css');
```

Here is an example with [chockidar](https://github.com/paulmillr/chokidar) :

```javascript
require('chokidar')
  .watch('.', {ignored: /[\/\\]\./})
  .on('change', cssy.attachServer(server))
```

## Import css
*(doc in progress)*

## Css module API
*(doc in progress)*

## Regex filter
*(doc in progress)*


## License
The [MIT license](./LICENSE)
