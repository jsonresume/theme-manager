# Json Resume
## Theme Manager

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

### Getting started

