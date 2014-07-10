
## Json Resume - Theme Manager

Welcome to anybody looking to build themes for resume.json that are compatible with the registry and CLI. 

The theme manager can be thought of as a meta-layer on top of the NPM registry.

All themes are simply NPM modules that are named as `jsonresume-theme-{{themeName}}`

They are expected to take a resume.json as an input and simply to return a HTML output.

[Example Theme Repo](https://github.com/jsonresume/jsonresume-theme-modern)

[Example Theme on NPM](https://www.npmjs.org/package/jsonresume-theme-modern)

You can browse themes and their versions by loading in a demo resume.json e.g.

[http://themes.jsonresume.org/theme/modern](http://themes.jsonresume.org/theme/modern)

You can also choose which version of the theme runs e.g.

[http://themes.jsonresume.org/theme/modern@0.0.14](http://themes.jsonresume.org/theme/modern@0.0.14)

[http://themes.jsonresume.org/theme/modern@0.0.15](http://themes.jsonresume.org/theme/modern@0.0.15)

If you leave off a version, it will always pull the latest from NPM. This will be the case for your theme users, who can either lock themselves into a version of your theme or prefer to always just use your latest changes.

As soon as you publish, the registry will automatically start using your latest version.

### Getting started

At anytime you can just copy the files out of the default theme repository to get started.

You will need to create a new folder called `jsonresume-theme-{{yourThemeName}}`

Change into this directory then type;

```
npm init
```

It should try to name your package as `jsonresume-theme-{{yourThemeName}}`

Then edit index.js and add
```js
function render (resume) {
	return 'my template';
}
module.exports = { render: render };

```

**Success!** You have created your first theme

Now publish your theme

```
npm publish
```

**Excellent!** You should just be able to go to http://themes.jsonresume.org/theme/{{yourThemeName}}

If your familiar with NPM publishing, you can have this up and running in less than 30 seconds.

Anyone using the resume and CLI tool will also be able to use your theme now.

### Now what?

You can do what ever you want essentially, just make sure you return HTML

There are a few quirks that you should join #jsonresume on freenode to discuss

The `resume-schema` repository actually has an example resume attached as an export so you can

```js
npm install --save resume-schema

// index.js
var schema = require('resume-schema');
var resume = schema.resumeJson; 
// resume will now be an example resume object
// Use it while your developing
```

Here is a [list of themes](http://node-modules.com/search?q=jsonresume-theme-*)


