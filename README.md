# @wana/babel-plugin-add-react-displayname

Set the `displayName` property of your higher-order function components, using a Babel plugin! 🥳

- Plain function components are skipped, since they have good support in React devtools.
- Class components are **not** supported.

Forked from: [opbeat/babel-plugin-add-react-displayname](https://github.com/opbeat/babel-plugin-add-react-displayname)

Works with **Babel 7.0.0+**

### Install

```sh
npm install @wana/babel-plugin-add-react-displayname
```

And in `.babelrc` or whatever:

```json
{
    "plugins": [
        "@wana/add-react-displayname"
    ]
}
```
