## JResume - Theme Manager

Welcome to anybody looking to build themes for resume.json that are compatible with the registry and CLI. 

The theme manager can be thought of as a meta-layer on top of the NPM registry.

All themes are simply NPM modules that are named with a jsonresume naming convention.

They are expected to take a resume.json as an input and simply to return a HTML output.

An example theme can be found [here](https://github.com/jsonresume/jsonresume-theme-modern), it is the default template for jsonresume.org.

You can find it on NPM [here](https://www.npmjs.org/package/jsonresume-theme-modern)

The themeing server exposes a way to browse themes and their versions by loading in a demo resume.json e.g.

[http://themes.jsonresume.org/theme/modern](http://themes.jsonresume.org/theme/modern)

You can choose which version of the theme runs by using the `@` symbol e.g.

[http://themes.jsonresume.org/theme/modern@0.0.14](http://themes.jsonresume.org/theme/modern@0.0.14)
[http://themes.jsonresume.org/theme/modern@0.0.15](http://themes.jsonresume.org/theme/modern@0.0.15)

If you leave off a version, it will always pull the latest from NPM. This will be the case for your theme users, who can either lock themselves into a version of your theme or prefer to always just use your latest changes.

### Getting started

