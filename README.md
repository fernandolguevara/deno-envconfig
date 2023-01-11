# envconfig

this library is based on
[envconfig](https://github.com/kelseyhightower/envconfig) for gloang

## marks

### types

```md
- `string
- `bool
- `number
- `date
```

### val

```md
- `required
- `max
- `min
```

### modifiers

```
`env
```

```ts
const env = { MYAPP_PORT: "3003" };
const envconfig = {
  port: "`env:MYAPP_PORT`number`default:3000",
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { port: 3000 }
```

```
`prefix
```

```ts
const env = { MYAPP_PORT: "3003" };
const envconfig = {
  port: "`prefix:MYAPP`number`default:3000",
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { port: 3000 }
```

```
`prefix
```

```ts
const env = { MYAPP_PORT_AWESOME: "3003" };
const envconfig = {
  port: "`prefix:MYAPP`suffix:AWESOME`number`default:3000",
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { port: 3000 }
```

```
`split_words
```

```ts
const env = { MYAPP_PORT_AWESOME: "3003" };
const envconfig = {
  myappPortAwesome: "`split_words`number`default:3000",
  // lookup "myapp_port_awesome" on env object
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { port: 3000 }
```

```
`split_values
```

```ts
const env = { LIST: "1,2,3" };
const envconfig = {
  list: "`split_value`number`default:4,5,6",
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { list: [1,2,3] }
```

```
`uppercase
```

```ts
const env = { super_key: "uppercase" };
const envconfig = {
  super_key: "`uppercase`string",
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { super_key: "UPPERCASE" }
```

```
`lowercase
```

```ts
const env = { super_key: "LOWERCASE" };
const envconfig = {
  super_key: "`lowercase`string",
} as const;
const e = parse(env, envconfig);
console.log(e);
// output = { super_key: "lowercase" }
```

- `format

### Alises

```
- `string[] = `string`split_values
- `bool[] = `bool`split_values
- `date[] = `date`split_values
- `number[] = `number`split_values
```

## Example

```ts
const _envconfig = {
  log: {
    level: "`string`default:DEBUG",
  },
  server: {
    hostname: "`string`default:0.0.0.0",
    port: "`default:3003`number",
  },
  app: {
    name: "`string`default:my-app",
    description: "`string`default:my awesome app",
    contact: "`string`default:~",
    version: "`string`default:~",
  },
  db: {
    type: "`string`default:memory",
    createSchema: "`bool`split_words`default:true",
    dropSchemaIfExists: "`bool`split_words`default:true",
    shared: {
      __prefix: "",
      hostname: "`string",
      port: "`number`default:-1",
      user: "`string",
      password: "`string",
      database: "`string",
    },
    sqlite: {
      path: "`string`default::memory:",
    },
    mysql: {
      connectionLimit: "`number`split_words`default:4",
    },
    postgres: {
      applicationName: "`string`split_words`default:deno-nostr",
      connectionsAttemps: "`number`split_words`default:1",
      hostType: "`string`split_words`default:tcp",
      tlsEnforce: "`bool`split_words`default:false",
      maxIndexKeys: "`string`default:32",
    },
  },
} as const;
// using "as const" the parse function generates the output structure
// check the examples/envconfig.ts folder

const env = Deno.env.toObject();

const e = parse(env, _envconfig);

console.log(e);
```

```js
{
  log: { level: "DEBUG" },
  server: { hostname: "0.0.0.0", port: 3003 },
  app: {
    name: "my-app",
    description: "my awesome app",
    contact: "~",
    version: "~",
  },
  db: {
    type: "memory",
    createSchema: true,
    dropSchemaIfExists: true,
    shared: {
      hostname: undefined,
      port: -1,
      user: undefined,
      password: undefined,
      database: undefined,
    },
    sqlite: { path: ":memory:" },
    mysql: { connectionLimit: 4 },
    postgres: {
      applicationName: "my-app",
      connectionsAttemps: 1,
      hostType: "tcp",
      tlsEnforce: false,
      maxIndexKeys: "32",
    },
  },
}
```

### IntelliSense

parse function generates the output structure when "as const" is used on the
configuration object

check the [examples/envconfig.ts](/examples/envconfig.ts) folder
